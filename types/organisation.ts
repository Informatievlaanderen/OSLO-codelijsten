export interface ContactPoint {
  id: string
  type?: string
  name?: string
  email?: string
  telephone?: string
  address?: {
    street: string
    number: string
    postalCode: string
    municipality: string
  }
}

export interface Dataset {
  id: string
  title: string
  landingPage: string
}

export interface OrganizationData {
  id: string
  name: string
  alternativeName?: string
  type?: string
  status?: string
  foundingDate?: string
  website?: string
  contactPoints?: ContactPoint[]
  datasets?: Dataset[]
}
