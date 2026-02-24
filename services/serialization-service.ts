import { QueryEngine } from '@comunica/query-sparql'
import { rdfSerializer } from 'rdf-serialize'
import { SUPPORTED_FORMATS } from '~/constants/constants'

const queryEngine = new QueryEngine()

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

  const textStream = rdfSerializer.serialize(quadStream, {
    contentType,
  })

  // Collect the stream into a string
  const chunks: string[] = []
  for await (const chunk of textStream) {
    chunks.push(chunk.toString())
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

  const textStream = rdfSerializer.serialize(quadStream, {
    contentType,
  })

  const chunks: string[] = []
  for await (const chunk of textStream) {
    chunks.push(chunk.toString())
  }

  return chunks.join('')
}
