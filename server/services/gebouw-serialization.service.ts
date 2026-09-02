import { DataFactory } from 'rdf-data-factory'
import type * as RDF from '@rdfjs/types'
import type { GebouwData } from '~/types/gebouw'

const df = new DataFactory()

// --- Namespace helpers ---
const ns = (base: string) => (local: string) => df.namedNode(`${base}${local}`)

const rdf = ns('http://www.w3.org/1999/02/22-rdf-syntax-ns#')
const rdfs = ns('http://www.w3.org/2000/01/rdf-schema#')
const adms = ns('http://www.w3.org/ns/adms#')
const xsd = ns('http://www.w3.org/2001/XMLSchema#')
const gebouw = ns('https://data.vlaanderen.be/ns/gebouw#')
const generiek = ns('https://data.vlaanderen.be/ns/generiek#')

const addLiteral = (
  quads: RDF.Quad[],
  subject: RDF.NamedNode | RDF.BlankNode,
  predicate: RDF.NamedNode,
  value: string | undefined,
  datatype?: RDF.NamedNode | string,
): void => {
  if (value === undefined || value === null || value === '') return
  quads.push(
    df.quad(
      subject,
      predicate,
      datatype ? df.literal(value, datatype) : df.literal(value),
    ),
  )
}

const addNamedNode = (
  quads: RDF.Quad[],
  subject: RDF.NamedNode | RDF.BlankNode,
  predicate: RDF.NamedNode,
  uri: string | undefined,
): void => {
  if (!uri) return
  quads.push(df.quad(subject, predicate, df.namedNode(uri)))
}

/**
 * Converts a GebouwData object into an array of RDF quads following the OSLO gebouw vocabulary.
 */
export const gebouwDataToQuads = (data: GebouwData): RDF.Quad[] => {
  const quads: RDF.Quad[] = []
  const subject = df.namedNode(data.uri)

  // --- rdf:type ---
  quads.push(df.quad(subject, rdf('type'), gebouw('Gebouw')))

  // --- Identificator (gestructureerdeIdentificator via adms:identifier) ---
  const identNode = df.blankNode('identificator')
  const gestructNode = df.blankNode('gestructureerdeIdentificator')
  quads.push(df.quad(subject, adms('identifier'), identNode))
  quads.push(df.quad(identNode, rdf('type'), adms('Identifier')))
  quads.push(
    df.quad(identNode, generiek('gestructureerdeIdentificator'), gestructNode),
  )
  quads.push(
    df.quad(gestructNode, rdf('type'), generiek('GestructureerdeIdentificator')),
  )
  addLiteral(
    quads,
    gestructNode,
    generiek('lokaleIdentificator'),
    data.identificator.lokaleIdentificator,
  )

  // --- Geometrie (2DGebouwgeometrie) ---
  if (data.geometrie) {
    const geometrieNode = df.blankNode('geometrie')
    quads.push(df.quad(subject, gebouw('2DGebouwgeometrie'), geometrieNode))
    quads.push(df.quad(geometrieNode, rdf('type'), gebouw('2DGebouwgeometrie')))
    if (data.geometrie.methode) {
      addNamedNode(
        quads,
        geometrieNode,
        generiek('methode'),
        data.geometrie.methode.uri,
      )
    }
    if (data.geometrie.specificatie) {
      addNamedNode(
        quads,
        geometrieNode,
        generiek('specificatie'),
        data.geometrie.specificatie.uri,
      )
    }
    if (data.geometrie.gml) {
      addLiteral(quads, geometrieNode, generiek('gml'), data.geometrie.gml)
    }
  }

  // --- Status ---
  addNamedNode(quads, subject, gebouw('Gebouw.status'), data.status?.uri)

  // --- bestaatUit (Gebouweenheid) ---
  if (data.bestaatUit) {
    for (const ref of data.bestaatUit) {
      addNamedNode(quads, subject, gebouw('bestaatUit'), ref.uri)
    }
  }

  // --- ligtOp (RuimtelijkeEenheid) ---
  if (data.ligtOp) {
    for (const ref of data.ligtOp) {
      addNamedNode(quads, subject, gebouw('ligtOp'), ref.uri)
    }
  }

  return quads
}
