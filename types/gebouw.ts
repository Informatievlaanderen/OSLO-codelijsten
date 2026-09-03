export interface GebouwConcept {
  uri: string
  label: string
}

export interface GebouwIdentificator {
  lokaleIdentificator?: string
}

export interface GebouwGeometrie {
  methode?: GebouwConcept
  specificatie?: GebouwConcept
  gml?: string
}

export interface GebouwRef {
  uri: string
  detail?: string
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
  fieldUris: GebouwFieldUris
  source: string
}
