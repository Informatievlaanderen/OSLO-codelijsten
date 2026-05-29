import {
  CONCEPT_SCHEME_QUERY,
  CONCEPT_SCHEME_BY_ID_QUERY,
} from '~/constants/constants'
import { executeQuery } from '~/server/services/rdfquery.service'
import type { ConceptScheme, ConceptSchemeConfig } from '~/types/conceptScheme'

const CONCURRENCY = 10

const runConcurrently = async <T>(
  tasks: Array<() => Promise<T>>,
  limit: number,
): Promise<T[]> => {
  const results: T[] = new Array(tasks.length)
  let next = 0
  async function worker() {
    while (next < tasks.length) {
      const i = next++
      results[i] = await tasks[i]()
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, tasks.length) }, worker),
  )
  return results
}

export default defineCachedEventHandler(
  async (): Promise<ConceptScheme[]> => {
    try {
      const runtimeConfig = useRuntimeConfig()
      // Env variable access during build time
      const DATASET_CONFIG_URL: string =
        process.env.DATASET_CONFIG_URL ?? runtimeConfig.DATASET_CONFIG_URL
      const response = await $fetch<any>(DATASET_CONFIG_URL)

      console.log(
        `[${new Date().toISOString()}] Fetched concept scheme config from:`,
        DATASET_CONFIG_URL,
      )
      const data =
        typeof response === 'string' ? JSON.parse(response) : response
      const configs: ConceptSchemeConfig[] = data.conceptSchemes

      const tasks = configs.map(
        (config) => async (): Promise<ConceptScheme | null> => {
          try {
            // First try filtered query to find the exact scheme matching the urlRef
            let bindings = await executeQuery(
              CONCEPT_SCHEME_BY_ID_QUERY(config.urlRef),
              [config.sourceUrl],
            )

            // Fallback to generic query if filtered returns nothing
            if (!bindings.length) {
              bindings = await executeQuery(CONCEPT_SCHEME_QUERY, [
                config.sourceUrl,
              ])
            }

            if (!bindings.length) return null

            const binding = bindings[0]

            return {
              id: config.urlRef,
              uri: binding.get('scheme')?.value ?? '',
              label: binding.get('label')?.value ?? config.urlRef,
              definition: binding.get('definition')?.value ?? '',
              status: binding.get('status')?.value ?? '',
              dataset: binding.get('dataset')?.value ?? '',
              topConcepts: [],
              source: config.sourceUrl,
            } as ConceptScheme
          } catch (err) {
            // Im not displaying the error to avoid cluttering the logs. It printed out the full RDF query error and HTML of the source
            console.error(`Error loading scheme ${config.urlRef}`)
            return null
          }
        },
      )

      const schemes = await runConcurrently(tasks, CONCURRENCY)
      return schemes.filter((s) => s !== null) as ConceptScheme[]
    } catch (error) {
      console.error('Error fetching concept schemes:', error)
      return []
    }
  },
  {
    maxAge: 60 * 60, // cache results for 1 hour
    name: 'conceptschemes',
    getKey: () => 'all',
  },
)
