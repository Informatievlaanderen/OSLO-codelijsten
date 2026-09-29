import { QueryEngine } from '@comunica/query-sparql'
import { rdfSerializer } from 'rdf-serialize'
import { rdfParser } from 'rdf-parse'
import { getPrefixes } from '@oslo-flanders/core'
import * as RDF from '@rdfjs/types'
import { Readable } from 'stream'
import { filterPrefixes, unwrapJsonLdArray } from '../utils/serialization.utils'

const queryEngine = new QueryEngine()

/**
 * Serializes an array of in-memory RDF quads in the requested format.
 */
export const serializeQuadsToString = async (
  quads: RDF.Quad[],
  contentType: string,
): Promise<string> => {
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

  return unwrapJsonLdArray(chunks.join(''), contentType)
}

/**
 * Parses raw JSON-LD data into RDF quads and serializes them to the requested format.
 * This is used when the source API already returns valid JSON-LD and we want to
 * produce other RDF serializations (e.g. Turtle, N-Triples) from it directly,
 * rather than reconstructing quads from a filtered data model.
 */
export const serializeJsonLdToFormat = async (
  jsonLdData: unknown,
  contentType: string,
): Promise<string> => {
  const jsonLdString = JSON.stringify(jsonLdData)
  const textStream = new Readable()
  textStream.push(jsonLdString)
  textStream.push(null)
  const quadStream = rdfParser.parse(textStream, {
    contentType: 'application/ld+json',
    baseIRI: undefined,
  })

  const quads: RDF.Quad[] = []
  for await (const quad of quadStream) {
    quads.push(quad)
  }

  const allPrefixes = await getPrefixes()
  const usedPrefixes = filterPrefixes(allPrefixes, quads)

  const quadReadable = Readable.from(quads)
  const serializedStream = rdfSerializer.serialize(quadReadable, {
    contentType,
    prefixes: usedPrefixes,
  })

  const chunks: string[] = []
  for await (const chunk of serializedStream) {
    chunks.push(typeof chunk === 'string' ? chunk : chunk.toString())
  }

  return unwrapJsonLdArray(chunks.join(''), contentType)
}

/**
 * Serializes all triples from the given source URL in the requested format.
 * Used for sources that already contain exactly the data needed (e.g. per-entity TTL files).
 */
export const serializeAllTriples = async (
  sourceUrl: string,
  contentType: string,
): Promise<string> => {
  const query = `
    CONSTRUCT { ?s ?p ?o }
    WHERE { ?s ?p ?o }
  `

  const quadStream = await queryEngine.queryQuads(query, {
    sources: [sourceUrl],
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

  return unwrapJsonLdArray(chunks.join(''), contentType)
}

/**
 * Serializes all triples for a specific entity URI from a SPARQL endpoint.
 */
export const serializeEntityTriples = async (
  entityUri: string,
  sparqlEndpoint: string,
  contentType: string,
): Promise<string> => {
  const query = `
    CONSTRUCT { ?s ?p ?o }
    WHERE {
      { <${entityUri}> ?p ?o . BIND(<${entityUri}> AS ?s) }
      UNION
      { ?s ?p <${entityUri}> . BIND(<${entityUri}> AS ?o) }
    }
  `

  const quadStream = await queryEngine.queryQuads(query, {
    // Explicitly set type to 'sparql' to avoid Comunica's source auto‑detection probe,
    // which sends a GET without ?query= and fails on nginx‑backed endpoints that only
    // proxy requests carrying a query parameter (e.g. QLever behind /sparql/qlever).
    sources: [{ type: 'sparql', value: sparqlEndpoint }],
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

  return unwrapJsonLdArray(chunks.join(''), contentType)
}
