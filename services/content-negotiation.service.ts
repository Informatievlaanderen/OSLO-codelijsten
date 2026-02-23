import { SUPPORTED_FORMATS } from '~/constants/constants'

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

  if (shouldFetchRaw) {
    const content = await $fetch<string>(sourceUrl)
    const contentType = requestedFormat || 'text/turtle'
    setHeader(event, 'Content-Type', contentType)
    return content
  }

  return null
}
