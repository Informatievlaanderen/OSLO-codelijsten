import { WG_STATUS_CODELIST } from '~/constants/constants'

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

export const getStatusLabel = (
  status?: string,
  statusLabel?: string,
): string => {
  if (statusLabel?.trim()) {
    return statusLabel.trim()
  }

  if (!status) {
    return ''
  }

  const value = status.trim()
  if (!value) {
    return ''
  }

  const segments = value.split('/')
  const val: string = segments[segments.length - 1]
  if (val === 'ingebruik') {
    return WG_STATUS_CODELIST.ingebruik
  }
  if (val === 'uitgebruik') {
    return WG_STATUS_CODELIST.uitgebruik
  }
  if (val === 'verwijderd') {
    return WG_STATUS_CODELIST.verwijderd
  }
  return val
}

export const getStatusClass = (status?: string): string => {
  const value = status?.trim()
  if (!value) {
    return ''
  }

  const segments = value.split('/')
  const code = segments[segments.length - 1].toLowerCase()

  if (code === 'ingebruik') {
    return 'status-pill--ingebruik'
  }

  if (code === 'uitgebruik') {
    return 'status-pill--uitgebruik'
  }

  if (code === 'verwijderd') {
    return 'status-pill--verwijderd'
  }

  return ''
}
