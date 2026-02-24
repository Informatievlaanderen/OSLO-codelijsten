import { QueryEngine } from '@comunica/query-sparql'
import { rdfSerializer } from 'rdf-serialize'
import { SUPPORTED_FORMATS } from '~/constants/constants'
import { getPrefixes } from '@oslo-flanders/core'
import * as RDF from '@rdfjs/types'
import { Readable } from 'stream'

const queryEngine = new QueryEngine()

/**
 * Filters a prefix map to only include prefixes whose namespace URI
 * appears in the given set of quads.
 */
const filterPrefixes = (
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
 * Queries a specific concept by slug from the source and serializes
 * the result in the requested content type.
 */
export const serializeConcept = async (
  conceptSlug: string,
  sourceUrl: string,
  contentType: string,
): Promise<string> => {
  // CONSTRUCT query returns RDF quads instead of bindings
  const query = `
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    PREFIX adms: <https://www.w3.org/ns/adms#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    CONSTRUCT {
      ?concept ?p ?o .
    } WHERE {
      ?concept a skos:Concept .
      FILTER(STRENDS(STR(?concept), "/${conceptSlug}"))
      ?concept ?p ?o .
    }
  `

  const quadStream = await queryEngine.queryQuads(query, {
    sources: [sourceUrl],
    noCache: true,
  })

  // Collect quads into an array so we can inspect them for prefix filtering
  const quads: RDF.Quad[] = await quadStream.toArray()

  // Get all known prefixes and filter to only those used in the quads. Method comes from OSLO-toolchain
  const allPrefixes = await getPrefixes()
  const usedPrefixes = filterPrefixes(allPrefixes, quads)

  // Re-create a readable stream from the collected quads for the serializer
  const quadReadable = Readable.from(quads)

  const textStream = rdfSerializer.serialize(quadReadable, {
    contentType,
    prefixes: usedPrefixes,
  })

  // Collect the stream into a string
  const chunks: string[] = []
  for await (const chunk of textStream) {
    chunks.push(typeof chunk === 'string' ? chunk : chunk.toString())
  }

  const result: string = chunks.join('')
  // For JSON-LD, unwrap the array if it contains a single concept
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

/**
 * Queries a concept scheme and serializes in the requested format.
 */
export const serializeConceptScheme = async (
  schemeSourceUrl: string,
  contentType: string,
): Promise<string> => {
  // Return ALL triples from the source in the requested format
  const query = `
    CONSTRUCT { ?s ?p ?o }
    WHERE { ?s ?p ?o }
  `

  const quadStream = await queryEngine.queryQuads(query, {
    sources: [schemeSourceUrl],
    noCache: true,
  })

  const quads: RDF.Quad[] = await quadStream.toArray()

  const allPrefixes = await getPrefixes()
  const usedPrefixes = filterPrefixes(allPrefixes, quads)

  const quadReadable = Readable.from(quads)

  const textStream = rdfSerializer.serialize(quadReadable, {
    contentType,
    prefixes: usedPrefixes,
  })

  const chunks: string[] = []
  for await (const chunk of textStream) {
    chunks.push(typeof chunk === 'string' ? chunk : chunk.toString())
  }

  return chunks.join('')
}
