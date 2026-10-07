export interface AdresConcept {
  uri: string
  label: string
}

export interface AdresIdentificator {
  lokaleIdentificator?: string
  naamruimte?: string
  versieIdentificator?: string
}

export interface AdresGemeentenaam {
  uri?: string
  label?: string
  detail?: string
}

export interface AdresPostinfo {
  uri?: string
  detail?: string
}

export interface AdresStraatnaam {
  uri?: string
  label?: string
  detail?: string
}

export interface AdresPositie {
  methode?: AdresConcept
  specificatie?: AdresConcept
  geometrie?: Array<{ gml?: string; wkt?: string }>
}

export interface AdresFieldUris {
  volledigAdres: string
  huisnummer: string
  straatnaam: string
  postinfo: string
  gemeentenaam: string
  status: string
  officieelToegekend: string
  identificator: string
  gestructureerdeIdentificator: string
  lokaleIdentificator: string
  positie: string
  methode: string
  specificatie: string
  geometrie: string
}

export interface AdresData {
  id: string
  uri: string
  volledigAdres?: string
  identificator: AdresIdentificator
  gemeentenaam?: AdresGemeentenaam
  postinfo?: AdresPostinfo
  straatnaam?: AdresStraatnaam
  huisnummer?: string
  positie?: AdresPositie
  status?: AdresConcept
  officieelToegekend?: boolean
  geopuntUrl?: string
  geopuntEmbedUrl?: string
  centroid?: { x: number; y: number }
  fieldUris: AdresFieldUris
  source: string
}
