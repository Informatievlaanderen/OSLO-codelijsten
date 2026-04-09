import { DataFactory } from 'rdf-data-factory'
import type * as RDF from '@rdfjs/types'
import type { KboOrganizationData, KBOBranchData } from '~/types/KBO'

const df = new DataFactory()

// --- Namespace helpers ---
const ns = (base: string) => (local: string) => df.namedNode(`${base}${local}`)

const rdf = ns('http://www.w3.org/1999/02/22-rdf-syntax-ns#')
const rdfs = ns('http://www.w3.org/2000/01/rdf-schema#')
const skos = ns('http://www.w3.org/2004/02/skos/core#')
const dcterms = ns('http://purl.org/dc/terms/')
const adms = ns('http://www.w3.org/ns/adms#')
const org = ns('http://www.w3.org/ns/org#')
const reorg = ns('http://www.w3.org/ns/regorg#')
const schema = ns('https://schema.org/')
const locn = ns('http://www.w3.org/ns/locn#')
const adres = ns('https://data.vlaanderen.be/ns/adres#')
const organisatie = ns('https://data.vlaanderen.be/ns/organisatie#')
const xsd = ns('http://www.w3.org/2001/XMLSchema#')
const geosparql = ns('http://www.opengis.net/ont/geosparql#')
const opengis = ns('http://www.opengis.net/ont/geosparql#')
const m8g = ns('http://data.europa.eu/m8g/')

const TYPE_MAP: Record<string, RDF.NamedNode> = {
  Organisatie: org('Organization'),
  GeregistreerdeOrganisatie: reorg('RegisteredOrganization'),
  FormeleOrganisatie: org('FormalOrganization'),
  Vestiging: org('Site'),
}

function addLiteral(
  quads: RDF.Quad[],
  subject: RDF.NamedNode | RDF.BlankNode,
  predicate: RDF.NamedNode,
  value: string | undefined,
  datatype?: RDF.NamedNode,
): void {
  if (!value) return
  quads.push(
    df.quad(
      subject,
      predicate,
      datatype ? df.literal(value, datatype) : df.literal(value),
    ),
  )
}

function addNamedNode(
  quads: RDF.Quad[],
  subject: RDF.NamedNode | RDF.BlankNode,
  predicate: RDF.NamedNode,
  uri: string | undefined,
): void {
  if (!uri) return
  quads.push(df.quad(subject, predicate, df.namedNode(uri)))
}

/**
 * Converts a KboOrganizationData or KBOBranchData object into an array of RDF quads
 * following the OSLO organisation / KBO vocabulary.
 */
