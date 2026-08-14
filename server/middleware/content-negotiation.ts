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
    const ondernemingMatch = cleanPath.match(/\/onderneming\/(.+)$/)
    const vestigingMatch = cleanPath.match(/\/vestiging\/(.+)$/)
    const adresMatch = cleanPath.match(/\/adres\/(.+)$/)
    const straatnaamMatch = cleanPath.match(/\/straatnaam\/(.+)$/)
    const postinfoMatch = cleanPath.match(/\/postinfo\/(.+)$/)
    const bedrijventerreinMatch = cleanPath.match(/\/bedrijventerrein\/(.+)$/)
    const bedrijventerreinperceelMatch = cleanPath.match(/\/bedrijventerreinperceel\/(.+)$/)
    const beheerdebedrijvenzoneMatch = cleanPath.match(/\/beheerdebedrijvenzone\/(.+)$/)
    const ontwikkelbarebedrijvenzoneMatch = cleanPath.match(/\/ontwikkelbarebedrijvenzone\/(.+)$/)
    const genidMatch = cleanPath.match(/\/.well-known\/genid\/(.+)$/)

    // Redirect to appropriate API endpoint
    switch (true) {
      case !!conceptSchemeMatch:
        apiPath = `/doc/api/conceptscheme/${conceptSchemeMatch![1]}${extension}`
        break
      case !!conceptMatch:
        apiPath = `/doc/api/concept/${conceptMatch![1]}${extension}`
        break
      case !!organisatieMatch:
        apiPath = `/doc/api/organization/${organisatieMatch![1]}${extension}`
        break
      case !!licentieMatch:
        apiPath = `/doc/api/license/${licentieMatch![1]}${extension}`
        break
      case !!ondernemingMatch:
        apiPath = `/doc/api/enterprise/${ondernemingMatch![1]}${extension}`
        break
      case !!vestigingMatch:
        apiPath = `/doc/api/branch/${vestigingMatch![1]}${extension}`
        break
      case !!adresMatch:
        apiPath = `/doc/api/adres/${adresMatch![1]}${extension}`
        break
      case !!straatnaamMatch:
        apiPath = `/doc/api/straatnaam/${straatnaamMatch![1]}${extension}`
        break
      case !!postinfoMatch:
        apiPath = `/doc/api/postinfo/${postinfoMatch![1]}${extension}`
        break
      case !!bedrijventerreinMatch:
        apiPath = `/doc/api/bedrijventerrein/${bedrijventerreinMatch![1]}${extension}`
        break
      case !!bedrijventerreinperceelMatch:
        apiPath = `/doc/api/bedrijventerreinperceel/${bedrijventerreinperceelMatch![1]}${extension}`
        break
      case !!beheerdebedrijvenzoneMatch:
        apiPath = `/doc/api/beheerdebedrijvenzone/${beheerdebedrijvenzoneMatch![1]}${extension}`
        break
      case !!ontwikkelbarebedrijvenzoneMatch:
        apiPath = `/doc/api/ontwikkelbarebedrijvenzone/${ontwikkelbarebedrijvenzoneMatch![1]}${extension}`
        break
      case !!genidMatch:
        apiPath = `/doc/api/genid/${genidMatch![1]}${extension}`
        break
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

      setHeader(event, 'Content-Type', `${contentType}; charset=utf-8`)
      setResponseStatus(event, 200)

      return content
    } catch (err) {
      console.error('Error fetching TTL content:')
      // Don't throw, let it fall through to the Vue page
      return
    }
  }
})
