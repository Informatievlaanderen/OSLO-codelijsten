import { SUPPORTED_FORMATS } from '~/constants/constants'
import { serializeAllTriples } from '~/services/serialization-service'

export const handleContentNegotiation = async (
  event: any,
  acceptHeader: string,
  sourceUrl: string,
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

  if (slug) {
    const serialized = serializeAllTriples(sourceUrl, contentType)

    if (serialized) {
      setHeader(event, 'Content-Type', contentType)
      return serialized
    }
  }
}
