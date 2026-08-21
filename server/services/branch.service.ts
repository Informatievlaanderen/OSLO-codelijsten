import type {
  KBOBranchData,
  KboContactPoint,
  KboIdentificator,
  KboActiviteit,
  KboOprichting,
  KboStopzetting,
  KboLocalizedValue,
} from '~/types/KBO'
import type { OndernemingType } from '~/types/onderneming'
import { buildNaceUri } from '~/server/utils/kbo-utils'
import { getNaam, getDate, getCode, getOmschrijving, toArray, getTaalcode, pickPreferredByTaalcode, getLocalized } from '~/server/utils/soap-utils'
import { KBO_FIELD_URIS } from '~/server/utils/kbo-predicate-uris'

export const mapVestigingToBranch = (
  cleanSlug: string,
  vestiging: OndernemingType,
  enterpriseOndernemingsnummer: string | undefined,
  enterprise?: OndernemingType,
): KBOBranchData => {
  const identificator: KboIdentificator = {
    identificator: cleanSlug,
    toegekendDoor: 'https://data.vlaanderen.be/id/organisatie/OVO027341',
    toegekendOp: getDate(enterprise?.Inschrijving?.Datum),
  }

  // A vestiging queried directly via GeefOnderneming is returned as an
  // OndernemingType, so its creation date lives in Start.Datum.
  const oprichtingDatum = getDate(vestiging.Start?.Datum)
  const oprichting: KboOprichting | undefined = oprichtingDatum
    ? { datum: oprichtingDatum }
    : undefined

  const stopzettingDatum = getDate(vestiging.Stopzetting?.Datum)
  const stopzetting: KboStopzetting | undefined = stopzettingDatum
    ? { datum: stopzettingDatum }
    : undefined

  const maatschappelijkeNamen = toArray(vestiging.Namen?.MaatschappelijkeNamen?.MaatschappelijkeNaam)
  const wettelijkeNaam = getLocalized(maatschappelijkeNamen[0])
  const commercieleNamen = toArray(vestiging.Namen?.CommercieleNamen?.CommercieleNaam)
  const voorkeursnaam = getLocalized(commercieleNamen[0])
  const alternatieveNaam: KboLocalizedValue[] = []
  for (const mn of maatschappelijkeNamen) {
    const n = getLocalized(mn)
    if (n && n.value !== wettelijkeNaam?.value && !alternatieveNaam.some((a) => a.value === n.value)) {
      alternatieveNaam.push(n)
    }
  }
  for (const an of toArray(vestiging.Namen?.AfgekorteNamen?.AfgekorteNaam)) {
    const n = getLocalized(an)
    if (n && !alternatieveNaam.some((a) => a.value === n.value)) {
      alternatieveNaam.push(n)
    }
  }

const contactPoints: KboContactPoint[] = []
  let idx = 0
  for (const adres of toArray(vestiging.Adressen?.Adres)) {
    let street = getNaam(adres.Straat?.Naam)
    const houseNr = getNaam(adres.Huisnummer)
    const bus = getNaam(adres.Busnummer)
    let postcode = getNaam(adres.Gemeente?.PostCode)
    let municipality = getNaam(adres.Gemeente?.Naam)
    let country = getNaam(adres.Land?.Naam) ?? 'België'

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

  // Extract NACE activities from enterprise data
  const activiteiten = buildNaceActivities(enterprise)

  return {
    id: cleanSlug,
    types: ['vestiging'],
    uri: `https://data.vlaanderen.be/id/vestiging/${cleanSlug}`,
    fieldUris: KBO_FIELD_URIS,
    wettelijkeNaam,
    voorkeursnaam,
    alternatieveNaam: alternatieveNaam.length ? alternatieveNaam : undefined,
    identificator,
    oprichting,
    stopzetting,
    activiteiten: activiteiten.length ? activiteiten : undefined,
    contactPoints: contactPoints.length ? contactPoints : undefined,
    parentOrganisatie: enterpriseOndernemingsnummer,
    source: 'MAGDA-SOAP:GeefOnderneming',
  }
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
