import { CONCEPT_SCHEME_QUERY, topConceptQuery } from '~/constants/constants'
import { executeQuery } from '~/server/services/rdfquery.service'
import { handleContentNegotiation } from '~/services/content-negotiation.service'
import type { ConceptScheme, ConceptSchemeConfig } from '~/types/conceptScheme'

export default defineEventHandler(
  async (event): Promise<ConceptScheme | string | null> => {
    try {
      const slug = getRouterParam(event, 'slug')

      if (!slug) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Slug is required',
        })
      }

      // See if a .ttl extension is present in the slug
      const hasTtlExtension = slug.endsWith('.ttl')
      const cleanSlug = hasTtlExtension ? slug.replace(/\.ttl$/, '') : slug

      const config = await getConceptSchemeConfig(cleanSlug)

      // Handle content negotiation
      const acceptHeader = getHeader(event, 'accept') ?? ''
      const negotiatedContent = await handleContentNegotiation(
        event,
        acceptHeader,
        config.url,
      )
      if (negotiatedContent) return negotiatedContent

      // Return JSON response
      return await buildConceptSchemeResponse(config)
    } catch (error) {
      console.error('Error fetching concept scheme:', error)
      throw error
    }
  },
)

const getConceptSchemeConfig = async (
  slug: string,
): Promise<ConceptSchemeConfig> => {
  const runtimeConfig = useRuntimeConfig()
  const response = await $fetch<any>(runtimeConfig.DATASET_CONFIG_URL!)
  const data = typeof response === 'string' ? JSON.parse(response) : response

  const config = data.conceptSchemes.find((c: any) => c.key === slug)

  if (!config) {
    throw createError({
      statusCode: 404,
      statusMessage: `Concept scheme not found: ${slug}`,
    })
  }

  return config
}

const buildConceptSchemeResponse = async (
  config: ConceptSchemeConfig,
): Promise<ConceptScheme> => {
  const bindings = await executeQuery(CONCEPT_SCHEME_QUERY, [config.url])

  if (!bindings.length) {
    throw createError({
      statusCode: 404,
      statusMessage: `No data found for concept scheme: ${config.key}`,
    })
  }

  const binding = bindings[0]
  const schemeUri = binding.get('scheme')?.value ?? ''

  const topConceptsQuery = topConceptQuery(schemeUri)
  const topConceptBindings = await executeQuery(topConceptsQuery, [config.url])

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
  }
}
