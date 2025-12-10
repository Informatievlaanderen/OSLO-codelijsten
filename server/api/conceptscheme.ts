import { CONCEPT_SCHEME_QUERY } from '~/constants/constants'
import { executeQuery } from '~/server/services/rdfquery.service'
import type { ConceptScheme, ConceptSchemeConfig } from '~/types/conceptScheme'

export default defineEventHandler(async (): Promise<ConceptScheme[]> => {
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
    const data = typeof response === 'string' ? JSON.parse(response) : response
    const configs: ConceptSchemeConfig[] = data.conceptSchemes

    // Fetch all concept schemes
    const schemes = await Promise.all(
      configs.map(async (config) => {
        try {
          const bindings = await executeQuery(CONCEPT_SCHEME_QUERY, [
            config.sourceUrl,
          ])

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
      }),
    )

    return schemes.filter((s) => s !== null) as ConceptScheme[]
  } catch (error) {
    console.error('Error fetching concept schemes:')
    return []
  }
})
