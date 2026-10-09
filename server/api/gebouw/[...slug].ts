import axios from 'axios'
import {
  SUPPORTED_FORMATS,
  SUPPORTED_EXTENSIONS,
  BASISREGISTERS_API_BASE,
} from '~/constants/constants'
import type {
  GebouwData,
  GebouwGeometrie,
  GebouwRef,
} from '~/types/gebouw'
import type {
  JsonLdEnvelope,
  JsonLdApiResponse,
} from '~/types/basisregisters'
import {
  normalizeArray,
  getConcept,
  getGestructureerdeIdentificator,
} from '~/types/basisregisters'
import { GEBOUW_FIELD_URIS } from '~/server/utils/gebouw-predicate-uris'
import { serializeJsonLdToFormat } from '~/services/serialization.service'
import { resolveStatusLabel } from '~/server/services/status.service'
import { parseGmlCentroid, buildGeopuntUrl, buildGeopuntEmbedUrl } from '~/utils/utils'

export default defineEventHandler(
  async (event: any): Promise<GebouwData | string | null> => {
    try {
      const slug = getRouterParam(event, 'slug')

      if (!slug) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Slug is required',
        })
      }

      console.log(`[${new Date().toISOString()}] Fetching gebouw: ${slug}`)

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
      const basisregistersUrl = `${BASISREGISTERS_API_BASE}/gebouwen/${cleanSlug}`

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
            statusMessage: `Gebouw not found: ${cleanSlug}`,
          })
        }
        throw err
      }

      const data = response.data

      if (!data?.data) {
        throw createError({
          statusCode: 404,
          statusMessage: `Gebouw not found: ${cleanSlug}`,
        })
      }

      const gebouwData = data.data as JsonLdApiResponse

      // --- Extract fields ---
      const id = cleanSlug
      const uri = gebouwData['@id'] as string

      // Identificator
      const gestructureerdIdent = getGestructureerdeIdentificator(gebouwData.identificator)
      const identificator = {
        lokaleIdentificator: gestructureerdIdent?.lokaleIdentificator,
        naamruimte: gestructureerdIdent?.naamruimte,
        versieIdentificator: gestructureerdIdent?.versieIdentificator,
      }

      // Geometrie (2DGebouwgeometrie)
      const geometrieObj = gebouwData.geometrie
      const geometrie: GebouwGeometrie | undefined = geometrieObj
        ? {
          methode: getConcept(geometrieObj.methode),
          specificatie: getConcept(geometrieObj.specificatie),
          geometrie: geometrieObj.geometrie?.length
            ? geometrieObj.geometrie.map((g: any) => ({ gml: g.gml }))
            : undefined,
        }
        : undefined

      // Build Geopunt URL from the first Lambert 1972 GML geometry
      let geopuntUrl: string | undefined
      let centroid: { x: number; y: number } | undefined
      if (geometrie?.geometrie?.length) {
        const firstGml = geometrie.geometrie.find((g) => g.gml)
        if (firstGml?.gml) {
          const c = parseGmlCentroid(firstGml.gml)
          if (c) {
            centroid = c
            geopuntUrl = buildGeopuntUrl(c.x, c.y)
          }
        }
      }

      // Status
      const status = getConcept(gebouwData.status)

      // Resolve proper label from concept scheme
      if (status?.uri) {
        const resolvedLabel = await resolveStatusLabel(status.uri)
        if (resolvedLabel) {
          status.label = resolvedLabel
        }
      }

      // bestaatUit (Gebouweenheden)
      const bestaatUitRaw = normalizeArray(gebouwData.bestaatUit)
      const bestaatUit: GebouwRef[] | undefined = bestaatUitRaw.length > 0
        ? bestaatUitRaw.map((ref) => ({
          uri: ref['@id'],
          detail: ref.detail,
          status: getConcept(ref.status),
        }))
        : undefined

      // ligtOp (Percelen)
      const ligtOpRaw = normalizeArray(gebouwData.ligtOp)
      const ligtOp: GebouwRef[] | undefined = ligtOpRaw.length > 0
        ? ligtOpRaw.map((ref) => ({
          uri: ref['@id'],
          detail: ref.detail,
        }))
        : undefined

      const result: GebouwData = {
        id,
        uri,
        identificator,
        geometrie,
        status,
        bestaatUit,
        ligtOp,
        geopuntUrl,
        geopuntEmbedUrl: centroid
          ? buildGeopuntEmbedUrl(centroid.x, centroid.y, '64a2ba4e-3e69-40b4-a8b9-7023a4eb78c6')
          : undefined,
        centroid,
        fieldUris: GEBOUW_FIELD_URIS,
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
      console.error('Error fetching gebouw:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Internal server error',
      })
    }
  },
)
