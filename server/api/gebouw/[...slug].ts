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
import { serializeQuadsToString } from '~/services/serialization.service'
import { gebouwDataToQuads } from '~/server/services/gebouw-serialization.service'

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
      }

      // Geometrie (2DGebouwgeometrie)
      const geometrieObj = gebouwData.geometrie
      const geometrie: GebouwGeometrie | undefined = geometrieObj
        ? {
            methode: getConcept(geometrieObj.methode),
            specificatie: getConcept(geometrieObj.specificatie),
            gml: geometrieObj.gml,
          }
        : undefined

      // Status
      const status = getConcept(gebouwData.status)

      // bestaatUit (Gebouweenheden)
      const bestaatUitRaw = normalizeArray(gebouwData.bestaatUit)
      const bestaatUit: GebouwRef[] | undefined = bestaatUitRaw.length > 0
        ? bestaatUitRaw.map((ref) => ({
            uri: ref['@id'],
            detail: ref.detail,
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
        fieldUris: GEBOUW_FIELD_URIS,
        source: basisregistersUrl,
      }

      // If RDF format requested, serialize
      if (requestedFormat) {
        const quads = gebouwDataToQuads(result)
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
      console.error('Error fetching gebouw:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Internal server error',
      })
    }
  },
)
