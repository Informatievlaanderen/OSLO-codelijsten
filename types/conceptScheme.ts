import type { Concept, TopConcept } from '~/types/concept'

export interface ConceptScheme {
  id: string
  uri: string
  label?: string
  definition?: string
  status?: string
  dataset?: string
  topConcepts?: TopConcept[]
  concepts?: Concept[]
}

export interface ConceptSchemeConfig {
  key: string
  type: 'file-import' | 'organisation'
  url: string
  graphname: string
}

export interface DatasetConfig {
  conceptSchemes: ConceptSchemeConfig[]
}
