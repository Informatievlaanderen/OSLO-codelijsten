export interface KboIdentificator {
  identificator: string
  toegekendDoor: 'https://data.vlaanderen.be/id/organisatie/OVO027341'
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

export interface KboConcept {
  uri: string
  label: string
}

export interface KboFieldUris {
  type: string
  wettelijkeNaam: string
  voorkeursnaam: string
  alternatieveNaam: string
  rechtsvorm: string
  rechtstoestand: string
  activiteit: string
  identificator: string
  toegekendOp: string
  oprichting: string
  stopzetting: string
  parentOrganisatie: string
}

export interface KboPlace {
  geometry: {
    wkt: string
    gml: string
    x: number
    y: string
  }
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
  place: KboPlace
}

export interface KboOrganizationData {
  id: string
  uri: string
  types: string[]
  fieldUris: KboFieldUris
  organisatieType?: KboConcept
  wettelijkeNaam?: string
  voorkeursnaam?: string
  alternatieveNaam?: string[]
  identificator: KboIdentificator
  oprichting?: KboOprichting
  stopzetting?: KboStopzetting
  rechtsvorm?: KboConcept
  rechtstoestand?: KboConcept
  activiteit?: KboActiviteit
  contactPoints?: KboContactPoint[]
  source: string
}

export interface KBOBranchData {
  id: string
  uri: string
  types: string[]
  fieldUris: KboFieldUris
  wettelijkeNaam?: string
  voorkeursnaam?: string
  alternatieveNaam?: string[]
  identificator: KboIdentificator
  oprichting?: KboOprichting
  stopzetting?: KboStopzetting
  rechtsvorm?: KboConcept
  rechtstoestand?: KboConcept
  activiteit?: KboActiviteit
  contactPoints?: KboContactPoint[]
  parentOrganisatie?: string
  source: string
}
