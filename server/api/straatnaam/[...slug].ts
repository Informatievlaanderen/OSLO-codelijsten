import axios from 'axios'
import {
  SUPPORTED_FORMATS,
  SUPPORTED_EXTENSIONS,
  BASISREGISTERS_API_BASE,
} from '~/constants/constants'
import type {
  StraatnaamData,
  StraatnaamGemeente,
} from '~/types/straatnaam'
import type {
  JsonLdEnvelope,
  JsonLdApiResponse,
} from '~/types/basisregisters'
import {
  getLocalizedValue,
  getConcept,
  getGestructureerdeIdentificator,
} from '~/types/basisregisters'
import { STRAATNAAM_FIELD_URIS } from '~/server/utils/straatnaam-predicate-uris'
import { straatnaamDataToQuads } from '~/server/services/straatnaam-serialization.service'
import { serializeQuadsToString } from '~/services/serialization.service'

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
        const response = await axios.get<JsonLdEnvelope<JsonLdApiResponse>>(basisregistersUrl, {
          headers: { Accept: 'application/json' },
        })
        data = response.data
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
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

      const straatnaamData = data.data as JsonLdApiResponse

      const id = cleanSlug
      const uri = straatnaamData['@id'] as string

      const identObj = getGestructureerdeIdentificator(straatnaamData.identificator)
      const identificator = {
        lokaleIdentificator: identObj?.lokaleIdentificator,
      }

      // Straatnaam label
      const straatnaam = getLocalizedValue(straatnaamData.straatnaam)

      // Homoniem toevoeging (array of strings)
      const homoniemToevoeging: string[] | undefined =
        straatnaamData.homoniemToevoeging?.length
          ? straatnaamData.homoniemToevoeging
          : undefined

      // Status
      const status = getConcept(straatnaamData.status)

      // Is toegekend door (Gemeente)
      const gemeenteObj = straatnaamData.isToegekendDoor
      const isToegekendDoor: StraatnaamGemeente | undefined = gemeenteObj
        ? {
          uri: gemeenteObj['@id'],
          label: getLocalizedValue(gemeenteObj.naam?.gemeentenaam),
          detail: gemeenteObj.detail,
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
    } catch (error: unknown) {
      const err = error as { statusCode?: number }
      if (err.statusCode === 404) throw error
      console.error('Error fetching straatnaam:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Error fetching straatnaam',
      })
    }
  },
)
