export interface KboIdentificator {
  identificator: string
  toegekendOp?: string
}

export interface KboOprichting {
  datum: string
}

export interface KboStopzetting {
  datum: string
  redenStopzetting?: string
}

export interface KboActiviteit {
  uri: string
  label?: string
}

export interface KboContactPoint {
  id: string
  email?: string
  telephone?: string
  address?: {
    thoroughfare?: string
    postCode?: string
    municipality?: string
    country?: string
  }
}

export interface KboOrganizationData {
  id: string
  uri: string
  types: string[]
  wettelijkeNaam?: string
  voorkeursnaam?: string
  alternatieveNaam?: string[]
  identificator: KboIdentificator
  oprichting?: KboOprichting
  stopzetting?: KboStopzetting
  organisatieType?: string
  rechtsvorm?: string
  rechtstoestand?: string
  activiteit?: KboActiviteit
  contactPoints?: KboContactPoint[]
  source: string
}

export interface KBOBranchData {
  id: string
  uri: string
  types: string[]
  wettelijkeNaam?: string
  voorkeursnaam?: string
  alternatieveNaam?: string[]
  identificator: KboIdentificator
  oprichting?: KboOprichting
  stopzetting?: KboStopzetting
  organisatieType?: string
  rechtsvorm?: string
  rechtstoestand?: string
  activiteit?: KboActiviteit
  contactPoints?: KboContactPoint[]
  parentOrganisatie?: string
  source: string
}