export function kboDataToQuads(
  data: KboOrganizationData | KBOBranchData,
): RDF.Quad[] {
  const quads: RDF.Quad[] = []
  const subject = df.namedNode(data.uri)

  // --- rdf:type ---
  for (const t of data.types) {
    const mapped = TYPE_MAP[t]
    if (mapped) {
      quads.push(df.quad(subject, rdf('type'), mapped))
    }
  }

  // --- Names ---
  addLiteral(quads, subject, reorg('legalName'), data.wettelijkeNaam)
  addLiteral(quads, subject, skos('prefLabel'), data.voorkeursnaam)
  if (data.alternatieveNaam) {
    for (const alt of data.alternatieveNaam) {
      addLiteral(quads, subject, skos('altLabel'), alt)
    }
  }

  // --- Registration / Identificator ---
  const regNode = df.blankNode(`reg-${data.id}`)
  quads.push(df.quad(subject, reorg('registration'), regNode))
  addLiteral(quads, regNode, skos('notation'), data.identificator.identificator)
  addLiteral(
    quads,
    regNode,
    dcterms('issued'),
    data.identificator.toegekendOp,
    xsd('date'),
  )
  addNamedNode(
    quads,
    regNode,
    dcterms('creator'),
    data.identificator.toegekendDoor,
  )

  // --- Organisatie-specific fields ---
  addNamedNode(quads, subject, organisatie('rechtsvorm'), data.rechtsvorm?.uri)
  addNamedNode(
    quads,
    subject,
    organisatie('rechtstoestand'),
    data.rechtstoestand?.uri,
  )

  // --- Veranderinggebeurtenissen ---
  if (data.oprichting) {
    const oprichtingNode = df.blankNode(`oprichting-${data.oprichting.datum}`)
    quads.push(df.quad(subject, org('changedBy'), oprichtingNode))
    quads.push(df.quad(oprichtingNode, rdf('type'), org('ChangeEvent')))
    quads.push(df.quad(oprichtingNode, rdf('type'), m8g('FoundationEvent')))
    addLiteral(
      quads,
      oprichtingNode,
      dcterms('date'),
      data.oprichting.datum,
      xsd('date'),
    )
  }

  if (data.stopzetting) {
    const stopzettingNode = df.blankNode(
      `stopzetting-${data.oprichting?.datum}`,
    )
    quads.push(df.quad(subject, org('changedBy'), stopzettingNode))
    quads.push(df.quad(stopzettingNode, rdf('type'), org('ChangeEvent')))
    quads.push(
      df.quad(stopzettingNode, rdf('type'), organisatie('Stopzetting')),
    )
    addLiteral(
      quads,
      stopzettingNode,
      dcterms('date'),
      data.stopzetting.datum,
      xsd('date'),
    )
  }

  // --- Activity (NACE) ---
  if (data.activiteit) {
    addNamedNode(quads, subject, reorg('orgActivity'), data.activiteit.uri)
    if (data.activiteit.label) {
      addLiteral(
        quads,
        df.namedNode(data.activiteit.uri),
        skos('prefLabel'),
        data.activiteit.label,
      )
    }
  }

  // --- Contact points ---
  if (data.contactPoints) {
    for (const cp of data.contactPoints) {
      const cpNode = df.blankNode(`cp-${cp.id}`)
      quads.push(df.quad(subject, schema('contactPoint'), cpNode))
      quads.push(df.quad(cpNode, rdf('type'), schema('ContactPoint')))
      addLiteral(quads, cpNode, schema('email'), cp.email)
      addLiteral(quads, cpNode, schema('telephone'), cp.telephone)

      if (cp.address) {
        const addrNode = df.blankNode(`addr-${cp.id}`)
        quads.push(df.quad(addrNode, rdf('type'), locn('Address')))
        quads.push(df.quad(cpNode, locn('address'), addrNode))
        addLiteral(
          quads,
          addrNode,
          locn('thoroughfare'),
          cp.address.thoroughfare,
          rdf('langString'),
        )
        addLiteral(quads, addrNode, locn('postCode'), cp.address.postCode)
        addLiteral(
          quads,
          addrNode,
          adres('gemeentenaam'),
          cp.address.municipality,
          rdf('langString'),
        )
        addLiteral(
          quads,
          addrNode,
          adres('land'),
          cp.address.country,
          rdf('langString'),
        )
      }

      if (cp.place) {
        const placeNode = df.blankNode(`place-${cp.id}`)
        const geometryNode = df.blankNode(`geometry-${cp.id}`)
        quads.push(df.quad(cpNode, dcterms('spatial'), placeNode))
        quads.push(df.quad(placeNode, rdf('type'), dcterms('Location')))
        quads.push(df.quad(placeNode, locn('geometry'), geometryNode))
        quads.push(df.quad(geometryNode, rdf('type'), locn('Geometry')))
        addLiteral(
          quads,
          geometryNode,
          geosparql('asGML'),
          cp.place.geometry.gml,
          opengis('gmlLiteral'),
        )
        addLiteral(
          quads,
          geometryNode,
          geosparql('asWKT'),
          cp.place.geometry.wkt,
          opengis('wktLiteral'),
        )
      }
    }
  }

  // --- Branch-specific: parent organisation ---
  if ('parentOrganisatie' in data && data.parentOrganisatie) {
    addNamedNode(
      quads,
      subject,
      org('siteOf'),
      `https://data.vlaanderen.be/id/onderneming/${data.parentOrganisatie}`,
    )
  }

  return quads
}
