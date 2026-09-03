/**
 * Shared JSON-LD types for basisregisters API responses.
 * These represent the raw shapes returned by the V3 API before transformation.
 */

export interface JsonLdLocalizedValue {
  '@value'?: string
  '@language'?: string
}

export interface JsonLdConcept {
  '@id': string
  '@type'?: string
  code?: string
  'skos:prefLabel'?: string
}

export interface JsonLdRef {
  '@id': string
  '@type'?: string
  detail?: string
}

export interface JsonLdIdentificator {
  '@type'?: string
  gestructureerdeIdentificator?: {
    '@type'?: string
    naamruimte?: string
    lokaleIdentificator?: string
    versieIdentificator?: string
  }
  identificator?: string
  toegekendDoor?: JsonLdRef
  toegekendOp?: string
}

export interface JsonLdGemeenteRef extends JsonLdRef {
  naam?: {
    gemeentenaam?: JsonLdLocalizedValue[]
  }
}

export interface JsonLdPositie {
  methode?: JsonLdConcept
  specificatie?: JsonLdConcept
  geometrie?: { gml?: string; wkt?: string }
}

export interface JsonLdAdresuitbreiding {
  volledigAdres?: JsonLdLocalizedValue[]
}

export interface JsonLdGemeentenaam {
  gemeentenaam?: JsonLdLocalizedValue[]
  isAfgeleidVan?: JsonLdRef
}

export interface JsonLdEnvelope<TData = Record<string, unknown>> {
  '@context': string
  '@type': string
  data: TData
  '_links'?: Record<string, { href: string }>
}

export interface JsonLdApiResponse {
  '@id': string
  '@type': string
  identificator?: JsonLdIdentificator | JsonLdIdentificator[]
  status?: JsonLdConcept
  // Perceel
  adressen?: JsonLdRef[]
  // Gebouw
  bestaatUit?: JsonLdRef | JsonLdRef[]
  ligtOp?: JsonLdRef | JsonLdRef[]
  geometrie?: {
    methode?: JsonLdConcept
    specificatie?: JsonLdConcept
    gml?: string
  }
  // Gemeente
  naam?: {
    gemeentenaam?: JsonLdLocalizedValue[]
  }
  officieleTaal?: JsonLdLocalizedValue[]
  faciliteitenTaal?: JsonLdLocalizedValue[]
  // Adres
  isVerrijktMet?: JsonLdAdresuitbreiding
  heeftGemeentenaam?: JsonLdGemeentenaam
  heeftPostinfo?: JsonLdRef
  heeftStraatnaam?: JsonLdRef & { straatnaam?: JsonLdLocalizedValue[] }
  huisnummer?: string
  busnummer?: string
  positie?: JsonLdPositie
  officieelToegekend?: boolean
  // Straatnaam
  straatnaam?: JsonLdLocalizedValue[]
  homoniemToevoeging?: string[]
  isToegekendDoor?: JsonLdGemeenteRef
  // Postinfo
  postnaam?: JsonLdLocalizedValue[]
  nuts3?: string
  postcode?: string
  isToegekendAan?: JsonLdGemeenteRef
  [key: string]: unknown
}

/** Extract the gestructureerdeIdentificator from an identificator field that may be single or array */
export const getGestructureerdeIdentificator = (
  identificator: JsonLdIdentificator | JsonLdIdentificator[] | undefined,
): JsonLdIdentificator['gestructureerdeIdentificator'] => {
  if (!identificator) return undefined
  const arr = Array.isArray(identificator) ? identificator : [identificator]
  return arr.find((i) => i.gestructureerdeIdentificator)?.gestructureerdeIdentificator
}

/** Normalize a field that may be a single item or an array into an array */
export const normalizeArray = <T>(value: T | T[] | undefined): T[] => {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

/** Extract the first localized string value from a JSON-LD localized array */
export const getLocalizedValue = (
  arr: JsonLdLocalizedValue[] | undefined,
): string | undefined => {
  if (!arr || !Array.isArray(arr)) return undefined
  return arr.find((v) => v['@value'])?.['@value']
}

/** Extract a concept from a JSON-LD concept object */
export const getConcept = (obj: JsonLdConcept | undefined): { uri: string; label: string } | undefined => {
  if (!obj) return undefined
  const uri = typeof obj === 'string' ? obj : obj['@id']
  if (!uri) return undefined
  const label = obj.code ?? obj['skos:prefLabel'] ?? uri
  return { uri, label }
}
