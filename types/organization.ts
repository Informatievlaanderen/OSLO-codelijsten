export interface Organization {
  id?: string
  ovoNumber: string
  name: string
  shortName?: string
  description?: string
  kboNumber?: string
  managedBy?: string
  validity?: {
    start?: string
    end?: string
  }
  contacts?: Contact[]
}

export interface Contact {
  contactTypeName?: string
  value: string
}
