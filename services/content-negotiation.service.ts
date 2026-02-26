import { SUPPORTED_FORMATS } from '~/constants/constants'
import {
  serializeConcept,
  serializeConceptScheme,
  serializeOrganization,
  serializeLicense,
} from '~/services/serialization-service'

export const handleContentNegotiation = async (
  event: any,
  acceptHeader: string,
  sourceUrl: string,
  entityType?: 'concept' | 'conceptscheme' | 'organization' | 'license',
  slug?: string,
) => {
  const url = getRequestURL(event)
  const pathname = url.pathname

  // Detect file extension first
  const extensionMatch = pathname.match(/\.(\w+)$/)
  const fileExtension = extensionMatch ? extensionMatch[1].toLowerCase() : null
  const requestedFormat = fileExtension
    ? SUPPORTED_FORMATS[fileExtension as keyof typeof SUPPORTED_FORMATS]
    : null

  // Check for supported format
  const supportedFormats = Object.values(SUPPORTED_FORMATS)
  const shouldFetchRaw =
    requestedFormat ||
    supportedFormats.some((fmt) => acceptHeader.includes(fmt))

  if (!shouldFetchRaw) {
    return null
  }

  const contentType =
    requestedFormat ||
    supportedFormats.find((fmt) => acceptHeader.includes(fmt)) ||
    SUPPORTED_FORMATS.ttl

    console.log(contentType, sourceUrl, 'contentypeee')
    console.log(contentType, sourceUrl, 'contentypeee')

  if (entityType && slug) {
    let serialized: string | null = null

    switch (entityType) {
      case 'concept':
        serialized = await serializeConcept(slug, sourceUrl, contentType)
        break
      case 'conceptscheme':
        serialized = await serializeConceptScheme(slug, sourceUrl)
        break
      case 'organization':
        serialized = await serializeOrganization(slug, sourceUrl, contentType)
        break
      case 'license':
        serialized = await serializeLicense(slug, sourceUrl, contentType)
        break
    }

    if (serialized) {
      setHeader(event, 'Content-Type', contentType)
      return serialized
    }
  }
}
