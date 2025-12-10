import { CONCEPT_SCHEME_QUERY, topConceptQuery } from '~/constants/constants'
import { executeQuery } from '~/server/services/rdfquery.service'
import { handleContentNegotiation } from '~/services/content-negotiation.service'
import type {
  ConceptScheme,
  ConceptSchemeConfig,
  DatasetConfig,
} from '~/types/conceptScheme'

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

      console.log(
        `[${new Date().toISOString()}] Fetched concept scheme config for: ${slug}`,
      )

      // See if a .ttl extension is present in the slug
      const hasTtlExtension = slug.endsWith('.ttl')
      const cleanSlug = hasTtlExtension ? slug.replace(/\.ttl$/, '') : slug

      const config = await getConceptSchemeConfig(cleanSlug)

      // Handle content negotiation
      const acceptHeader = getHeader(event, 'accept') ?? ''
      const negotiatedContent = await handleContentNegotiation(
        event,
        acceptHeader,
        config.sourceUrl,
      )
      if (negotiatedContent) return negotiatedContent

      // Return JSON response
      return await buildConceptSchemeResponse(config)
    } catch (error) {
      // Im not displaying the error or throwing an error to avoid cluttering the logs. It printed out the full RDF query error and HTML of the source
      console.error('Error fetching concept scheme')
      throw createError({
        statusCode: 400,
        statusMessage: 'Error fetching concept scheme',
      })
    }
  },
)

const getConceptSchemeConfig = async (
  slug: string,
): Promise<ConceptSchemeConfig> => {
  const runtimeConfig = useRuntimeConfig()
  const DATASET_CONFIG_URL: string =
    process.env.DATASET_CONFIG_URL ?? runtimeConfig.DATASET_CONFIG_URL
  const response = await $fetch<any>(DATASET_CONFIG_URL)
  const data: DatasetConfig =
    typeof response === 'string' ? JSON.parse(response) : response

  const config = data.conceptSchemes.find((c: any) => c.urlRef === slug)

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
  const bindings = await executeQuery(CONCEPT_SCHEME_QUERY, [config.sourceUrl])

  if (!bindings.length) {
    throw createError({
      statusCode: 404,
      statusMessage: `No data found for concept scheme: ${config.urlRef}`,
    })
  }

  const binding = bindings[0]
  const schemeUri = binding.get('scheme')?.value ?? ''

  const topConceptsQuery = topConceptQuery(schemeUri)
  const topConceptBindings = await executeQuery(topConceptsQuery, [
    config.sourceUrl,
  ])

  const topConcepts = topConceptBindings.map((b) => ({
    id: b.get('concept')?.value.split('/').pop() ?? '',
    uri: b.get('concept')?.value ?? '',
    label: b.get('label')?.value ?? '',
    definition: b.get('definition')?.value ?? '',
    notation: b.get('notation')?.value ?? '',
    source: config.sourceUrl,
  }))

  return {
    id: config.urlRef,
    uri: schemeUri,
    label: binding.get('label')?.value ?? config.urlRef,
    definition: binding.get('definition')?.value ?? '',
    status: binding.get('status')?.value ?? '',
    dataset: binding.get('dataset')?.value ?? '',
    concepts: topConcepts,
    source: config.sourceUrl,
  }
}
