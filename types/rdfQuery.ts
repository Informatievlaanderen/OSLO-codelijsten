import type { Bindings } from '@comunica/types'

export interface RdfQueryOptions {
  sources: string[]
  query: string
}

export interface RdfQueryResult {
  bindings: Bindings[]
  error?: Error
}
