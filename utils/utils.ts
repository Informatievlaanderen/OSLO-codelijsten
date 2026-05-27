export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('nl-BE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const openSource = (source: string) => {
  if (!source) return
  window.open(source, '_blank')
}

export const extractConcept = (uri: string): string => {
  try {
    const url = new URL(uri)

    // if it's a Vlaanderen url, it will most likely be one of our conceptschemes and thus needs to be an internal path
    // Can't return the full url to keep test environments working
    if (!url.origin.includes('vlaanderen')) {
      return uri
    }

    return `/doc/${uri.replace(url.origin, '').replace(/\/(id|doc)\//, '')}`
  } catch {
    return ''
  }
}
