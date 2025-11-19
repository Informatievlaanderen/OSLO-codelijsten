import { getConcept } from '~/server/services/rdfquery.service'
import { handleContentNegotiation } from '~/services/content-negotiation.service'
import type { Concept } from '~/types/concept'

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

      // See if a .ttl extension is present in the slug
      const hasTtlExtension = slug.endsWith('.ttl')
      const cleanSlug = hasTtlExtension ? slug.replace(/\.ttl$/, '') : slug

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
      console.error('Error fetching concept:', error)
      throw error
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
  const conceptSchemeSlug = slugParts.length > 1 ? slugParts[0] : null
  const conceptId = slugParts.length > 1 ? slugParts[1] : slugParts[0]

  const response = await $fetch<any>(runtimeConfig.DATASET_CONFIG_URL!)
  const data = typeof response === 'string' ? JSON.parse(response) : response

  let sourceUrl: string = ''

  if (conceptSchemeSlug) {
    const scheme = data.conceptSchemes.find(
      (s: any) => s.key === conceptSchemeSlug,
    )
    sourceUrl = scheme?.url
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
