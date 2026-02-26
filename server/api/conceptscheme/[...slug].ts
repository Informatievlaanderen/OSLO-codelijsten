import {
  CONCEPT_SCHEME_QUERY,
  topConceptQuery,
  SUPPORTED_EXTENSIONS,
  SUPPORTED_FORMATS,
} from '~/constants/constants'
import { executeQuery } from '~/server/services/rdfquery.service'
import { serializeAllTriples } from '~/services/serialization-service'
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

      // Detect supported file extension
      const extension: string | undefined = SUPPORTED_EXTENSIONS.find((ext) =>
        slug.endsWith(ext),
      )

      const cleanSlug = extension ? slug.replace(extension, '') : slug

      console.log(
        `[${new Date().toISOString()}] Fetched concept scheme config for: ${cleanSlug}`,
      )

      const config = await getConceptSchemeConfig(cleanSlug)

      // Handle content negotiation - serialize only this concept
      const acceptHeader = getHeader(event, 'accept') ?? ''
      const extensionFormat = extension
        ? SUPPORTED_FORMATS[
            extension.replace('.', '') as keyof typeof SUPPORTED_FORMATS
          ]
        : null
      const requestedFormat =
        extensionFormat ||
        Object.values(SUPPORTED_FORMATS).find((fmt) =>
          acceptHeader.includes(fmt),
        )
      if (requestedFormat) {
        const serialized = await serializeAllTriples(
          config.sourceUrl,
          requestedFormat,
        )
        setHeader(event, 'Content-Type', requestedFormat)
        return serialized
      }

      // Return JSON response
      return await buildConceptSchemeResponse(config)
    } catch (error) {
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
  extension?: string,
): Promise<ConceptSchemeConfig> => {
  const runtimeConfig = useRuntimeConfig()
  const DATASET_CONFIG_URL: string =
    process.env.DATASET_CONFIG_URL ?? runtimeConfig.DATASET_CONFIG_URL
  const response = await $fetch<any>(DATASET_CONFIG_URL)
  const data: DatasetConfig =
    typeof response === 'string' ? JSON.parse(response) : response

  const config = data.conceptSchemes.find((c: any) => c.urlRef === slug)

  // throw an error if it's explicitally stated to use an extension but it's not the correct one (jsonld versus ttl for example)
  if (extension && !config?.sourceUrl.endsWith(extension)) {
    throw createError({
      statusCode: 404,
      statusMessage: `Concept scheme not found in the requested content type: ${slug}, ${extension}`,
    })
  }

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
