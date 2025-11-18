import { QueryEngine } from '@comunica/query-sparql'
import type { ConceptScheme, ConceptSchemeConfig } from '~/types/conceptScheme'
import { CONCEPT_SCHEME_QUERY } from '~/constants/constants'

const queryEngine = new QueryEngine()

// wasnt able to properly type this function due to comunica types issues
async function executeQuery(query: string, sources: string[]): Promise<any[]> {
  const bindings: any[] = []

  return new Promise<any[]>((resolve, reject) => {
    queryEngine
      .queryBindings(query, { sources })
      .then((bindingsStream) => {
        bindingsStream.on('data', (binding) => {
          bindings.push(binding)
        })

        bindingsStream.on('end', () => {
          resolve(bindings)
        })

        bindingsStream.on('error', (error) => {
          reject(error)
        })
      })
      .catch(reject)
  })
}

export default defineEventHandler(async (): Promise<ConceptScheme[]> => {
  try {
    const response = await $fetch<any>(import.meta.env.VITE_DATASET_CONFIG_URL!)

    const data = typeof response === 'string' ? JSON.parse(response) : response
    const configs: ConceptSchemeConfig[] = data.conceptSchemes

    // Fetch all concept schemes
    const schemes = await Promise.all(
      configs.map(async (config) => {
        try {
          const bindings = await executeQuery(CONCEPT_SCHEME_QUERY, [
            config.url,
          ])

          if (!bindings.length) return null

          const binding = bindings[0]

          return {
            id: config.key,
            uri: binding.get('scheme')?.value ?? '',
            label: binding.get('label')?.value ?? config.key,
            definition: binding.get('definition')?.value ?? '',
            status: binding.get('status')?.value ?? '',
            dataset: binding.get('dataset')?.value ?? '',
            topConcepts: [],
            source: config.url,
          } as ConceptScheme
        } catch (err) {
          console.error(`Error loading scheme ${config.key}:`, err)
          return null
        }
      }),
    )

    return schemes.filter((s) => s !== null) as ConceptScheme[]
  } catch (error) {
    console.error('Error fetching concept schemes:', error)
    return []
  }
})
