import { QueryEngine } from '@comunica/query-sparql'
import { rdfSerializer } from 'rdf-serialize'
import { getPrefixes } from '@oslo-flanders/core'
import * as RDF from '@rdfjs/types'
import { Readable } from 'stream'
import { filterPrefixes, unwrapJsonLdArray } from '../utils/serialization.utils'

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

  return unwrapJsonLdArray(chunks.join(''), contentType)
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

  return unwrapJsonLdArray(chunks.join(''), contentType)
}

export const serializeOrganization = async (
  orgSlug: string,
  sourceUrl: string,
  contentType: string,
): Promise<string> => {
  const query = `
    PREFIX dct: <http://purl.org/dc/terms/>
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    PREFIX org: <http://www.w3.org/ns/org#>
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    PREFIX adms: <http://www.w3.org/ns/adms#>
    PREFIX schema: <http://schema.org/>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    CONSTRUCT {
      ?org ?p ?o .
      ?org schema:contactPoint ?cp .
      ?cp ?cpPred ?cpObj .
      ?org adms:identifier ?idNode .
      ?idNode ?idPred ?idObj .
    } WHERE {
      ?org a org:Organization .
      {
        ?org dct:identifier "${orgSlug}" .
      }
      UNION
      {
        ?org adms:identifier ?identifierNodeMatch .
        ?identifierNodeMatch skos:notation "${orgSlug}" .
      }
      ?org ?p ?o .
      OPTIONAL {
        ?org schema:contactPoint ?cp .
        ?cp ?cpPred ?cpObj .
      }
      OPTIONAL {
        ?org adms:identifier ?idNode .
        ?idNode ?idPred ?idObj .
      }
    }
  `

  const quadStream = await queryEngine.queryQuads(query, {
    sources: [sourceUrl],
    noCache: true,
  })

  const quads = await quadStream.toArray()
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

/**
 * Queries a specific license by slug from the source and serializes
 * the result in the requested content type.
 */
export const serializeLicense = async (
  licenseSlug: string,
  sourceUrl: string,
  contentType: string,
): Promise<string> => {
  const query = `
    PREFIX dct: <http://purl.org/dc/terms/>
    PREFIX cc: <https://creativecommons.org/ns#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX owl: <http://www.w3.org/2002/07/owl#>

    CONSTRUCT {
      ?license ?p ?o .
    } WHERE {
      ?license a dct:LicenseDocument .
      FILTER(CONTAINS(STR(?license), "${licenseSlug}"))
      ?license ?p ?o .
    }
  `

  const quadStream = await queryEngine.queryQuads(query, {
    sources: [sourceUrl],
    noCache: true,
  })

  const quads = await quadStream.toArray()
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
 * Queries a specific license by slug from the source and serializes
 * the result in the requested content type.
 */

export const serializeKboData = async (
  kboSlug: string,
  sourceUrl: string,
  contentType: string,
): Promise<string> => {
  const query = `
    PREFIX dct: <http://purl.org/dc/terms/>
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    PREFIX org: <http://www.w3.org/ns/org#>
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    PREFIX adms: <http://www.w3.org/ns/adms#>
    PREFIX schema: <http://schema.org/>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX vcard: <http://www.w3.org/2006/vcard/ns#>

    CONSTRUCT {
      ?organization ?p ?o .
      ?organization schema:contactPoint ?cp .
      ?cp ?cpPred ?cpObj .
      ?cp vcard:hasAddress ?addr .
      ?addr ?addrPred ?addrObj .
      ?organization adms:identifier ?idNode .
      ?idNode ?idPred ?idObj .
    } WHERE {
      ?organization a org:Organization .
      {
        ?organization dct:identifier "${kboSlug}" .
      }
      UNION
      {
        ?organization adms:identifier ?identifierNodeMatch .
        ?identifierNodeMatch skos:notation "${kboSlug}" .
      }
      ?organization ?p ?o .
      OPTIONAL {
        ?organization schema:contactPoint ?cp .
        ?cp ?cpPred ?cpObj .
        OPTIONAL {
          ?cp vcard:hasAddress ?addr .
          ?addr ?addrPred ?addrObj .
        }
      }
      OPTIONAL {
        ?organization adms:identifier ?idNode .
        ?idNode ?idPred ?idObj .
      }
    }
  `

  const quadStream = await queryEngine.queryQuads(query, {
    sources: [sourceUrl],
    noCache: true,
  })

  const quads = await quadStream.toArray()
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
