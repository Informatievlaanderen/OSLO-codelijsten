export interface GebouwConcept {
  uri: string
  label: string
}

export interface GebouwIdentificator {
  lokaleIdentificator?: string
  naamruimte?: string
  versieIdentificator?: string
}

export interface GebouwGeometrie {
  methode?: GebouwConcept
  specificatie?: GebouwConcept
  geometrie?: GebouwGeometriePunt[]
}

export interface GebouwGeometriePunt {
  gml?: string
}

export interface GebouwRef {
  uri: string
  detail?: string
  status?: GebouwConcept
}

export interface GebouwFieldUris {
  identificator: string
  gestructureerdeIdentificator: string
  lokaleIdentificator: string
  geometrie: string
  methode: string
  specificatie: string
  status: string
  bestaatUit: string
  ligtOp: string
}

export interface GebouwData {
  id: string
  uri: string
  identificator: GebouwIdentificator
  geometrie?: GebouwGeometrie
  status?: GebouwConcept
  bestaatUit?: GebouwRef[]
  ligtOp?: GebouwRef[]
  geopuntUrl?: string
  centroid?: { x: number; y: number }
  fieldUris: GebouwFieldUris
  source: string
}
