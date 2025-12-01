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
  source: string
}

export interface ConceptSchemeConfig {
  urlRef: string
  sourceUrl: string
}

export interface DatasetConfig {
  conceptSchemes: ConceptSchemeConfig[]
}
