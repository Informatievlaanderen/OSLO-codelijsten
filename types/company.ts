export interface Company {
  identifier: string
  name: Name[]
  juridicalState: string
  rechtstoestand: string
  rechtspersoonlijkheid: string
  juridicalForm: string
  juridicalFormCAC: string
  startDate: string
  establishment: Establishment[]
  branch: Branch[]
  activity: Activity[]
  mainContact: Contact
  mainAddress: Address
}

export interface Name {
  type: string
  language: string
  name: string
}

export interface Establishment {
  identifier: string
  startDate: string
  name: Name[]
  activity: Activity[]
  contact: Contact
  address: Address
}

export interface Branch {
  identifier: string
  startDate: string
}

export interface Activity {
  group: string
  naceVersion: string
  naceCode: string
  classification: string
}

export interface Contact {
  email?: string
  telephone?: string
  homepage?: string
  fax?: string
}

export interface Address {
  countryNl?: string
  countryFr?: string
  zipcode?: string
  municipalityNl?: string
  municipalityFr?: string
  streetNl?: string
  streetFr?: string
  houseNumber?: string
  box?: string
  extraAddressInfo?: string
  endDate?: string
}
