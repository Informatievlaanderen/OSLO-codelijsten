import axios from 'axios'
import {
  SUPPORTED_FORMATS,
  SUPPORTED_EXTENSIONS,
  VKBO_BASE,
} from '~/constants/constants'
import type {
  KboOrganizationData,
  KboContactPoint,
  KboIdentificator,
  KBOBranchData,
  KboActiviteit,
  KboOprichting,
  KboStopzetting,
} from '~/types/KBO'
import { clean, cleanDate, buildNaceUri } from '../utils/kbo-utils'
import { kboDataToQuads } from '~/server/services/kbo-serialization.service'
import { serializeQuadsToString } from '~/services/serialization-service'

export default defineEventHandler(
  async (
    event: any,
  ): Promise<KboOrganizationData | KBOBranchData | string | null> => {
    try {
      const slug = getRouterParam(event, 'slug')

      if (!slug) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Slug is required',
        })
      }

      console.log(`[${new Date().toISOString()}] Fetching enterprise: ${slug}`)

      // Detect supported file extension (.ttl, .jsonld, .nt)
      const extension: string | undefined = SUPPORTED_EXTENSIONS.find((ext) =>
        slug.endsWith(ext),
      )
      const cleanSlug = extension ? slug.replace(extension, '') : slug

      // Build VKBO API URL
      const vkboUrl = `${VKBO_BASE}?f=application/json&filter-lang=cql-text&filter=${encodeURIComponent(`Ondernemingsnr eq '${cleanSlug}'`)}`

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

      // // Fetch from VKBO OGC API
      const { data } = await axios.get(vkboUrl)

      if (!data?.features?.length) {
        throw createError({
          statusCode: 404,
          statusMessage: `Enterprise not found: ${cleanSlug}`,
        })
      }

      const props = data.features[0].properties

      const isVestiging = !!clean(props.Ondernemingsnr_maatsch_zetel)

      // --- Identificator ---
      const identificator: KboIdentificator = {
        identificator: cleanSlug,
        toegekendOp: cleanDate(props.Datum_inschrijving),
      }

      // --- Oprichting (Veranderingsgebeurtenis) ---
      const oprichting: KboOprichting | undefined = cleanDate(props.Startdatum)
        ? { datum: cleanDate(props.Startdatum)! }
        : undefined

      // --- Stopzetting (Veranderingsgebeurtenis, remove 1900 placeholder) ---
      const stopzettingDatum = cleanDate(props.Datum_stopzetting)
      const stopzetting: KboStopzetting | undefined = stopzettingDatum
        ? {
            datum: stopzettingDatum,
            redenStopzetting: clean(props.Reden_stopzetting),
          }
        : undefined

      // --- Names ---
      const wettelijkeNaam = clean(props.Maatschappelijke_naam)
      const voorkeursnaam = clean(props.Commerciele_naam)
      const alternatieveNaam: string[] = []
      if (clean(props.Afgekorte_naam))
        alternatieveNaam.push(clean(props.Afgekorte_naam)!)
      if (clean(props.Zoeknaam)) alternatieveNaam.push(clean(props.Zoeknaam)!)

      // --- Organisatie.type ---
      const organisatieType = clean(props.Type_onderneming)

      // --- GeregistreerdeOrganisatie fields ---
      const rechtsvorm = clean(props.Rechtsvorm)
      const rechtstoestand = clean(props.Rechtstoestand)

      // --- NACE activity (BTW fallback to RSZ) ---
      const naceCode =
        clean(props.NACE_hoofdact_BTW) ?? clean(props.NACE_hoofdact_RSZ)
      const naceVersion =
        clean(props.NACE_versie_BTW) ?? clean(props.NACE_Versie_RSZ)
      const naceLabel =
        clean(props.Omschrijving_hoofdact_BTW) ??
        clean(props.Omschrijving_hoofdact_RSZ)
      const activityUri = buildNaceUri(naceCode, naceVersion)
      const activiteit: KboActiviteit | undefined = activityUri
        ? { uri: activityUri, label: naceLabel }
        : undefined

      // --- Address with AR → KBO fallback ---
      const street = clean(props.AR_straat) ?? clean(props.KBO_Straat)
      const houseNr = clean(props.AR_huisnr) ?? clean(props.KBO_Huisnr)
      const bus = clean(props.AR_busnr) ?? clean(props.KBO_Busnr)
      const postcode = clean(props.AR_postcode) ?? clean(props.KBO_Postcode)
      const municipality = clean(props.KBO_Gemeente)

      // --- Contact point ---
      const contactPoints: KboContactPoint[] = []
      const email = clean(props.Email)
      const telephone = clean(props.Telefoonnummer)
      if (email || telephone || street) {
        contactPoints.push({
          id: 'contact-0',
          email,
          telephone,
          address:
            street || postcode || municipality
              ? {
                  thoroughfare: [street, houseNr, bus]
                    .filter(Boolean)
                    .join(' '),
                  postCode: postcode,
                  municipality: municipality,
                  country: 'België',
                }
              : undefined,
        })
      }

      // --- Vestiging ---
      if (isVestiging) {
        const branch: KBOBranchData = {
          id: cleanSlug,
          uri: `https://data.vlaanderen.be/id/vestiging/${cleanSlug}`,
          types: ['Vestiging'],
          wettelijkeNaam,
          voorkeursnaam,
          alternatieveNaam: alternatieveNaam.length
            ? alternatieveNaam
            : undefined,
          identificator,
          oprichting,
          stopzetting,
          organisatieType,
          rechtsvorm,
          rechtstoestand,
          activiteit,
          contactPoints: contactPoints.length ? contactPoints : undefined,
          parentOrganisatie: clean(props.Ondernemingsnr_maatsch_zetel),
          source: vkboUrl,
        }

        if (requestedFormat) {
          const quads = kboDataToQuads(branch)
          const serialized = await serializeQuadsToString(quads, requestedFormat)
          setHeader(event, 'Content-Type', requestedFormat)
          return serialized
        }

        return branch
      }

      // --- Organisatie ---
      const enterprise: KboOrganizationData = {
        id: cleanSlug,
        uri: `https://data.vlaanderen.be/id/onderneming/${cleanSlug}`,
        types: [
          'Organisatie',
          'GeregistreerdeOrganisatie',
          'FormeleOrganisatie',
        ],
        wettelijkeNaam,
        voorkeursnaam,
        alternatieveNaam: alternatieveNaam.length
          ? alternatieveNaam
          : undefined,
        identificator,
        oprichting,
        stopzetting,
        organisatieType,
        rechtsvorm,
        rechtstoestand,
        activiteit,
        contactPoints: contactPoints.length ? contactPoints : undefined,
        source: vkboUrl,
      }

      if (requestedFormat) {
        const quads = kboDataToQuads(enterprise)
        const serialized = await serializeQuadsToString(quads, requestedFormat)
        setHeader(event, 'Content-Type', requestedFormat)
        return serialized
      }

      return enterprise
    } catch (error: any) {
      if (error.statusCode) throw error
      console.error('Error fetching enterprise:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Error fetching enterprise',
      })
    }
  },
)
