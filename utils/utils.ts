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
    let origin = url.origin // Returns: https://data.vlaanderen.be
    return uri.replace(origin, '').replace(/\/(id|doc)\//, '')
  } catch {
    return ''
  }
}
