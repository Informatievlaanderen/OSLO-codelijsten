import axios from 'axios'
import {
  SUPPORTED_FORMATS,
  SUPPORTED_EXTENSIONS,
  BASISREGISTERS_API_BASE,
} from '~/constants/constants'
import type {
  GebouweenheidData,
  GebouweenheidIdentificator,
  GebouweenheidRef,
  GebouweenheidPositie,
} from '~/types/gebouweenheid'
import type {
  JsonLdEnvelope,
  JsonLdApiResponse,
} from '~/types/basisregisters'
import {
  getConcept,
  getGestructureerdeIdentificator,
  normalizeArray,
} from '~/types/basisregisters'
import { GEBOUWEENHEID_FIELD_URIS } from '~/server/utils/gebouweenheid-predicate-uris'
import { serializeJsonLdToFormat } from '~/services/serialization.service'
import { resolveStatusLabel } from '~/server/services/status.service'
import { parseGmlCentroid, buildGeopuntUrl, buildGeopuntEmbedUrl } from '~/utils/utils'

export default defineEventHandler(
  async (event: any): Promise<GebouweenheidData | string | null> => {
    try {
      const slug = getRouterParam(event, 'slug')

      if (!slug) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Slug is required',
        })
      }

      console.log(`[${new Date().toISOString()}] Fetching gebouweenheid: ${slug}`)

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
      const basisregistersUrl = `${BASISREGISTERS_API_BASE}/gebouweenheden/${cleanSlug}`

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
            statusMessage: `Gebouweenheid not found: ${cleanSlug}`,
          })
        }
        throw err
      }

      const data = response.data

      if (!data?.data) {
        throw createError({
          statusCode: 404,
          statusMessage: `Gebouweenheid not found: ${cleanSlug}`,
        })
      }

      const gebouweenheidData = data.data as JsonLdApiResponse

      // --- Extract fields ---
      const id = cleanSlug
      const uri = gebouweenheidData['@id'] as string

      // Identificator
      const gestructureerdIdent = getGestructureerdeIdentificator(gebouweenheidData.identificator)
      const identificator: GebouweenheidIdentificator = {
        lokaleIdentificator: gestructureerdIdent?.lokaleIdentificator,
        naamruimte: gestructureerdIdent?.naamruimte,
        versieIdentificator: gestructureerdIdent?.versieIdentificator,
      }

      // Status
      const status = getConcept(gebouweenheidData.status)
      if (status?.uri) {
        const resolvedLabel = await resolveStatusLabel(status.uri)
        if (resolvedLabel) {
          status.label = resolvedLabel
        }
      }

      // Functie
      const functie = getConcept(gebouweenheidData.functie)
      if (functie?.uri) {
        const resolvedLabel = await resolveStatusLabel(functie.uri)
        if (resolvedLabel) {
          functie.label = resolvedLabel
        }
      }

      // isDeelVan (Gebouw)
      const isDeelVanObj = gebouweenheidData.isDeelVan
      const isDeelVan: GebouweenheidRef | undefined = isDeelVanObj
        ? {
          uri: isDeelVanObj['@id'],
          detail: isDeelVanObj.detail,
        }
        : undefined

      // Positie
      const positieObj = gebouweenheidData.positie
      const positie: GebouweenheidPositie | undefined = positieObj
        ? {
          methode: getConcept(positieObj.methode),
          geometrie: positieObj.geometrie?.length
            ? positieObj.geometrie.map((g: any) => ({ gml: g.gml }))
            : undefined,
        }
        : undefined

      // Build Geopunt URL from the first Lambert 1972 GML geometry
      let geopuntUrl: string | undefined
      let centroid: { x: number; y: number } | undefined
      if (positie?.geometrie?.length) {
        const firstGml = positie.geometrie.find((g) => g.gml)
        if (firstGml?.gml) {
          const c = parseGmlCentroid(firstGml.gml)
          if (c) {
            centroid = c
            geopuntUrl = buildGeopuntUrl(c.x, c.y)
          }
        }
      }

      // toegekendAdres
      const adressenRaw = normalizeArray(gebouweenheidData.toegekendAdres)
      const toegekendAdres: GebouweenheidRef[] | undefined = adressenRaw.length > 0
        ? adressenRaw.map((ref) => ({
          uri: ref['@id'],
          detail: ref.detail,
        }))
        : undefined

      // afwijkingVastgesteld
      const afwijkingVastgesteld: boolean | undefined =
        gebouweenheidData.afwijkingVastgesteld ?? undefined

      const result: GebouweenheidData = {
        id,
        uri,
        identificator,
        status,
        functie,
        isDeelVan,
        positie,
        toegekendAdres,
        afwijkingVastgesteld,
        geopuntUrl,
        geopuntEmbedUrl: centroid
          ? buildGeopuntEmbedUrl(centroid.x, centroid.y, "936eb6e8-5d33-41dc-b2fc-0b6b45d7f177")
          : undefined,
        centroid,
        fieldUris: GEBOUWEENHEID_FIELD_URIS,
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
      console.error('Error fetching gebouweenheid:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Internal server error',
      })
    }
  },
)
