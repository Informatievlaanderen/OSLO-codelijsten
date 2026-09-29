import axios from 'axios'
import {
  SUPPORTED_FORMATS,
  SUPPORTED_EXTENSIONS,
  BASISREGISTERS_API_BASE,
} from '~/constants/constants'
import type {
  PerceelData,
  PerceelIdentificator,
  PerceelAdres,
  PerceelRef,
} from '~/types/perceel'
import type {
  JsonLdEnvelope,
  JsonLdApiResponse,
} from '~/types/basisregisters'
import {
  getGestructureerdeIdentificator,
  normalizeArray,
  getConcept,
} from '~/types/basisregisters'
import { PERCEEL_FIELD_URIS } from '~/server/utils/perceel-predicate-uris'
import { serializeJsonLdToFormat } from '~/services/serialization.service'
import { resolveStatusLabel } from '~/server/services/status.service'

export default defineEventHandler(
  async (event: any): Promise<PerceelData | string | null> => {
    try {
      const slug = getRouterParam(event, 'slug')

      if (!slug) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Slug is required',
        })
      }

      console.log(`[${new Date().toISOString()}] Fetching perceel: ${slug}`)

      // Detect supported file extension (.ttl, .jsonld, .nt)
      const extension: string | undefined = SUPPORTED_EXTENSIONS.find((ext) =>
        slug.endsWith(ext),
      )
      const cleanSlug = extension ? slug.replace(extension, '') : slug

      // Handle content negotiation for RDF formats
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

      // Build basisregisters API URL
      const basisregistersUrl = `${BASISREGISTERS_API_BASE}/percelen/${cleanSlug}`

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
            statusMessage: `Perceel not found: ${cleanSlug}`,
          })
        }
        throw err
      }

      const data = response.data

      if (!data?.data) {
        throw createError({
          statusCode: 404,
          statusMessage: `Perceel not found: ${cleanSlug}`,
        })
      }

      const perceelData = data.data as JsonLdApiResponse

      // --- Extract fields ---
      const id = cleanSlug
      const uri = perceelData['@id'] as string

      // Identificator (first entry with gestructureerdeIdentificator)
      const gestructureerdIdent = getGestructureerdeIdentificator(perceelData.identificator)

      // toegekendDoor from the same identificator entry that has gestructureerdeIdentificator
      const identificatorArr = perceelData.identificator
        ? Array.isArray(perceelData.identificator)
          ? perceelData.identificator
          : [perceelData.identificator]
        : []
      const primaryIdent = identificatorArr.find((i) => i.gestructureerdeIdentificator)
      const toegekendDoor: PerceelRef | undefined = primaryIdent?.toegekendDoor
        ? { uri: primaryIdent.toegekendDoor['@id'] }
        : undefined

      const identificator: PerceelIdentificator = {
        lokaleIdentificator: gestructureerdIdent?.lokaleIdentificator,
        naamruimte: gestructureerdIdent?.naamruimte,
        versieIdentificator: gestructureerdIdent?.versieIdentificator,
        toegekendDoor,
      }

      // Status
      const status = getConcept(perceelData.status)

      // Resolve proper label from concept scheme
      if (status?.uri) {
        const resolvedLabel = await resolveStatusLabel(status.uri)
        if (resolvedLabel) {
          status.label = resolvedLabel
        }
      }

      // Adressen
      const adressenRaw = normalizeArray(perceelData.adressen)
      const adressen: PerceelAdres[] | undefined = adressenRaw.length > 0
        ? adressenRaw.map((ref) => ({
            uri: ref['@id'],
            detail: ref.detail,
          }))
        : undefined

      const result: PerceelData = {
        id,
        uri,
        identificator,
        status,
        adressen,
        fieldUris: PERCEEL_FIELD_URIS,
        source: basisregistersUrl,
      }

      // If RDF format requested
      if (requestedFormat) {
        // For JSON-LD, return the raw API response directly (it's already valid JSON-LD)
        if (requestedFormat === SUPPORTED_FORMATS.jsonld) {
          setHeader(event, 'Content-Type', SUPPORTED_FORMATS.jsonld)
          return data as unknown as string;
        }
        // For other RDF formats (TTL, N-Triples), parse the raw JSON-LD response
        // and serialize to the requested format, preserving all original triples
        const serialized = await serializeJsonLdToFormat(
          data,
          requestedFormat,
        )
        setHeader(event, 'Content-Type', requestedFormat)
        return serialized
      }

      return result
    } catch (error: unknown) {
      const err = error as { statusCode?: number }
      if (err.statusCode === 404) throw error
      console.error('Error fetching perceel:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Internal server error',
      })
    }
  },
)
