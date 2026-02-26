import { QueryEngine } from '@comunica/query-sparql'
import { rdfSerializer } from 'rdf-serialize'
import { getPrefixes } from '@oslo-flanders/core'
import * as RDF from '@rdfjs/types'
import { Readable } from 'stream'
import { filterPrefixes, unwrapJsonLdArray } from '../utils/serialization.utils'

const queryEngine = new QueryEngine()

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
