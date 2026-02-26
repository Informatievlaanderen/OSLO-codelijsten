export interface CsvRow {
  [key: string]: string
}

export interface CompanyLookupItem {
  id: string
  status: string
  juridicalSituation: string
  type: string
  juridicalForm: string
  juridicalFormCAC: string
  startDate: string
}

export interface DenominationLookupItem {
  language: string
  type: string
  denomination: string
}

export interface EstablishmentLookupItem {
  id: string
  startDate: string
  companyId: string
}

export interface BranchLookupItem {
  id: string
  startDate: string
  companyId: string
}

export interface ActivityLookupItem {
  group: string
  naceVersion: string
  naceCode: string
  classification: string
}

export interface ContactLookupItem {
  id: string[]
  entityContact: string
  type: string
  value: string
}

export interface AddressLookupItem {
  id: string
  type: string
  countryNL: string
  countryFR: string
  zipcode: string
  municipalityNL: string
  municipalityFR: string
  streetNL: string
  streetFR: string
  houseNumber: string
  box?: string
  extraAddressInfo?: string
  dateStrikingOff?: string
}
