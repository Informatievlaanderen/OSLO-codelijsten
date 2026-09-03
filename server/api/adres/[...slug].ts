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
import { serializeQuadsToString } from '~/services/serialization.service'
import { adresDataToQuads } from '~/server/services/adres-serialization.service'

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
        }
        : undefined

      // Status
      const status = getConcept(adresData.status)

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
        fieldUris: ADRES_FIELD_URIS,
        source: basisregistersUrl,
      }

      // If RDF format requested, serialize
      if (requestedFormat) {
        const quads = adresDataToQuads(result)
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
      console.error('Error fetching adres:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Error fetching adres',
      })
    }
  },
)
