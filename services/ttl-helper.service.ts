/**
 * Helper service for TTL generation utilities
 */
export class TtlHelperService {
  /**
   * Escape special characters in strings for Turtle format
   */
  escapeString(str: string | undefined): string {
    if (!str) return ''

    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
  }

  /**
   * Determine organization status based on end date
   */
  determineStatus(endDate: string | undefined): string {
    if (!endDate) {
      return 'actief'
    }

    const endDateTime = new Date(endDate).getTime()
    const currentTime = new Date().getTime()

    return endDateTime < currentTime ? 'nietactief' : 'actief'
  }

  /**
   * Get the issued date for an identifier
   */
  getIssuedDate(validityStart: string | undefined): string {
    return validityStart || new Date().toISOString().split('T')[0]
  }

  /**
   * Create a URI from base and path
   */
  createUri(baseUri: string, ...paths: string[]): string {
    return `<${[baseUri, ...paths].join('/')}>`
  }

  /**
   * Generate RDF prefixes
   */
  generatePrefixes(): Record<string, string> {
    return {
      rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
      xsd: 'http://www.w3.org/2001/XMLSchema#',
      dcterms: 'http://purl.org/dc/terms/',
      skos: 'http://www.w3.org/2004/02/skos/core#',
      adms: 'http://www.w3.org/ns/adms#',
      locn: 'http://www.w3.org/ns/locn#',
      schema: 'https://schema.org/',
      org: 'http://www.w3.org/ns/org#',
      reorg: 'http://www.w3.org/ns/regorg#',
      organisatie: 'https://data.vlaanderen.be/ns/organisatie#',
      adres: 'https://data.vlaanderen.be/ns/adres#',
    }
  }

  /**
   * Join non-empty strings with a separator
   */
  joinNonEmpty(strings: (string | undefined)[], separator = '\n'): string {
    return strings.filter(Boolean).join(separator)
  }

  /**
   * Format a date as xsd:date
   */
  formatXsdDate(date: string): string {
    return `"${date}"^^xsd:date`
  }
}
