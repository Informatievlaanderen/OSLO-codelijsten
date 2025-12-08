export interface License {
  id: string
  uri: string
  title?: string
  description?: string
  type?: string[]
  seeAlso?: string[]
  requires?: string[]
  versionInfo?: string
  sameAs?: string
  source: string
}

export interface LicenseType {
  id: string
  uri: string
  label: string
}

export interface LicenseConfig {
  urlRef: string
  sourceUrl: string
}

export interface LicenseDatasetConfig {
  licenses: LicenseConfig[]
}
