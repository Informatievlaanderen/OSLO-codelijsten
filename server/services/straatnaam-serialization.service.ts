import { DataFactory } from 'rdf-data-factory'
import type * as RDF from '@rdfjs/types'
import type { StraatnaamData } from '~/types/straatnaam'

const df = new DataFactory()

const ns = (base: string) => (local: string) => df.namedNode(`${base}${local}`)

const rdf = ns('http://www.w3.org/1999/02/22-rdf-syntax-ns#')
const rdfs = ns('http://www.w3.org/2000/01/rdf-schema#')
const dcterms = ns('http://purl.org/dc/terms/')
const adms = ns('http://www.w3.org/ns/adms#')
const prov = ns('http://www.w3.org/ns/prov#')
const xsd = ns('http://www.w3.org/2001/XMLSchema#')
const adres = ns('https://data.vlaanderen.be/ns/adres#')
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
 * Converts a StraatnaamData object into an array of RDF quads following the OSLO adres vocabulary.
 */
export const straatnaamDataToQuads = (data: StraatnaamData): RDF.Quad[] => {
  const quads: RDF.Quad[] = []
  const subject = df.namedNode(data.uri)

  // --- rdf:type ---
  quads.push(df.quad(subject, rdf('type'), adres('Straatnaam')))

  // --- Identificator ---
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

  // --- Straatnaam (name) ---
  addLiteral(quads, subject, rdfs('label'), data.straatnaam, 'nl')

  // --- Homoniem toevoeging ---
  if (data.homoniemToevoeging?.length) {
    for (const homoniem of data.homoniemToevoeging) {
      addLiteral(quads, subject, adres('homoniemToevoeging'), homoniem)
    }
  }

  // --- Status ---
  addNamedNode(quads, subject, adres('Straatnaam.status'), data.status?.uri)

  // --- Is toegekend door (Gemeente) ---
  if (data.isToegekendDoor?.uri) {
    const gemeenteNode = df.namedNode(data.isToegekendDoor.uri)
    quads.push(df.quad(subject, prov('wasAttributedTo'), gemeenteNode))
    quads.push(df.quad(gemeenteNode, rdf('type'), generiek('Gemeente')))
    addLiteral(
      quads,
      gemeenteNode,
      rdfs('seeAlso'),
      data.isToegekendDoor.detail,
      xsd('anyURI'),
    )
    if (data.isToegekendDoor.label) {
      const gemeentenaamNode = df.blankNode('gemeentenaam')
      quads.push(df.quad(gemeenteNode, dcterms('title'), gemeentenaamNode))
      quads.push(df.quad(gemeentenaamNode, rdf('type'), adres('Gemeentenaam')))
      addLiteral(
        quads,
        gemeentenaamNode,
        rdfs('label'),
        data.isToegekendDoor.label,
        'nl',
      )
    }
  }

  return quads
}
