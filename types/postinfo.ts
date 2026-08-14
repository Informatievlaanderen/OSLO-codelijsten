export interface PostinfoConcept {
  uri: string
  label: string
}

export interface PostinfoIdentificator {
  lokaleIdentificator?: string
}

export interface PostinfoGemeente {
  uri?: string
  label?: string
  detail?: string
}

export interface PostinfoFieldUris {
  postcode: string
  postnaam: string
  identificator: string
  gestructureerdeIdentificator: string
  lokaleIdentificator: string
  status: string
  isToegekendAan: string
  nuts3: string
}

export interface PostinfoData {
  id: string
  uri: string
  postcode?: string
  postnaam?: string
  identificator: PostinfoIdentificator
  status?: PostinfoConcept
  isToegekendAan?: PostinfoGemeente
  nuts3?: string
  fieldUris: PostinfoFieldUris
  source: string
}
