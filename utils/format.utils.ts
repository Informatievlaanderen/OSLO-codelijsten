export const getFormatExtension = (url: string): string => {
  const parts = url.split('.')
  const extension = parts[parts.length - 1].split('?')[0].split('#')[0]
  return extension.toLowerCase()
}

export const getFormatLabel = (url: string): string => {
  const extension = getFormatExtension(url)

  const labelMap: Record<string, string> = {
    ttl: 'RDF/Turtle',
    nt: 'N-Triples',
    rdf: 'RDF/XML',
    jsonld: 'JSON-LD',
    xml: 'XML',
    json: 'JSON',
    csv: 'CSV',
    xlsx: 'Excel',
    pdf: 'PDF',
    geojson: 'GeoJSON',
  }

  return labelMap[extension] ?? extension.toUpperCase()
}
