import { DataFactory } from 'rdf-data-factory'
import type * as RDF from '@rdfjs/types'
import type { GemeenteData } from '~/types/gemeente'

const df = new DataFactory()

// --- Namespace helpers ---
const ns = (base: string) => (local: string) => df.namedNode(`${base}${local}`)

const rdf = ns('http://www.w3.org/1999/02/22-rdf-syntax-ns#')
const rdfs = ns('http://www.w3.org/2000/01/rdf-schema#')
const adms = ns('http://www.w3.org/ns/adms#')
const dct = ns('http://purl.org/dc/terms/')
const generiek = ns('https://data.vlaanderen.be/ns/generiek#')
const adres = ns('https://data.vlaanderen.be/ns/adres#')
const implAdres = ns('https://implementatie.data.vlaanderen.be/ns/adres#')

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
 * Converts a GemeenteData object into an array of RDF quads following the OSLO adres vocabulary.
 */
export const gemeenteDataToQuads = (data: GemeenteData): RDF.Quad[] => {
  const quads: RDF.Quad[] = []
  const subject = df.namedNode(data.uri)

  // --- rdf:type ---
  quads.push(df.quad(subject, rdf('type'), generiek('Gemeente')))

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
  addLiteral(
    quads,
    gestructNode,
    generiek('naamruimte'),
    data.identificator.naamruimte,
  )
  addLiteral(
    quads,
    gestructNode,
    generiek('versieIdentificator'),
    data.identificator.versieIdentificator,
  )

  // --- Naam (Gemeentenaam) ---
  if (data.naam?.gemeentenaam) {
    const naamNode = df.blankNode('naam')
    quads.push(df.quad(subject, dct('title'), naamNode))
    quads.push(df.quad(naamNode, rdf('type'), adres('Gemeentenaam')))
    addLiteral(
      quads,
      naamNode,
      rdfs('label'),
      data.naam.gemeentenaam,
      'nl',
    )
  }

  // --- Officiele talen ---
  if (data.officieleTaal) {
    for (const taal of data.officieleTaal) {
      addLiteral(quads, subject, implAdres('officieleTaal'), taal)
    }
  }

  // --- Faciliteiten talen ---
  if (data.faciliteitenTaal) {
    for (const taal of data.faciliteitenTaal) {
      addLiteral(quads, subject, implAdres('faciliteitenTaal'), taal)
    }
  }

  // --- Status ---
  addNamedNode(quads, subject, implAdres('Gemeente.status'), data.status?.uri)

  return quads
}
