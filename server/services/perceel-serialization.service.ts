import { DataFactory } from 'rdf-data-factory'
import type * as RDF from '@rdfjs/types'
import type { PerceelData } from '~/types/perceel'

const df = new DataFactory()

// --- Namespace helpers ---
const ns = (base: string) => (local: string) => df.namedNode(`${base}${local}`)

const rdf = ns('http://www.w3.org/1999/02/22-rdf-syntax-ns#')
const adms = ns('http://www.w3.org/ns/adms#')
const perceel = ns('https://data.vlaanderen.be/ns/perceel#')
const adres = ns('https://data.vlaanderen.be/ns/adres#')
const generiek = ns('https://data.vlaanderen.be/ns/generiek#')
const implPerceel = ns('https://implementatie.data.vlaanderen.be/ns/perceel#')
const implGebouw = ns('https://implementatie.data.vlaanderen.be/ns/gebouw#')

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
 * Converts a PerceelData object into an array of RDF quads following the OSLO perceel vocabulary.
 */
export const perceelDataToQuads = (data: PerceelData): RDF.Quad[] => {
  const quads: RDF.Quad[] = []
  const subject = df.namedNode(data.uri)

  // --- rdf:type ---
  quads.push(df.quad(subject, rdf('type'), perceel('KadastraalPlanperceel')))

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

  // --- Status ---
  addNamedNode(quads, subject, implPerceel('status'), data.status?.uri)

  // --- Adressen ---
  if (data.adressen) {
    for (const adresRef of data.adressen) {
      addNamedNode(quads, subject, implGebouw('toegekendAdres'), adresRef.uri)
    }
  }

  return quads
}
