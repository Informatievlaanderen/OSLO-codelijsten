import { TEXT_TURTLE, TTL } from '~/constants/constants'

export default defineEventHandler(async (event) => {
  const url: string = getRequestURL(event).pathname

  // Skip middleware for API routes to prevent double execution and calls on the api
  if (url.includes('/doc/api/')) {
    return
  }

  const acceptHeader: string | undefined = getRequestHeader(event, 'accept')

  if (url.endsWith(TTL) || acceptHeader === TEXT_TURTLE) {
    let apiPath: string | null = null

    // Remove .ttl extension if present for matching
    const cleanPath = url.replace(/\.ttl$/, '')

    // Match paths for different resource types
    const conceptSchemeMatch = cleanPath.match(/\/conceptscheme\/(.+)$/)
    const conceptMatch = cleanPath.match(/\/concept\/(.+)$/)
    const organisatieMatch = cleanPath.match(/\/organisatie\/(.+)$/)
    const licentieMatch = cleanPath.match(/\/licentie\/(.+)$/)

    // Redirect to appropriate API endpoint
    if (conceptSchemeMatch) {
      apiPath = `/doc/api/conceptscheme/${conceptSchemeMatch[1]}`
    } else if (conceptMatch) {
      apiPath = `/doc/api/concept/${conceptMatch[1]}`
    } else if (organisatieMatch) {
      apiPath = `/doc/api/organization/${organisatieMatch[1]}.ttl`
    } else if (licentieMatch) {
      apiPath = `/doc/api/license/${licentieMatch[1]}.ttl`
    }

    if (!apiPath) {
      return
    }

    try {
      // Fetch from API with Turtle accept header
      const content = await $fetch<string>(apiPath, {
        headers: {
          Accept: TEXT_TURTLE,
        },
      })

      setHeader(event, 'Content-Type', TEXT_TURTLE)
      setResponseStatus(event, 200)

      return content
    } catch (err) {
      console.error('Error fetching TTL content:')
      // Don't throw, let it fall through to the Vue page
      return
    }
  }
})
