import { TEXT_TURTLE } from '~/constants/constants'

export const handleContentNegotiation = async (
  event: any,
  acceptHeader: string,
  sourceUrl: string,
) => {
  const url = getRequestURL(event)
  const pathname = url.pathname

  // Check for .ttl extension and accept header
  const hasTtlExtension = pathname.endsWith('.ttl')
  const acceptsTurtle = acceptHeader.includes(TEXT_TURTLE)

  if (hasTtlExtension || acceptsTurtle) {
    const content = await $fetch<string>(sourceUrl)
    setHeader(event, 'Content-Type', TEXT_TURTLE)
    return content
  }

  return null
}
