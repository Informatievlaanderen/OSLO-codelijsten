import { SUPPORTED_FORMATS } from '~/constants/constants'
import {
  serializeConcept,
  serializeConceptScheme,
} from '~/services/serialization-service'

export const handleContentNegotiation = async (
  event: any,
  acceptHeader: string,
  sourceUrl: string,
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

  setHeader(event, 'Content-Type', contentType)

  // If the requested format matches the source format, return raw
  if (contentType === SUPPORTED_FORMATS.ttl && sourceUrl.endsWith('.ttl')) {
    const content = await $fetch<string>(sourceUrl)
    return content
  }

  // Otherwise, use Comunica to serialize to the requested format
  // Determine the resource type from the URL path
  const conceptMatch = pathname.match(/\/concept\/(.+?)(?:\.\w+)?$/)
  if (conceptMatch) {
    const slug = conceptMatch[1]
    return await serializeConcept(slug, sourceUrl, contentType)
  }

  // For concept schemes or other resources, serialize the whole source
  return await serializeConceptScheme(sourceUrl, contentType)
}
