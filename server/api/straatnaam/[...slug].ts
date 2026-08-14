import axios from 'axios'
import {
  SUPPORTED_FORMATS,
  SUPPORTED_EXTENSIONS,
  BASISREGISTERS_API_BASE,
} from '~/constants/constants'
import type {
  StraatnaamData,
  StraatnaamConcept,
  StraatnaamGemeente,
} from '~/types/straatnaam'
import { STRAATNAAM_FIELD_URIS } from '~/server/utils/straatnaam-predicate-uris'
import { straatnaamDataToQuads } from '~/server/services/straatnaam-serialization.service'
import { serializeQuadsToString } from '~/services/serialization.service'

const getLocalizedValue = (
  arr: { '@value'?: string; '@language'?: string }[] | undefined,
): string | undefined => {
  if (!arr || !Array.isArray(arr)) return undefined
  const first = arr.find((v) => v['@value'])
  return first?.['@value']
}

const getConcept = (obj: any): StraatnaamConcept | undefined => {
  if (!obj) return undefined
  const uri = typeof obj === 'string' ? obj : obj['@id']
  if (!uri) return undefined
  const label = obj['skos:prefLabel']
  return { uri, label: label ?? uri }
}

export default defineEventHandler(
  async (event: any): Promise<StraatnaamData | string | null> => {
    try {
      const slug = getRouterParam(event, 'slug')

      if (!slug) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Slug is required',
        })
      }

      console.log(`[${new Date().toISOString()}] Fetching straatnaam: ${slug}`)

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

      const basisregistersUrl = `${BASISREGISTERS_API_BASE}/straatnamen/${cleanSlug}`

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
            statusMessage: `Straatnaam not found: ${cleanSlug}`,
          })
        }
        throw err
      }

      if (!data?.data) {
        throw createError({
          statusCode: 404,
          statusMessage: `Straatnaam not found: ${cleanSlug}`,
        })
      }

      const straatnaamData = data.data

      const id = cleanSlug
      const uri = straatnaamData['@id'] as string

      const identObj = straatnaamData.identificator?.gestructureerdeIdentificator
      const identificator = {
        lokaleIdentificator: identObj?.lokaleIdentificator as
          | string
          | undefined,
      }

      // Straatnaam label
      const straatnaam = getLocalizedValue(straatnaamData.straatnaam as any)

      // Homoniem toevoeging (array of strings)
      const homoniemToevoeging: string[] | undefined = (
        straatnaamData.homoniemToevoeging as string[] | undefined
      )?.length
        ? (straatnaamData.homoniemToevoeging as string[])
        : undefined

      // Status
      const status = getConcept(straatnaamData.status)

      // Is toegekend door (Gemeente)
      const gemeenteObj = straatnaamData.isToegekendDoor
      const isToegekendDoor: StraatnaamGemeente | undefined = gemeenteObj
        ? {
            uri: gemeenteObj['@id'] as string | undefined,
            label: getLocalizedValue(
              gemeenteObj.naam?.gemeentenaam as any,
            ),
            detail: gemeenteObj.detail as string | undefined,
          }
        : undefined

      // Link to related adressen

      const result: StraatnaamData = {
        id,
        uri,
        straatnaam,
        identificator,
        homoniemToevoeging,
        status,
        isToegekendDoor,
        fieldUris: STRAATNAAM_FIELD_URIS,
        source: basisregistersUrl,
      }

      if (requestedFormat) {
        const quads = straatnaamDataToQuads(result)
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
      console.error('Error fetching straatnaam:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Error fetching straatnaam',
      })
    }
  },
)
