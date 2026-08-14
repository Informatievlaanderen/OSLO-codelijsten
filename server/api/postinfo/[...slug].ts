import axios from 'axios'
import {
  SUPPORTED_FORMATS,
  SUPPORTED_EXTENSIONS,
  BASISREGISTERS_API_BASE,
} from '~/constants/constants'
import type {
  PostinfoData,
  PostinfoConcept,
  PostinfoGemeente,
} from '~/types/postinfo'
import { POSTINFO_FIELD_URIS } from '~/server/utils/postinfo-predicate-uris'
import { postinfoDataToQuads } from '~/server/services/postinfo-serialization.service'
import { serializeQuadsToString } from '~/services/serialization.service'

const getLocalizedValue = (
  arr: { '@value'?: string; '@language'?: string }[] | undefined,
): string | undefined => {
  if (!arr || !Array.isArray(arr)) return undefined
  const first = arr.find((v) => v['@value'])
  return first?.['@value']
}

const getConcept = (obj: any): PostinfoConcept | undefined => {
  if (!obj) return undefined
  const uri = typeof obj === 'string' ? obj : obj['@id']
  if (!uri) return undefined
  const label = obj['skos:prefLabel']
  return { uri, label: label ?? uri }
}

export default defineEventHandler(
  async (event: any): Promise<PostinfoData | string | null> => {
    try {
      const slug = getRouterParam(event, 'slug')

      if (!slug) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Slug is required',
        })
      }

      console.log(`[${new Date().toISOString()}] Fetching postinfo: ${slug}`)

      const extension: string | undefined = SUPPORTED_EXTENSIONS.find((ext) =>
        slug.endsWith(ext),
      )
      const cleanSlug = extension ? slug.replace(extension, '') : slug

      const acceptHeader = getHeader(event, 'accept') ?? ''
      const extensionFormat = extension
        ? SUPPORTED_FORMATS[
            extension.replace('.', '') as keyof typeof SUPPORTED_FORMATS
          ]
        : null
      const requestedFormat =
        extensionFormat ||
        Object.values(SUPPORTED_FORMATS).find((fmt) =>
          acceptHeader.includes(fmt),
        )

      const basisregistersUrl = `${BASISREGISTERS_API_BASE}/postinfo/${cleanSlug}`

      let data: any
      try {
        const response = await axios.get(basisregistersUrl, {
          headers: { Accept: 'application/json' },
        })
        data = response.data
      } catch (err: any) {
        if (err?.response?.status === 404) {
          throw createError({
            statusCode: 404,
            statusMessage: `Postinfo not found: ${cleanSlug}`,
          })
        }
        throw err
      }

      if (!data?.data) {
        throw createError({
          statusCode: 404,
          statusMessage: `Postinfo not found: ${cleanSlug}`,
        })
      }

      const postinfoData = data.data

      const id = cleanSlug
      const uri = postinfoData['@id'] as string

      const identObj =
        postinfoData.identificator?.gestructureerdeIdentificator
      const identificator = {
        lokaleIdentificator: identObj?.lokaleIdentificator as
          | string
          | undefined,
      }

      // Postcode
      const postcode: string | undefined = cleanSlug

      // Postnaam
      const postnaam = getLocalizedValue(postinfoData.postnaam as any)

      // Status
      const status = getConcept(postinfoData.status)

      // Nuts3
      const nuts3: string | undefined = postinfoData.nuts3 as
        | string
        | undefined

      // Is toegekend aan (Gemeente)
      const gemeenteObj = postinfoData.isToegekendAan
      const isToegekendAan: PostinfoGemeente | undefined = gemeenteObj
        ? {
            uri: gemeenteObj['@id'] as string | undefined,
            label: getLocalizedValue(
              gemeenteObj.naam?.gemeentenaam as any,
            ),
            detail: gemeenteObj.detail as string | undefined,
          }
        : undefined

      const result: PostinfoData = {
        id,
        uri,
        postcode,
        postnaam,
        identificator,
        status,
        isToegekendAan,
        nuts3,
        fieldUris: POSTINFO_FIELD_URIS,
        source: basisregistersUrl,
      }

      if (requestedFormat) {
        const quads = postinfoDataToQuads(result)
        const serialized = await serializeQuadsToString(
          quads,
          requestedFormat,
        )
        setHeader(event, 'Content-Type', requestedFormat)
        return serialized
      }

      return result
    } catch (error: any) {
      if (error?.statusCode === 404) throw error
      console.error('Error fetching postinfo:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Error fetching postinfo',
      })
    }
  },
)
