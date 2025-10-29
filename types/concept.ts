import type { ConceptScheme } from './conceptScheme'

export interface Concept {
  id: string
  uri: string
  label?: string
  definition?: string
  additionalInfo?: string
  notation?: string
  status?: string
  dataset?: string
  inScheme?: ConceptScheme[]
  topConceptOf?: ConceptScheme[]
  narrower?: Concept[]
  broader?: Concept[]
}

export type TopConcept = Pick<
  Concept,
  'id' | 'uri' | 'label' | 'definition' | 'notation'
>
