export interface PerceelConcept {
  uri: string
  label: string
}

export interface PerceelIdentificator {
  lokaleIdentificator?: string
  naamruimte?: string
  versieIdentificator?: string
}

export interface PerceelAdres {
  uri: string
  detail?: string
}

export interface PerceelFieldUris {
  identificator: string
  gestructureerdeIdentificator: string
  lokaleIdentificator: string
  status: string
  adressen: string
}

export interface PerceelData {
  id: string
  uri: string
  identificator: PerceelIdentificator
  status?: PerceelConcept
  adressen?: PerceelAdres[]
  fieldUris: PerceelFieldUris
  source: string
}
