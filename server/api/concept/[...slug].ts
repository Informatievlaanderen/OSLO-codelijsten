import { getConcept } from '~/server/services/rdfquery.service'
import type { Concept } from '~/types/concept'

export default defineEventHandler(async (event): Promise<Concept | null> => {
  try {
    // Env variable access during build time
    const runtimeConfig = useRuntimeConfig()
    const slug = getRouterParam(event, 'slug')

    if (!slug) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Slug parameter is required',
      })
    }

    const slugParts = (slug as string).split('/')
    const conceptSchemeSlug = slugParts.length > 1 ? slugParts[0] : null
    const conceptId = slugParts.length > 1 ? slugParts[1] : slugParts[0]

    // Fetch dataset config to get source URL
    const response = await $fetch<any>(runtimeConfig.DATASET_CONFIG_URL!)
    const data = typeof response === 'string' ? JSON.parse(response) : response

    let sourceUrl: string = ''

    if (conceptSchemeSlug) {
      const scheme = data.conceptSchemes.find(
        (s: any) => s.key === conceptSchemeSlug,
      )
      sourceUrl = scheme?.url
    }

    // Call the server-side getConcept function with sourceUrl
    const concept = await getConcept(conceptId, sourceUrl)

    if (!concept) {
      throw createError({
        statusCode: 404,
        statusMessage: `Concept not found: ${conceptId}`,
      })
    }

    return concept
  } catch (error) {
    console.error('Error fetching concept:', error)
    throw error
  }
})
