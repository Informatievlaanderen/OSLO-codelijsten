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
  KboActiviteit,
  KboOprichting,
  KboStopzetting,
  KboDoorhaling,
  KboPeriode,
  KboConcept,
} from '~/types/KBO'
import {
  clean,
  cleanDate,
  buildNaceUri,
  buildJuridicalSituationUri,
  buildJuridicalFormUri,
  buildOrganisationTypeUri,
  buildDoorhalingsTypeUri,
  buildDoorhalingsRedenUri,
  buildOrganisatieStatusUri,
  buildStopzettingTypeUri,
  buildRapportTypeUri,
  buildPersoneelsklasseUri,
} from '../utils/kbo-utils'
import { KBO_FIELD_URIS } from '~/server/utils/kbo-predicate-uris'
import { kboDataToQuads } from '~/server/services/kbo-serialization.service'
import { serializeQuadsToString } from '~/services/serialization.service'

export default defineEventHandler(
  async (event: any): Promise<KboOrganizationData | string | null> => {
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

      // Vestiging starts with 2 or higher - this endpoint is for enterprises only
      const firstDigit = parseInt(cleanSlug.charAt(0), 10)
      if (!isNaN(firstDigit) && firstDigit >= 2) {
        throw createError({
          statusCode: 404,
          statusMessage: `This is a vestiging (branch), not an enterprise: ${cleanSlug}`,
        })
      }

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
      const geometry = data.features[0].geometry

      // --- Identificator ---
      const identificator: KboIdentificator = {
        identificator: cleanSlug,
        toegekendOp: cleanDate(props.Datum_inschrijving),
        toegekendDoor: 'https://data.vlaanderen.be/id/organisatie/OVO027341',
      }

      // --- Oprichting (Veranderingsgebeurtenis) ---
      const oprichting: KboOprichting | undefined = cleanDate(props.Startdatum)
        ? { datum: cleanDate(props.Startdatum)! }
        : undefined

      // --- Stopzetting (Veranderingsgebeurtenis, remove 1900 placeholder) ---
      const stopzettingDatum = cleanDate(props.Datum_stopzetting)
      const stopzetting: KboStopzetting | undefined = stopzettingDatum
        ? ({
            datum: stopzettingDatum,
            redenStopzetting: {
              uri: buildStopzettingTypeUri(clean(props.Reden_stopzetting)),
              label: clean(props.Reden_stopzetting),
            },
          } as unknown as KboStopzetting)
        : undefined

      // --- Names ---
      const wettelijkeNaam = clean(props.Maatschappelijke_naam)
      const voorkeursnaam = clean(props.Commerciele_naam) ?? wettelijkeNaam
      const alternatieveNaam: string[] = []
      if (clean(props.Afgekorte_naam))
        alternatieveNaam.push(clean(props.Afgekorte_naam)!)
      if (clean(props.Zoeknaam)) alternatieveNaam.push(clean(props.Zoeknaam)!)

      // --- Organisatie.type ---
      const organisatieType = await buildOrganisationTypeUri(
        props.Type_onderneming,
      )

      // --- Organisatie.status ---
      const organisatieStatus = await buildOrganisatieStatusUri('Actief')

      // --- GeregistreerdeOrganisatie fields ---
      const rechtsvorm = await buildJuridicalFormUri(props.Rechtsvorm)
      const rechtstoestandCode = clean(props.Rechtstoestand)
      const rechtstoestandUri =
        await buildJuridicalSituationUri(rechtstoestandCode)

      // --- Doorhaling Onderneming & Adres ---
      const doorhaling: KboDoorhaling[] = []

      const redenDoorhalingOnderneming = await buildDoorhalingsRedenUri(
        props.Reden_ambtsh_doorhaling,
      )
      const beginDatumDoorhalingOnderneming = cleanDate(
        props.Begindat_ambtsh_doorhaling,
      )
      const eindDatumDoorhalingOnderneming = cleanDate(
        props.Einddat_ambtsh_doorhaling,
      )
      const doorhalingOndernemingTijd: KboPeriode | undefined =
        beginDatumDoorhalingOnderneming
          ? {
              van: beginDatumDoorhalingOnderneming,
              tot: eindDatumDoorhalingOnderneming,
            }
          : undefined
      if (redenDoorhalingOnderneming) {
        doorhaling.push({
          id: 'doorhaling-0',
          reden: redenDoorhalingOnderneming,
          tijd: doorhalingOndernemingTijd,
          type: (await buildDoorhalingsTypeUri(
            'Ambstbehalve doorhaling onderneming',
          )) as unknown as KboConcept,
          wijzingsdatum: cleanDate(props.Wijzdat_ambtsh_doorhaling),
        })
      }

      const redenDoorhalingAdres = await buildDoorhalingsRedenUri(
        props.Reden_adresdoorhaling,
      )
      const beginDatumDoorhalingAdres = cleanDate(props.Datum_adresdoorhaling)
      const doorhalingAdresTijd: KboPeriode | undefined =
        beginDatumDoorhalingAdres
          ? {
              van: beginDatumDoorhalingAdres,
            }
          : undefined
      if (redenDoorhalingAdres) {
        doorhaling.push({
          id: 'doorhaling-1',
          reden: redenDoorhalingAdres,
          tijd: doorhalingAdresTijd,
          type: (await buildDoorhalingsTypeUri(
            'Ambstbehalve doorhaling adres',
          )) as unknown as KboConcept,
          wijzingsdatum: cleanDate(props.Wijzdat_adresdoorhaling),
        })
      }

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
      const geometryX = geometry.coordinates[0]
      const geometryY = geometry.coordinates[1]
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
          place: {
            geometry: {
              x: geometryX,
              y: geometryY,
              wkt: `POINT (${geometryX} ${geometryY})`,
              gml: `<gml:Point srsName="http://www.opengis.net/def/crs/EPSG/0/31370"><gml:coordinates>${geometryX}, ${geometryY}</gml:coordinates></gml:Point>`,
            },
          },
        })
      }

      // Personeelsklasse
      let personeelsklasse = undefined
      if (props.Personeelsklasse.includes('1 tot 4')) {
        personeelsklasse = await buildPersoneelsklasseUri('RSZ Personeelsklasse 1')
      } else if (props.Personeelsklasse.includes('5 tot 9')) {
        personeelsklasse = await buildPersoneelsklasseUri('RSZ Personeelsklasse 2')
      } else if (props.Personeelsklasse.includes('10 tot 19')) {
        personeelsklasse = await buildPersoneelsklasseUri('RSZ Personeelsklasse 3')
      } else if (props.Personeelsklasse.includes('20 tot 49')) {
        personeelsklasse = await buildPersoneelsklasseUri('RSZ Personeelsklasse 4')
      } else if (props.Personeelsklasse.includes('50 tot 99')) {
        personeelsklasse = await buildPersoneelsklasseUri('RSZ Personeelsklasse 5')
      } else if (props.Personeelsklasse.includes('100 tot 199')) {
        personeelsklasse = await buildPersoneelsklasseUri('RSZ Personeelsklasse 6')
      } else if (props.Personeelsklasse.includes('200 tot 499')) {
        personeelsklasse = await buildPersoneelsklasseUri('RSZ Personeelsklasse 7')
      } else if (props.Personeelsklasse.includes('500 tot 999')) {
        personeelsklasse = await buildPersoneelsklasseUri('RSZ Personeelsklasse 8')
      } else if (props.Personeelsklasse.includes('1000 en meer')) {
        personeelsklasse = await buildPersoneelsklasseUri('RSZ Personeelsklasse 9')
      } else {
        personeelsklasse = await buildPersoneelsklasseUri('RSZ Personeelsklasse 0')
      }

      // Jaarrekening
      const rapportReferentie = props.JAARREK_URL_NBB
      const rapportType = await buildRapportTypeUri('Jaarrekening')

      // --- Organisatie ---
      const enterprise: KboOrganizationData = {
        id: cleanSlug,
        uri: `https://data.vlaanderen.be/id/onderneming/${cleanSlug}`,
        types: [
          'Organisatie',
          'GeregistreerdeOrganisatie',
          'FormeleOrganisatie',
        ],
        fieldUris: KBO_FIELD_URIS,
        wettelijkeNaam,
        voorkeursnaam,
        alternatieveNaam: alternatieveNaam.length
          ? alternatieveNaam
          : undefined,
        identificator,
        oprichting,
        stopzetting,
        doorhaling,
        organisatieType,
        organisatieStatus,
        rechtsvorm,
        rechtstoestand: rechtstoestandUri,
        activiteit,
        contactPoints: contactPoints.length ? contactPoints : undefined,
        source: vkboUrl,
        personeelsklasse,
        rapportReferentie,
        rapportType,
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
