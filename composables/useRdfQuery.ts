import { QueryEngine } from '@comunica/query-sparql'
import type { Bindings } from '@comunica/types'
import type { RdfQueryOptions, RdfQueryResult } from '~/types/rdfQuery'

export const useRdfQuery = () => {
  const queryEngine = new QueryEngine()

  const executeQuery = async (
    options: RdfQueryOptions,
  ): Promise<RdfQueryResult> => {
    const { query, sources } = options

    return new Promise((resolve, reject) => {
      const bindings: Bindings[] = []

      queryEngine
        .queryBindings(query, { sources })
        .then((bindingsStream) => {
          bindingsStream.on('data', (binding) => {
            bindings.push(binding)
          })

          bindingsStream.on('end', () => {
            resolve({ bindings })
          })

          bindingsStream.on('error', (error) => {
            reject(error)
          })
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  return {
    executeQuery,
  }
}
