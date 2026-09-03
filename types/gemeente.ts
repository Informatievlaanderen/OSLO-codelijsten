export interface GemeenteConcept {
  uri: string
  label: string
}

export interface GemeenteIdentificator {
  lokaleIdentificator?: string
  naamruimte?: string
  versieIdentificator?: string
}

export interface GemeenteNaam {
  gemeentenaam?: string
}

export interface GemeenteFieldUris {
  identificator: string
  gestructureerdeIdentificator: string
  lokaleIdentificator: string
  naam: string
  officieleTaal: string
  faciliteitenTaal: string
  status: string
}

export interface GemeenteData {
  id: string
  uri: string
  identificator: GemeenteIdentificator
  naam?: GemeenteNaam
  officieleTaal?: string[]
  faciliteitenTaal?: string[]
  status?: GemeenteConcept
  fieldUris: GemeenteFieldUris
  source: string
}
