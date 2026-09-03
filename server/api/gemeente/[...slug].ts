import axios from 'axios'
import {
  SUPPORTED_FORMATS,
  SUPPORTED_EXTENSIONS,
  BASISREGISTERS_API_BASE,
} from '~/constants/constants'
import type {
  GemeenteData,
  GemeenteIdentificator,
  GemeenteNaam,
} from '~/types/gemeente'
import type {
  JsonLdEnvelope,
  JsonLdApiResponse,
} from '~/types/basisregisters'
import {
  getLocalizedValue,
  getConcept,
  getGestructureerdeIdentificator,
  normalizeArray,
} from '~/types/basisregisters'
import { GEMEENTE_FIELD_URIS } from '~/server/utils/gemeente-predicate-uris'
import { serializeQuadsToString } from '~/services/serialization.service'
import { gemeenteDataToQuads } from '~/server/services/gemeente-serialization.service'

export default defineEventHandler(
  async (event: any): Promise<GemeenteData | string | null> => {
    try {
      const slug = getRouterParam(event, 'slug')

      if (!slug) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Slug is required',
        })
      }

      console.log(`[${new Date().toISOString()}] Fetching gemeente: ${slug}`)

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

      const basisregistersUrl = `${BASISREGISTERS_API_BASE}/gemeenten/${cleanSlug}`

      // Fetch from basisregisters API
      let response
      try {
        response = await axios.get<JsonLdEnvelope<JsonLdApiResponse>>(basisregistersUrl, {
          headers: { Accept: 'application/json' },
        })
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          throw createError({
            statusCode: 404,
            statusMessage: `Gemeente not found: ${cleanSlug}`,
          })
        }
        throw err
      }

      const data = response.data

      if (!data?.data) {
        throw createError({
          statusCode: 404,
          statusMessage: `Gemeente not found: ${cleanSlug}`,
        })
      }

      const gemeenteData = data.data as JsonLdApiResponse

      const id = cleanSlug
      const uri = gemeenteData['@id'] as string

      // Identificator
      const gestructureerdIdent = getGestructureerdeIdentificator(gemeenteData.identificator)
      const identificator: GemeenteIdentificator = {
        lokaleIdentificator: gestructureerdIdent?.lokaleIdentificator,
        naamruimte: gestructureerdIdent?.naamruimte,
        versieIdentificator: gestructureerdIdent?.versieIdentificator,
      }

      // Naam
      const naamObj = gemeenteData.naam
      const naam: GemeenteNaam | undefined = naamObj
        ? {
            gemeentenaam: getLocalizedValue(naamObj.gemeentenaam),
          }
        : undefined

      // Officiele talen
      const officieleTaalRaw = normalizeArray(gemeenteData.officieleTaal)
      const officieleTaal: string[] | undefined = officieleTaalRaw.length > 0
        ? officieleTaalRaw.map((t) => t['@value'] ?? t)
        : undefined

      // Faciliteiten talen
      const faciliteitenTaalRaw = normalizeArray(gemeenteData.faciliteitenTaal)
      const faciliteitenTaal: string[] | undefined = faciliteitenTaalRaw.length > 0
        ? faciliteitenTaalRaw.map((t) => t['@value'] ?? t)
        : undefined

      // Status
      const status = getConcept(gemeenteData.status)

      const result: GemeenteData = {
        id,
        uri,
        identificator,
        naam,
        officieleTaal,
        faciliteitenTaal,
        status,
        fieldUris: GEMEENTE_FIELD_URIS,
        source: basisregistersUrl,
      }

      if (requestedFormat) {
        const quads = gemeenteDataToQuads(result)
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
      console.error('Error fetching gemeente:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Internal server error',
      })
    }
  },
)
