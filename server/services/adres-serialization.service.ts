import { DataFactory } from 'rdf-data-factory'
import type * as RDF from '@rdfjs/types'
import type { AdresData } from '~/types/adres'

const df = new DataFactory()

// --- Namespace helpers ---
const ns = (base: string) => (local: string) => df.namedNode(`${base}${local}`)

const rdf = ns('http://www.w3.org/1999/02/22-rdf-syntax-ns#')
const rdfs = ns('http://www.w3.org/2000/01/rdf-schema#')
const skos = ns('http://www.w3.org/2004/02/skos/core#')
const adms = ns('http://www.w3.org/ns/adms#')
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
 * Converts an AdresData object into an array of RDF quads following the OSLO adres vocabulary.
 * Since the basisregisters API already returns JSON-LD that parses into these exact triples,
 * this conversion mirrors that representation for content negotiation on the subject page.
 */
export const adresDataToQuads = (data: AdresData): RDF.Quad[] => {
  const quads: RDF.Quad[] = []
  const subject = df.namedNode(data.uri)

  // --- rdf:type ---
  quads.push(df.quad(subject, rdf('type'), adres('Adres')))

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

  // --- Gemeentenaam ---
  if (data.gemeentenaam) {
    const gemeenteNode = df.blankNode('gemeentenaam')
    quads.push(df.quad(subject, adres('heeftGemeentenaam'), gemeenteNode))
    quads.push(df.quad(gemeenteNode, rdf('type'), adres('Gemeentenaam')))
    if (data.gemeentenaam.label) {
      addLiteral(quads, gemeenteNode, rdfs('label'), data.gemeentenaam.label, 'nl')
    }
    addNamedNode(
      quads,
      gemeenteNode,
      adres('isAfgeleidVan'),
      data.gemeentenaam.uri,
    )
  }

  // --- Postinfo ---
  if (data.postinfo?.uri) {
    addNamedNode(quads, subject, adres('heeftPostinfo'), data.postinfo.uri)
  }

  // --- Straatnaam ---
  if (data.straatnaam) {
    const straatNode = data.straatnaam.uri
      ? df.namedNode(data.straatnaam.uri)
      : df.blankNode('straatnaam')
    quads.push(df.quad(subject, adres('heeftStraatnaam'), straatNode))
    if (data.straatnaam.uri) {
      quads.push(df.quad(straatNode, rdf('type'), adres('Straatnaam')))
      addLiteral(quads, straatNode, rdfs('label'), data.straatnaam.label, 'nl')
      addLiteral(
        quads,
        straatNode,
        rdfs('seeAlso'),
        data.straatnaam.detail,
        xsd('anyURI'),
      )
    }
  }

  // --- Huisnummer ---
  addLiteral(quads, subject, adres('huisnummer'), data.huisnummer)

  // --- Volledig adres (isVerrijktMet -> Adresuitbreiding) ---
  if (data.volledigAdres) {
    const uitbreidingNode = df.blankNode('adresuitbreiding')
    quads.push(df.quad(subject, adres('isVerrijktMet'), uitbreidingNode))
    quads.push(df.quad(uitbreidingNode, rdf('type'), adres('Adresuitbreiding')))
    addLiteral(
      quads,
      uitbreidingNode,
      adres('volledigAdres'),
      data.volledigAdres,
      'nl',
    )
  }

  // --- Positie ---
  if (data.positie) {
    const positieNode = df.blankNode('positie')
    quads.push(df.quad(subject, adres('positie'), positieNode))
    quads.push(df.quad(positieNode, rdf('type'), generiek('GeografischePositie')))
    if (data.positie.methode) {
      addNamedNode(
        quads,
        positieNode,
        generiek('methode'),
        data.positie.methode.uri,
      )
    }
    if (data.positie.specificatie) {
      addNamedNode(
        quads,
        positieNode,
        generiek('specificatie'),
        data.positie.specificatie.uri,
      )
    }
  }

  // --- Status ---
  addNamedNode(quads, subject, adres('Adres.status'), data.status?.uri)

  // --- Officieel toegekend ---
  if (data.officieelToegekend !== undefined) {
    quads.push(
      df.quad(
        subject,
        adres('officieelToegekend'),
        df.literal(data.officieelToegekend, xsd('boolean')),
      ),
    )
  }

  return quads
}
