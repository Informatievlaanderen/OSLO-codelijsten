export interface ContactPoint {
  id: string
  name?: string
  email?: string
  telephone?: string
  fax?: string
  website?: string
  address?: {
    street: string
    number: string
    postalCode: string
    municipality: string
  }
}

export interface Capacity {
  id: string
  role: string
  person: string
  uri: string
}

export interface Dataset {
  id: string
  name: string
  uri: string
}

export interface OrganizationData {
  id: string
  uri: string
  name: string
  alternativeName?: string
  description?: string
  status?: string
  foundingDate?: string
  website?: string
  seeAlso?: string[]
  contactPoints?: ContactPoint[]
  datasets?: Dataset[]
  source: string
}
