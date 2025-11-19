import { CONCEPT_SCHEME_QUERY, topConceptQuery } from '~/constants/constants'
import { executeQuery } from '~/server/services/rdfquery.service'
import type { ConceptScheme, ConceptSchemeConfig } from '~/types/conceptScheme'

export default defineEventHandler(
  async (event): Promise<ConceptScheme | null> => {
    try {
      // Env variable access during build time
      const runtimeConfig = useRuntimeConfig()
      const slug = getRouterParam(event, 'slug')

      if (!slug) {
        throw createError({
          statusCode: 400,
        })
      }

      const response = await $fetch<any>(runtimeConfig.DATASET_CONFIG_URL!)

      const data =
        typeof response === 'string' ? JSON.parse(response) : response
      const configs: ConceptSchemeConfig[] = data.conceptSchemes

      // Find the matching config by key
      const config = configs.find((c) => c.key === slug)

      if (!config) {
        throw createError({
          statusCode: 404,
          statusMessage: `Concept scheme not found: ${slug}`,
        })
      }

      const bindings = await executeQuery(CONCEPT_SCHEME_QUERY, [config.url])

      if (!bindings.length) {
        throw createError({
          statusCode: 404,
          statusMessage: `No data found for concept scheme: ${slug}`,
        })
      }

      const binding = bindings[0]
      const schemeUri = binding.get('scheme')?.value ?? ''

      // Fetch top concepts
      const topConceptsQuery = topConceptQuery(schemeUri)
      const topConceptBindings = await executeQuery(topConceptsQuery, [
        config.url,
      ])

      const topConcepts = topConceptBindings.map((b) => ({
        id: b.get('concept')?.value.split('/').pop() ?? '',
        uri: b.get('concept')?.value ?? '',
        label: b.get('label')?.value ?? '',
        definition: b.get('definition')?.value ?? '',
        notation: b.get('notation')?.value ?? '',
        source: config.url,
      }))

      return {
        id: config.key,
        uri: schemeUri,
        label: binding.get('label')?.value ?? config.key,
        definition: binding.get('definition')?.value ?? '',
        status: binding.get('status')?.value ?? '',
        dataset: binding.get('dataset')?.value ?? '',
        topConcepts,
        concepts: topConcepts,
        source: config.url,
      } as ConceptScheme
    } catch (error) {
      console.error('Error fetching concept scheme:', error)
      throw error
    }
  },
)
