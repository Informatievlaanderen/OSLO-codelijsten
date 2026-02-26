import { SUPPORTED_FORMATS } from '~/constants/constants'
import * as RDF from '@rdfjs/types'

/**
 * Filters a prefix map to only include prefixes whose namespace URI
 * appears in the given set of quads.
 */
export const filterPrefixes = (
  prefixes: Record<string, string>,
  quads: RDF.Quad[],
): Record<string, string> => {
  // Collect all URIs used in the quads
  const usedUris = new Set<string>()
  for (const quad of quads) {
    for (const term of [
      quad.subject,
      quad.predicate,
      quad.object,
      quad.graph,
    ]) {
      if (term.termType === 'NamedNode') {
        usedUris.add(term.value)
      }
    }
  }

  // Keep only prefixes where at least one URI starts with the namespace
  const filtered: Record<string, string> = {}
  for (const [prefix, namespace] of Object.entries(prefixes)) {
    for (const uri of usedUris) {
      if (uri.startsWith(namespace)) {
        filtered[prefix] = namespace
        break
      }
    }
  }
  return filtered
}

/**
 * Unwraps a single-item JSON-LD array into an object.
 * For JSON-LD responses containing a single item in an array,
 * returns the unwrapped object. Otherwise returns the result as-is.
 */
export const unwrapJsonLdArray = (result: string, contentType: string): string => {
  if (contentType === SUPPORTED_FORMATS.jsonld) {
    try {
      const parsed = JSON.parse(result)
      if (Array.isArray(parsed) && parsed.length === 1) {
        return JSON.stringify(parsed[0], null, 2)
      }
    } catch {
      // If parsing fails, return the raw result
    }
  }
  return result
}
