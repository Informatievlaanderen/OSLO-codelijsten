export interface GebouweenheidConcept {
  uri: string
  label: string
}

export interface GebouweenheidIdentificator {
  lokaleIdentificator?: string
  naamruimte?: string
  versieIdentificator?: string
}

export interface GebouweenheidRef {
  uri: string
  detail?: string
}

export interface GebouweenheidPositie {
  methode?: GebouweenheidConcept
  geometrie?: Array<{ gml?: string }>
}

export interface GebouweenheidFieldUris {
  identificator: string
  gestructureerdeIdentificator: string
  lokaleIdentificator: string
  status: string
  functie: string
  isDeelVan: string
  positie: string
  methode: string
  toegekendAdres: string
  afwijkingVastgesteld: string
}

export interface GebouweenheidData {
  id: string
  uri: string
  identificator: GebouweenheidIdentificator
  status?: GebouweenheidConcept
  functie?: GebouweenheidConcept
  isDeelVan?: GebouweenheidRef
  positie?: GebouweenheidPositie
  toegekendAdres?: GebouweenheidRef[]
  afwijkingVastgesteld?: boolean
  geopuntUrl?: string
  geopuntEmbedUrl?: string
  centroid?: { x: number; y: number }
  fieldUris: GebouweenheidFieldUris
  source: string
}
