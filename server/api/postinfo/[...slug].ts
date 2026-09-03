import axios from 'axios'
import {
  SUPPORTED_FORMATS,
  SUPPORTED_EXTENSIONS,
  BASISREGISTERS_API_BASE,
} from '~/constants/constants'
import type {
  PostinfoData,
  PostinfoGemeente,
} from '~/types/postinfo'
import type {
  JsonLdEnvelope,
  JsonLdApiResponse,
} from '~/types/basisregisters'
import {
  getLocalizedValue,
  getConcept,
  getGestructureerdeIdentificator,
} from '~/types/basisregisters'
import { POSTINFO_FIELD_URIS } from '~/server/utils/postinfo-predicate-uris'
import { postinfoDataToQuads } from '~/server/services/postinfo-serialization.service'
import { serializeQuadsToString } from '~/services/serialization.service'

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

      let data;
      try {
        const response = await axios.get<JsonLdEnvelope<JsonLdApiResponse>>(basisregistersUrl, {
          headers: { Accept: 'application/json' },
        })
        data = response.data
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
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

      const postinfoData = data.data as JsonLdApiResponse

      const id = cleanSlug
      const uri = postinfoData['@id'] as string

      const identObj =
        getGestructureerdeIdentificator(postinfoData.identificator)
      const identificator = {
        lokaleIdentificator: identObj?.lokaleIdentificator,
      }

      // Postcode
      const postcode: string | undefined = cleanSlug

      // Postnaam
      const postnaam = getLocalizedValue(postinfoData.postnaam)

      // Status
      const status = getConcept(postinfoData.status)

      // Nuts3
      const nuts3: string | undefined = postinfoData.nuts3

      // Is toegekend aan (Gemeente)
      const gemeenteObj = postinfoData.isToegekendAan
      const isToegekendAan: PostinfoGemeente | undefined = gemeenteObj
        ? {
          uri: gemeenteObj['@id'],
          label: getLocalizedValue(gemeenteObj.naam?.gemeentenaam),
          detail: gemeenteObj.detail,
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
    } catch (error: unknown) {
      const err = error as { statusCode?: number }
      if (err.statusCode === 404) throw error
      console.error('Error fetching postinfo:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Error fetching postinfo',
      })
    }
  },
)
