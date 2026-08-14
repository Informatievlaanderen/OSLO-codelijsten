export interface StraatnaamConcept {
  uri: string
  label: string
}

export interface StraatnaamIdentificator {
  lokaleIdentificator?: string
}

export interface StraatnaamGemeente {
  uri?: string
  label?: string
  detail?: string
}

export interface StraatnaamFieldUris {
  straatnaam: string
  identificator: string
  gestructureerdeIdentificator: string
  lokaleIdentificator: string
  homoniemToevoeging: string
  status: string
  isToegekendDoor: string
}

export interface StraatnaamData {
  id: string
  uri: string
  straatnaam?: string
  identificator: StraatnaamIdentificator
  homoniemToevoeging?: string[]
  status?: StraatnaamConcept
  isToegekendDoor?: StraatnaamGemeente
  fieldUris: StraatnaamFieldUris
  source: string
}
