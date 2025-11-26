import { TEXT_TURTLE, TTL } from '~/constants/constants'

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)

  // Only handle .ttl requests for /conceptscheme or /concept paths
  if (!url.pathname.endsWith(TTL)) {
    return
  }

  let apiPath: string | null = null

  // Match /conceptscheme/slug(.+)/.ttl or /concept/slug(.+)/.ttl or /organisatie/slug(.+)/.ttl
  const conceptSchemeMatch = url.pathname.match(/\/conceptscheme\/(.+)\.ttl$/)
  const conceptMatch = url.pathname.match(/\/concept\/(.+)\.ttl$/)
  const organisatieMatch = url.pathname.match(/\/organisatie\/(.+)\.ttl$/)

  // Redirect to appropriate API endpoint
  if (conceptSchemeMatch) {
    apiPath = `/doc/api/conceptscheme/${conceptSchemeMatch[1]}`
  } else if (conceptMatch) {
    apiPath = `/doc/api/concept/${conceptMatch[1]}`
  } else if (organisatieMatch) {
    apiPath = `/doc/api/organization/${organisatieMatch[1]}.ttl`
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
})
