import {
  SUPPORTED_EXTENSIONS,
  SUPPORTED_FORMATS,
  TTL,
} from '~/constants/constants'

export default defineEventHandler(async (event) => {
  const url: string = getRequestURL(event).pathname

  // Skip middleware for API routes to prevent double execution and calls on the api
  if (url.includes('/doc/api/')) {
    return
  }

  const acceptHeader: string | undefined = getRequestHeader(event, 'accept')

  // Check if URL ends with any supported extension
  let extension: string | undefined = SUPPORTED_EXTENSIONS.find((ext: string) =>
    url.endsWith(ext),
  )

  const supportsFormat =
    extension ||
    (acceptHeader &&
      Object.values(SUPPORTED_FORMATS).some((fmt) =>
        acceptHeader.includes(fmt),
      ))

  if (!supportsFormat) {
    return
  }

  // If no extension in URL, derive it from accept header
  if (!extension && acceptHeader) {
    for (const [key, mimeType] of Object.entries(SUPPORTED_FORMATS)) {
      if (acceptHeader.includes(mimeType)) {
        extension = `.${key}`
        break
      }
    }
  }

  // remove the . from .ttl, .jsonld,...
  const contentType: string =
    SUPPORTED_FORMATS[(extension ?? TTL)?.replace('.', '')]

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

    // Match peaths for different resource types
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

    if (!apiPath) {
      return
    }

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
