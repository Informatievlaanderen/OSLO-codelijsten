import { SUPPORTED_EXTENSIONS, SUPPORTED_FORMATS } from '~/constants/constants'

export default defineEventHandler(async (event) => {
  const url: string = getRequestURL(event).pathname

  // Skip middleware for API routes to prevent double execution and calls on the api
  if (url.includes('/doc/api/')) {
    return
  }

  const acceptHeader: string | undefined = getRequestHeader(event, 'accept')

  // Check if URL ends with any supported extension
  const extension: string | undefined = SUPPORTED_EXTENSIONS.find(
    (ext: string) => url.endsWith(ext),
  )

  // if there is no extension, we don't need to do any CN
  if (!extension) return

  // remove the . from .ttl, .jsonld,...
  const contentType: string = SUPPORTED_FORMATS[extension?.replace('.', '')]

  console.log(acceptHeader, 'acceptheader')
  console.log(acceptHeader, 'acceptheader')
  console.log(acceptHeader, 'acceptheader')
  console.log(acceptHeader, 'acceptheader')

  if (extension || acceptHeader) {
    let apiPath: string | null = null

    // Remove any supported extension if present for matching
    let cleanPath = url
    for (const ext of SUPPORTED_EXTENSIONS) {
      if (cleanPath.endsWith(ext)) {
        cleanPath = cleanPath.slice(0, -ext.length)
        break
      }
    }

    // Match paths for different resource types
    const conceptSchemeMatch = cleanPath.match(/\/conceptscheme\/(.+)$/)
    const conceptMatch = cleanPath.match(/\/concept\/(.+)$/)
    const organisatieMatch = cleanPath.match(/\/organisatie\/(.+)$/)
    const licentieMatch = cleanPath.match(/\/licentie\/(.+)$/)

    // Redirect to appropriate API endpoint
    if (conceptSchemeMatch) {
      apiPath = `/doc/api/conceptscheme/${conceptSchemeMatch[1]}${extension}`
    } else if (conceptMatch) {
      apiPath = `/doc/api/concept/${conceptMatch[1]}${extension}`
    } else if (organisatieMatch) {
      apiPath = `/doc/api/organization/${organisatieMatch[1]}${extension}`
    } else if (licentieMatch) {
      apiPath = `/doc/api/license/${licentieMatch[1]}${extension}`
    }

    console.log(apiPath, 'apipath')
    console.log(apiPath, 'apipath')
    console.log(apiPath, 'apipath')

    if (!apiPath) {
      return
    }

    console.log(apiPath)

    try {
      // Fetch from API with Turtle accept header
      const content = await $fetch<string>(apiPath, {
        headers: {
          Accept: contentType,
        },
      })

      setHeader(event, 'Content-Type', contentType)
      setResponseStatus(event, 200)

      return content
    } catch (err) {
      console.error('Error fetching TTL content:')
      // Don't throw, let it fall through to the Vue page
      return
    }
  }
})
