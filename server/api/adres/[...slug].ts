import axios from 'axios'
import {
  SUPPORTED_FORMATS,
  SUPPORTED_EXTENSIONS,
  BASISREGISTERS_API_BASE,
} from '~/constants/constants'
import type {
  AdresData,
  AdresGemeentenaam,
  AdresPostinfo,
  AdresStraatnaam,
  AdresPositie,
  AdresConcept,
} from '~/types/adres'
import type {
  JsonLdEnvelope,
  JsonLdApiResponse,
  JsonLdConcept,
  JsonLdLocalizedValue,
} from '~/types/basisregisters'
import {
  getLocalizedValue,
  getGestructureerdeIdentificator,
} from '~/types/basisregisters'
import { ADRES_FIELD_URIS } from '~/server/utils/adres-predicate-uris'
import { serializeJsonLdToFormat } from '~/services/serialization.service'
import { resolveStatusLabel } from '~/server/services/status.service'
import { parseGmlCentroid, buildGeopuntUrl, buildGeopuntEmbedUrl } from '~/utils/utils'

/**
 * Helper: extracts a concept (skos:Concept) with @id and optional skos:prefLabel.
 */
const getConcept = (obj: JsonLdConcept | undefined): AdresConcept | undefined => {
  if (!obj) return undefined
  const uri = typeof obj === 'string' ? obj : obj['@id']
  if (!uri) return undefined
  const label = obj['skos:prefLabel']
  return { uri, label: label ?? uri }
}

export default defineEventHandler(
  async (event: any): Promise<AdresData | string | null> => {
    try {
      const slug = getRouterParam(event, 'slug')

      if (!slug) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Slug is required',
        })
      }

      console.log(`[${new Date().toISOString()}] Fetching adres: ${slug}`)

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
      const basisregistersUrl = `${BASISREGISTERS_API_BASE}/adressen/${cleanSlug}`

      // Fetch from basisregisters API
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
            statusMessage: `Adres not found: ${cleanSlug}`,
          })
        }
        throw err
      }

      if (!data?.data) {
        throw createError({
          statusCode: 404,
          statusMessage: `Adres not found: ${cleanSlug}`,
        })
      }

      const adresData = data.data as JsonLdApiResponse

      // --- Extract fields ---
      const id = cleanSlug
      const uri = adresData['@id'] as string

      // VolledigAdres
      const verrijkt = adresData.isVerrijktMet
      const volledigAdres = getLocalizedValue(verrijkt?.volledigAdres)

      // Identificator
      const identObj = getGestructureerdeIdentificator(adresData.identificator)
      const identificator = {
        lokaleIdentificator: identObj?.lokaleIdentificator,
        naamruimte: identObj?.naamruimte,
        versieIdentificator: identObj?.versieIdentificator,
      }

      // Gemeentenaam
      const gemeentenaamObj = adresData.heeftGemeentenaam
      const gemeentenaam: AdresGemeentenaam | undefined = gemeentenaamObj
        ? {
          uri: gemeentenaamObj.isAfgeleidVan?.['@id'],
          label: getLocalizedValue(gemeentenaamObj.gemeentenaam as JsonLdLocalizedValue[] | undefined),
          detail: gemeentenaamObj.isAfgeleidVan?.detail,
        }
        : undefined

      // Postinfo
      const postinfoObj = adresData.heeftPostinfo
      const postinfo: AdresPostinfo | undefined = postinfoObj
        ? {
          uri: postinfoObj['@id'],
          detail: postinfoObj.detail,
        }
        : undefined

      // Straatnaam
      const straatnaamObj = adresData.heeftStraatnaam
      const straatnaam: AdresStraatnaam | undefined = straatnaamObj
        ? {
          uri: straatnaamObj['@id'],
          label: getLocalizedValue(straatnaamObj.straatnaam as JsonLdLocalizedValue[] | undefined),
          detail: straatnaamObj.detail,
        }
        : undefined

      // Huisnummer
      const huisnummer: string | undefined = adresData.huisnummer

      // Positie
      const positieObj = adresData.positie
      const positie: AdresPositie | undefined = positieObj
        ? {
          methode: getConcept(positieObj.methode),
          specificatie: getConcept(positieObj.specificatie),
          geometrie: positieObj.geometrie?.length
            ? positieObj.geometrie.map((g: any) => ({ gml: g.gml, wkt: g.wkt }))
            : undefined,
        }
        : undefined

      // Build Geopunt URL from the first GML geometry
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

      // Status
      const status = getConcept(adresData.status)

      // Resolve proper label from concept scheme
      if (status?.uri) {
        const resolvedLabel = await resolveStatusLabel(status.uri)
        if (resolvedLabel) {
          status.label = resolvedLabel
        }
      }

      // Officieel toegekend
      const officieelToegekend: boolean | undefined =
        adresData.officieelToegekend ?? undefined

      const result: AdresData = {
        id,
        uri,
        volledigAdres,
        identificator,
        gemeentenaam,
        postinfo,
        straatnaam,
        huisnummer,
        positie,
        status,
        officieelToegekend,
        geopuntUrl,
        geopuntEmbedUrl: centroid
          ? buildGeopuntEmbedUrl(centroid.x, centroid.y, '98f57659-42d5-427a-82ee-375c9de8cdec')
          : undefined,
        centroid,
        fieldUris: ADRES_FIELD_URIS,
        source: basisregistersUrl,
      }

      // If RDF format requested
      if (requestedFormat) {
        // For JSON-LD, return the raw API response directly (it's already valid JSON-LD)
        if (requestedFormat === SUPPORTED_FORMATS.jsonld) {
          setHeader(event, 'Content-Type', SUPPORTED_FORMATS.jsonld)
          return data;
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
      console.error('Error fetching adres:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Error fetching adres',
      })
    }
  },
)
