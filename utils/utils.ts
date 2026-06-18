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

export const compareText = (a?: string, b?: string) => {
  const left = a?.trim()
  const right = b?.trim()

  // Put empty values at the end
  if (!left && !right) return 0
  if (!left) return 1
  if (!right) return -1

  return left.localeCompare(right, 'nl-BE', {
    sensitivity: 'base',
    numeric: true,
  })
}
