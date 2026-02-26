export interface KboContactPoint {
  id: string
  type?: string[]
  email?: string
  telephone?: string
  address?: {
    thoroughfare?: string
    postCode?: string
    municipality?: string
    country?: string
  }
}

export interface KboRegistration {
  notation?: string
  creator?: string
  schemaAgency?: string
  issued?: string
}

export interface KboSite {
  uri: string
  created?: string
  registration?: KboRegistration
}

export interface KboData {
  id: string
  uri?: string
  legalName?: string[]
  rechtspersoonlijkheid?: string
  rechtstoestand?: string
  rechtsvorm?: string
  created?: string
  contactPoints?: KboContactPoint[]
  registration?: KboRegistration
  registeredSites?: KboSite[]
  source: string
}
