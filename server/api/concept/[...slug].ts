import { SUPPORTED_EXTENSIONS } from '~/constants/constants'
import { getConcept } from '~/server/services/rdfquery.service'
import { handleContentNegotiation } from '~/services/content-negotiation.service'
import type { Concept } from '~/types/concept'
import type { DatasetConfig } from '~/types/conceptScheme'

export default defineEventHandler(
  async (event): Promise<Concept | string | null> => {
    try {
      const slug = getRouterParam(event, 'slug')

      if (!slug) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Slug parameter is required',
        })
      }

      console.log(
        `[${new Date().toISOString()}] Fetched concept scheme config for: ${slug}`,
      )

      // Detect supported file extension
      const extension: string | undefined = SUPPORTED_EXTENSIONS.find((ext) =>
        slug.endsWith(ext),
      )
      const cleanSlug = extension ? slug.replace(extension, '') : slug

      const config = await getConceptConfig(cleanSlug)

      // Handle content negotiation
      const acceptHeader = getHeader(event, 'accept') ?? ''
      const negotiatedContent = await handleContentNegotiation(
        event,
        acceptHeader,
        config.sourceUrl,
      )
      if (negotiatedContent) return negotiatedContent

      // Return JSON response
      return await buildConceptResponse(config.conceptId, config.sourceUrl)
    } catch (error) {
      // Im not displaying the error or throwing an error to avoid cluttering the logs. It printed out the full RDF query error and HTML of the source
      console.error('Error fetching concept')
      throw createError({
        statusCode: 400,
        statusMessage: 'Error fetching concept',
      })
    }
  },
)

interface ConceptConfig {
  conceptId: string
  sourceUrl: string
}

const getConceptConfig = async (slug: string): Promise<ConceptConfig> => {
  const runtimeConfig = useRuntimeConfig()
  const slugParts = slug.split('/')

  // Handle both formats: "schemeId/conceptId" or just "conceptId"
  let conceptSchemeSlug: string | null = null
  let conceptId: string

  if (slugParts.length > 1) {
    // Format: schemeId/conceptId
    conceptSchemeSlug = slugParts[0]
    conceptId = slugParts[1]
  } else {
    // Single part - just the concept ID
    conceptId = slugParts[0]
  }

  const DATASET_CONFIG_URL: string =
    process.env.DATASET_CONFIG_URL ?? runtimeConfig.DATASET_CONFIG_URL

  const response = await $fetch<any>(DATASET_CONFIG_URL)
  const data: DatasetConfig =
    typeof response === 'string' ? JSON.parse(response) : response

  let sourceUrl: string = ''

  if (conceptSchemeSlug) {
    // Look up the scheme to get its source URL
    const scheme = data.conceptSchemes.find(
      (s: any) => s.urlRef === conceptSchemeSlug,
    )
    sourceUrl = scheme?.sourceUrl ?? ''
  }

  if (!sourceUrl) {
    throw createError({
      statusCode: 404,
      statusMessage: `Concept scheme not found: ${conceptSchemeSlug}`,
    })
  }

  return { conceptId, sourceUrl }
}

const buildConceptResponse = async (
  conceptId: string,
  sourceUrl: string,
): Promise<Concept> => {
  const concept = await getConcept(conceptId, sourceUrl)

  if (!concept) {
    throw createError({
      statusCode: 404,
      statusMessage: `Concept not found: ${conceptId}`,
    })
  }

  return concept
}
