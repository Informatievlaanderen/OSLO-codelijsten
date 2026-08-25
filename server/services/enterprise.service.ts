import type {
  KboOrganizationData,
  KboContactPoint,
  KboVestiging,
  KboIdentificator,
  KboActiviteit,
  KboOprichting,
  KboStopzetting,
  KboDoorhaling,
  KboConcept,
  KboLocalizedValue,
} from '~/types/KBO'
import type {
  OndernemingType,
} from '~/types/onderneming'
import {
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
import { getNaam, getDate, getCode, getOmschrijving, toArray, getTaalcode, pickPreferredByTaalcode, getLocalized } from '../utils/soap-utils'
import { KBO_FIELD_URIS } from '~/server/utils/kbo-predicate-uris'

export const mapOndernemingToEnterprise = async (
  cleanSlug: string,
  onderneming: OndernemingType,
): Promise<KboOrganizationData> => {
  // --- Identificator ---
  const identificator: KboIdentificator = {
    identificator: cleanSlug,
    toegekendOp: getDate(onderneming.Inschrijving?.Datum),
    toegekendDoor: 'https://data.vlaanderen.be/id/organisatie/OVO027341',
  }

  // --- Oprichting ---
  const startDatum = getDate(onderneming.Start?.Datum)
  const oprichting: KboOprichting | undefined = startDatum
    ? { datum: startDatum }
    : undefined

  // --- Stopzetting ---
  const stopzettingDatum = getDate(onderneming.Stopzetting?.Datum)
  const stopzettingRedenOmschrijving = getOmschrijving(onderneming.Stopzetting?.Reden)
  const stopzettingRedenCode = getCode(onderneming.Stopzetting?.Reden)
  const stopzettingRedenUri = stopzettingRedenOmschrijving
    ? await buildStopzettingTypeUri(stopzettingRedenOmschrijving)
    : undefined
  const stopzetting: KboStopzetting | undefined = stopzettingDatum
    ? ({
      datum: stopzettingDatum,
      redenStopzetting: stopzettingRedenUri
        ? {
          uri: stopzettingRedenUri.uri,
          label: stopzettingRedenOmschrijving ?? stopzettingRedenCode,
        }
        : undefined,
    } as unknown as KboStopzetting)
    : undefined

  // --- Names ---
  const maatschappelijkeNamen = toArray(onderneming.Namen?.MaatschappelijkeNamen?.MaatschappelijkeNaam)
  const wettelijkeNaam = getLocalized(maatschappelijkeNamen[0])
  const commercieleNamen = toArray(onderneming.Namen?.CommercieleNamen?.CommercieleNaam)
  const voorkeursnaam = getLocalized(commercieleNamen[0]) ?? wettelijkeNaam
  const alternatieveNaam: KboLocalizedValue[] = []
  for (const mn of maatschappelijkeNamen) {
    const n = getLocalized(mn)
    if (n && n.value !== wettelijkeNaam?.value && !alternatieveNaam.some((a) => a.value === n.value)) {
      alternatieveNaam.push(n)
    }
  }
  for (const an of toArray(onderneming.Namen?.AfgekorteNamen?.AfgekorteNaam)) {
    const n = getLocalized(an)
    if (n && !alternatieveNaam.some((a) => a.value === n.value)) {
      alternatieveNaam.push(n)
    }
  }

  // --- Organisatie.type ---
  const soortOmschrijving = getOmschrijving(onderneming.SoortOnderneming)
  const organisatieType = await buildOrganisationTypeUri(soortOmschrijving)

  // --- Organisatie.status ---
  const statusOmschrijving = getOmschrijving(onderneming.StatusKBO)
  const organisatieStatus = statusOmschrijving
    ? await buildOrganisatieStatusUri(statusOmschrijving)
    : await buildOrganisatieStatusUri('Actief')

  // --- GeregistreerdeOrganisatie fields ---
  const rechtsvormItem = toArray(onderneming.Rechtsvormen?.Rechtsvorm)[0]
  const rechtsvormOmschrijving = getOmschrijving(rechtsvormItem)
  const rechtsvorm = await buildJuridicalFormUri(rechtsvormOmschrijving)
  const rechtstoestandItem = toArray(onderneming.Rechtstoestanden?.Rechtstoestand)[0]
  const rechtstoestandOmschrijving = getOmschrijving(rechtstoestandItem)
  const rechtstoestandUri = await buildJuridicalSituationUri(rechtstoestandOmschrijving)

  // --- Doorhalingen ---
  const doorhaling = await buildDoorhalingen(onderneming)

  // --- NACE activities ---
  const activiteiten = buildNaceActivities(onderneming)

  // --- Address & Contact ---
  const contactPoints = buildContactPoints(onderneming)

  // --- Vestigingen ---
  const vestigingen = buildVestigingen(onderneming)

  // --- Personeelsklasse ---
  const personeelsklasse = await buildPersoneelsklasseUri('RSZ Personeelsklasse 0')

  // --- Jaarrekening ---
  const rapportReferentie = `https://consult.cbso.nbb.be/consult-enterprise/${cleanSlug}`
  const rapportType = await buildRapportTypeUri('Jaarrekening')

  const source = 'MAGDA-SOAP:GeefOnderneming'

  return {
    id: cleanSlug,
    uri: `https://data.vlaanderen.be/id/onderneming/${cleanSlug}`,
    types: ['Organisatie', 'GeregistreerdeOrganisatie', 'FormeleOrganisatie'],
    fieldUris: KBO_FIELD_URIS,
    wettelijkeNaam,
    voorkeursnaam,
    alternatieveNaam: alternatieveNaam.length ? alternatieveNaam : undefined,
    identificator,
    oprichting,
    stopzetting,
    doorhaling: doorhaling.length ? doorhaling : undefined,
    organisatieType,
    organisatieStatus,
    rechtsvorm,
    rechtstoestand: rechtstoestandUri,
    activiteiten: activiteiten.length ? activiteiten : undefined,
    contactPoints: contactPoints.length ? contactPoints : undefined,
    vestigingen: vestigingen.length ? vestigingen : undefined,
    source,
    personeelsklasse,
    rapportReferentie,
    rapportType,
  }
}

const buildDoorhalingen = async (
  onderneming: OndernemingType,
): Promise<KboDoorhaling[]> => {
  const doorhaling: KboDoorhaling[] = []

  for (const dh of toArray(onderneming.AmbtshalveDoorhalingen?.AmbtshalveDoorhaling)) {
    const dhRedenCode = getCode(dh.Reden)
    const dhRedenOmschrijving = getOmschrijving(dh.Reden)
    const dhBegin = getDate(dh.Periode?.Begin)
    const dhEinde = getDate(dh.Periode?.Einde)
    if (dhRedenCode) {
      const reden = await buildDoorhalingsRedenUri(dhRedenOmschrijving ?? dhRedenCode)
      doorhaling.push({
        id: `doorhaling-${doorhaling.length}`,
        reden: reden ?? {
          uri: `https://data.vlaanderen.be/id/concept/RedenDoorhaling/v1/${dhRedenCode}`,
          label: dhRedenOmschrijving ?? dhRedenCode,
        },
        tijd: dhBegin ? { van: dhBegin, tot: dhEinde } : undefined,
        type: (await buildDoorhalingsTypeUri('Ambstbehalve doorhaling onderneming')) as unknown as KboConcept,
      })
    }
  }

  // Also check for adres doorhalingen from the addresses
  for (const adres of toArray(onderneming.Adressen?.Adres)) {
    for (const dh of toArray(adres?.Doorhalingen?.Doorhaling)) {
      const dhRedenCode = getCode(dh.Reden)
      const dhRedenOmschrijving = getOmschrijving(dh.Reden)
      const dhBegin = getDate(dh.Periode?.Begin)
      const dhEinde = getDate(dh.Periode?.Einde)
      if (dhRedenCode) {
        const reden = await buildDoorhalingsRedenUri(dhRedenOmschrijving ?? dhRedenCode)
        doorhaling.push({
          id: `doorhaling-adres-${doorhaling.length}`,
          reden: reden ?? {
            uri: `https://data.vlaanderen.be/id/concept/RedenDoorhaling/v1/${dhRedenCode}`,
            label: dhRedenOmschrijving ?? dhRedenCode,
          },
          tijd: dhBegin ? { van: dhBegin, tot: dhEinde } : undefined,
          type: (await buildDoorhalingsTypeUri('Ambstbehalve doorhaling adres')) as unknown as KboConcept,
        })
      }
    }
  }

  return doorhaling
}

const buildNaceActivities = (onderneming: OndernemingType | undefined): KboActiviteit[] => {
  // Map by NACE code to keep only the latest version per code.
  const byCode = new Map<string, KboActiviteit>()
  if (onderneming?.Activiteiten?.Activiteit) {
    for (const act of toArray(onderneming.Activiteiten.Activiteit)) {
      const naceCode = getCode(act.Nace)
      const naceLabel = getOmschrijving(act.Nace)
      const naceVersion = getNaam(act.Nace?.Versie)
      if (!naceCode) continue
      const uri = buildNaceUri(naceCode, naceVersion)
      if (!uri) continue
      const existing = byCode.get(naceCode)
      // Keep the highest (latest) NACE version for a given code.
      const versionNum = parseInt(naceVersion ?? '0', 10) || 0
      const existingVersionNum = parseInt(existing?.versie ?? '0', 10) || 0
      if (!existing || versionNum > existingVersionNum) {
        byCode.set(naceCode, {
          uri,
          label: naceLabel ?? naceCode,
          code: naceCode,
          versie: naceVersion,
        })
      }
    }
  }
  return Array.from(byCode.values())
}

const buildContactPoints = (onderneming: OndernemingType): KboContactPoint[] => {
  const contactPoints: KboContactPoint[] = []
  let idx = 0

  for (const adres of toArray(onderneming.Adressen?.Adres)) {
    let street = getNaam(adres.Straat?.Naam)
    const houseNr = getNaam(adres.Huisnummer)
    const bus = getNaam(adres.Busnummer)
    let postcode = getNaam(adres.Gemeente?.PostCode)
    let municipality = getNaam(adres.Gemeente?.Naam)
    let country = getNaam(adres.Land?.Naam) ?? 'België'

    // Fall back to Descripties/Descriptie/Adres for localized names
    const descripties = toArray(adres.Descripties?.Descriptie)
    const hasMainAddress = !!(street || postcode || municipality)

    if (descripties.length > 0) {
      // Addresses may be provided in multiple languages. Prefer Dutch (NL),
      // falling back to FR/DE/EN and then any other language.
      const desc = pickPreferredByTaalcode(descripties)!
      const descAdres = desc.Adres
      const contact = desc.Contact
      const telephone = getNaam(contact?.Telefoonnummer)
      const gsm = getNaam(contact?.GSM)
      const email = getNaam(contact?.Email)

      // Use Descriptie address data as fallback for missing top-level fields
      const descStreet = getNaam(descAdres?.Straat?.Naam) ?? street
      const descMunicipality = getNaam(descAdres?.Gemeente?.Naam) ?? municipality
      const descCountry = getNaam(descAdres?.Land?.Naam) ?? country
      const descPostCode = getNaam(descAdres?.Gemeente?.PostCode) ?? postcode
      const descHouseNr = getNaam(descAdres?.Huisnummer) ?? houseNr
      const descBus = getNaam(descAdres?.Busnummer) ?? bus
      const descTaalcode = getTaalcode(desc.Taalcode) ?? 'nl'

      const hasDescAddress = !!(descStreet || descPostCode || descMunicipality)

      if (telephone || gsm || email || hasDescAddress) {
        contactPoints.push({
          id: `contact-${idx++}`,
          email,
          telephone,
          gsm,
          address: hasDescAddress
            ? {
                thoroughfare: [descStreet, descHouseNr, descBus].filter(Boolean).join(' '),
                postCode: descPostCode,
                municipality: descMunicipality,
                country: descCountry,
                taalcode: descTaalcode,
              }
            : undefined,
        })
      }
    } else if (hasMainAddress) {
      // Fallback: no descripties, just use address
      contactPoints.push({
        id: `contact-${idx++}`,
        address: {
          thoroughfare: [street, houseNr, bus].filter(Boolean).join(' '),
          postCode: postcode,
          municipality: municipality,
          country,
        },
      })
    }
  }

  return contactPoints
}

const buildVestigingen = (onderneming: OndernemingType): KboVestiging[] => {
  const vestigingen: KboVestiging[] = []

  for (const v of toArray(onderneming.Vestigingen?.Vestiging)) {
    const vestigingsnummer = getNaam(v.Vestigingsnummer)
    if (!vestigingsnummer) continue

    // Prefer Dutch names, falling back to commercial names in other languages.
    const maatschappelijkeVestigingNamen = toArray(v.Namen?.MaatschappelijkeNamen?.MaatschappelijkeNaam)
    const commercieleVestigingNamen = toArray(v.Namen?.CommercieleNamen?.CommercieleNaam)
    const localizedNaam = getLocalized(pickPreferredByTaalcode(maatschappelijkeVestigingNamen))
      ?? getLocalized(pickPreferredByTaalcode(commercieleVestigingNamen))
    const naam = localizedNaam?.value
    const taalcode = localizedNaam?.taalcode ?? 'nl'

    const statusOmschrijving = getOmschrijving(v.StatusKBO)
    const status = statusOmschrijving
      ? { uri: `https://data.vlaanderen.be/id/concept/OrganisatieStatus/v1/${getCode(v.StatusKBO) ?? ''}`, label: statusOmschrijving }
      : undefined

    const adressen = toArray(v.Adressen?.Adres)
    const firstAdres = adressen[0]
    const desc = firstAdres
      ? pickPreferredByTaalcode(toArray(firstAdres.Descripties?.Descriptie))
      : undefined
    const street = getNaam(desc?.Adres?.Straat?.Naam) ?? getNaam(firstAdres?.Straat?.Naam)
    const houseNr = getNaam(desc?.Adres?.Huisnummer) ?? getNaam(firstAdres?.Huisnummer)
    const bus = getNaam(desc?.Adres?.Busnummer) ?? getNaam(firstAdres?.Busnummer)
    const postcode = getNaam(desc?.Adres?.Gemeente?.PostCode) ?? getNaam(firstAdres?.Gemeente?.PostCode)
    const municipality = getNaam(desc?.Adres?.Gemeente?.Naam) ?? getNaam(firstAdres?.Gemeente?.Naam)
    const adresTaalcode = getTaalcode(desc?.Taalcode) ?? taalcode

    vestigingen.push({
      id: vestigingsnummer,
      uri: `https://data.vlaanderen.be/id/onderneming/${vestigingsnummer}`,
      naam,
      status,
      adres: [street, houseNr, bus].filter(Boolean).join(' '),
      postcode,
      gemeente: municipality,
      taalcode: adresTaalcode,
    })
  }

  return vestigingen
}
