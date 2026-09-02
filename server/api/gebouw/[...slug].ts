import axios from 'axios'
import {
  SUPPORTED_FORMATS,
  SUPPORTED_EXTENSIONS,
  BASISREGISTERS_API_BASE,
} from '~/constants/constants'
import type {
  GebouwData,
  GebouwConcept,
  GebouwGeometrie,
  GebouwRef,
} from '~/types/gebouw'
import { GEBOUW_FIELD_URIS } from '~/server/utils/gebouw-predicate-uris'
import { serializeQuadsToString } from '~/services/serialization.service'
import { gebouwDataToQuads } from '~/server/services/gebouw-serialization.service'

const getLocalizedValue = (
  arr: { '@value'?: string; '@language'?: string }[] | undefined,
): string | undefined => {
  if (!arr || !Array.isArray(arr)) return undefined
  const first = arr.find((v) => v['@value'])
  return first?.['@value']
}

/**
 * Helper: extracts a concept (skos:Concept) with @id and optional skos:prefLabel.
 */
const getConcept = (obj: any): GebouwConcept | undefined => {
  if (!obj) return undefined
  const uri = typeof obj === 'string' ? obj : obj['@id']
  if (!uri) return undefined
  const label = obj['skos:prefLabel']
  return { uri, label: label ?? uri }
}

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
            statusMessage: `Gebouw not found: ${cleanSlug}`,
          })
        }
        throw err
      }

      if (!data?.data) {
        throw createError({
          statusCode: 404,
          statusMessage: `Gebouw not found: ${cleanSlug}`,
        })
      }

      const gebouwData = data.data

      // --- Extract fields ---
      const id = cleanSlug
      const uri = gebouwData['@id'] as string

      // Identificator
      const identObj = gebouwData.identificator?.gestructureerdeIdentificator
      const identificator = {
        lokaleIdentificator: identObj?.lokaleIdentificator as
          | string
          | undefined,
      }

      // Geometrie (2DGebouwgeometrie)
      const geometrieObj = gebouwData.geometrie
      const geometrie: GebouwGeometrie | undefined = geometrieObj
        ? {
            methode: getConcept(geometrieObj.methode),
            specificatie: getConcept(geometrieObj.specificatie),
            gml: geometrieObj.gml as string | undefined,
          }
        : undefined

      // Status
      const status = getConcept(gebouwData.status)

      // bestaatUit (Gebouweenheden)
      const bestaatUitArr = gebouwData.bestaatUit
      const bestaatUit: GebouwRef[] | undefined = bestaatUitArr
        ? (Array.isArray(bestaatUitArr) ? bestaatUitArr : [bestaatUitArr]).map(
            (ref: any) => ({
              uri: ref['@id'] as string,
              detail: ref.detail as string | undefined,
            }),
          )
        : undefined

      // ligtOp (Percelen)
      const ligtOpArr = gebouwData.ligtOp
      const ligtOp: GebouwRef[] | undefined = ligtOpArr
        ? (Array.isArray(ligtOpArr) ? ligtOpArr : [ligtOpArr]).map(
            (ref: any) => ({
              uri: ref['@id'] as string,
              detail: ref.detail as string | undefined,
            }),
          )
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
    } catch (error: any) {
      if (error?.statusCode === 404) throw error
      console.error('Error fetching gebouw:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Internal server error',
      })
    }
  },
)
