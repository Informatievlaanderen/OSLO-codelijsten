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
const prov = ns('http://www.w3.org/ns/prov#')
const time = ns('http://www.w3.org/2006/time#')
const schema = ns('https://schema.org/')
const locn = ns('http://www.w3.org/ns/locn#')
const adres = ns('https://data.vlaanderen.be/ns/adres#')
const organisatie = ns('https://data.vlaanderen.be/ns/organisatie#')
const xsd = ns('http://www.w3.org/2001/XMLSchema#')
const geosparql = ns('http://www.opengis.net/ont/geosparql#')
const opengis = ns('http://www.opengis.net/ont/geosparql#')
const m8g = ns('http://data.europa.eu/m8g/')
const onderneming = ns(
  'https://implementatie.data.vlaanderen.be/ns/vkbo/onderneming#',
)
const finreport = ns('https://data.vlaanderen.be/ns/financiele-rapportering#')
const vcard = ns('http://www.w3.org/2006/vcard/ns#')

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
  datatype?: RDF.NamedNode | string,
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
  addLiteral(quads, subject, reorg('legalName'), data.wettelijkeNaam, 'nl')
  addLiteral(quads, subject, skos('prefLabel'), data.voorkeursnaam, 'nl')
  if (data.alternatieveNaam) {
    for (const alt of data.alternatieveNaam) {
      addLiteral(quads, subject, skos('altLabel'), alt, 'nl')
    }
  }

  // --- Registration / Identificator ---
  const regNode = df.blankNode(`reg-${data.id}`)
  quads.push(df.quad(subject, reorg('registration'), regNode))
  quads.push(df.quad(regNode, rdf('type'), adms('Identifier')))
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
  quads.push(
    df.quad(
      df.namedNode(data.identificator.toegekendDoor),
      rdf('type'),
      dcterms('Agent'),
    ),
  )

  // --- Organisatie-specific fields ---
  if ('organisatieType' in data) {
    addNamedNode(quads, subject, reorg('orgType'), data.organisatieType?.uri)
  }
  addNamedNode(quads, subject, organisatie('rechtsvorm'), data.rechtsvorm?.uri)
  addNamedNode(
    quads,
    subject,
    organisatie('rechtstoestand'),
    data.rechtstoestand?.uri,
  )

  // --- Personeelsklasse organisatie ---
  if ('personeelsklasse' in data) {
    addNamedNode(quads, subject, dcterms('extent'), data.personeelsklasse?.uri)
  }

  // --- Jaarrekening organisatie ---
  if ('rapportReferentie' in data && 'rapportType' in data) {
    const rapportNode = data.rapportReferentie
      ? df.namedNode(data.rapportReferentie)
      : df.blankNode('jaarrekening')
    quads.push(df.quad(subject, dcterms('isReferencedBy'), rapportNode))
    addNamedNode(quads, rapportNode, dcterms('type'), data.rapportType?.uri)
    quads.push(
      df.quad(rapportNode, finreport('FinancieelRapport.gaatOver'), subject),
    )
    quads.push(
      df.quad(rapportNode, rdf('type'), finreport('FinancieelRapport'))
    )
  }

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

  // --- Doorhaling Onderneming & Adres ---
  if (data.doorhaling?.length) {
    for (const doorhaling of data.doorhaling) {
      const doorhalingNode = df.blankNode(doorhaling.id)
      quads.push(df.quad(subject, prov('wasInvalidatedBy'), doorhalingNode))
      quads.push(
        df.quad(doorhalingNode, rdf('type'), onderneming('Doorhaling')),
      )
      addLiteral(
        quads,
        doorhalingNode,
        dcterms('date'),
        doorhaling.wijzingsdatum,
        xsd('date'),
      )
      addNamedNode(
        quads,
        doorhalingNode,
        dcterms('provenance'),
        doorhaling.reden.uri,
      )
      addNamedNode(quads, doorhalingNode, dcterms('type'), doorhaling.type.uri)

      if (doorhaling.tijd) {
        const periodeNode = df.blankNode(`periode-${doorhaling.id}`)
        quads.push(df.quad(doorhalingNode, prov('time'), periodeNode))
        quads.push(df.quad(periodeNode, rdf('type'), time('ProperInterval')))
        quads.push(df.quad(periodeNode, rdf('type'), time('TemporalEntity')))
        if (doorhaling.tijd.van) {
          const vanNode = df.blankNode(`periode-van-${doorhaling.id}`)
          quads.push(df.quad(periodeNode, time('hasBeginning'), vanNode))
          quads.push(df.quad(vanNode, rdf('type'), time('Instant')))
          quads.push(df.quad(vanNode, rdf('type'), time('TemporalEntity')))
          addLiteral(
            quads,
            vanNode,
            time('inXSDDate'),
            doorhaling.tijd.van,
            xsd('date'),
          )
        }
        if (doorhaling.tijd.tot) {
          const totNode = df.blankNode(`periode-tot-${doorhaling.id}`)
          quads.push(df.quad(periodeNode, time('hasEnd'), totNode))
          quads.push(df.quad(totNode, rdf('type'), time('Instant')))
          quads.push(df.quad(totNode, rdf('type'), time('TemporalEntity')))
          addLiteral(
            quads,
            totNode,
            time('inXSDDate'),
            doorhaling.tijd.tot,
            xsd('date'),
          )
        }
      }
    }
  }

  // --- Activity (NACE) ---
  if (data.activiteit) {
    const activityNode = df.namedNode(data.activiteit.uri)
    addNamedNode(quads, subject, reorg('orgActivity'), data.activiteit.uri)
    quads.push(df.quad(activityNode, rdf('type'), skos('Concept')))
    if (data.activiteit.label) {
      addLiteral(quads, activityNode, skos('prefLabel'), data.activiteit.label)
    }
  }

  // --- Contact points ---
  if (data.contactPoints) {
    for (const cp of data.contactPoints) {
      const cpNode = df.blankNode(`cp-${cp.id}`)
      quads.push(df.quad(subject, m8g('contactPoint'), cpNode))
      quads.push(df.quad(cpNode, rdf('type'), vcard('Kind')))
      addLiteral(quads, cpNode, vcard('hasEmail'), cp.email)
      addLiteral(
        quads,
        cpNode,
        vcard('hasTelephone'),
        cp.telephone,
        vcard('Voice'),
      )

      if (cp.address) {
        const addrNode = df.blankNode(`addr-${cp.id}`)
        quads.push(df.quad(addrNode, rdf('type'), locn('Address')))
        quads.push(df.quad(cpNode, vcard('hasAddress'), addrNode))
        addLiteral(
          quads,
          addrNode,
          locn('thoroughfare'),
          cp.address.thoroughfare,
          'nl',
        )
        addLiteral(quads, addrNode, locn('postCode'), cp.address.postCode)
        addLiteral(
          quads,
          addrNode,
          adres('gemeentenaam'),
          cp.address.municipality,
          'nl',
        )
        addLiteral(quads, addrNode, adres('land'), cp.address.country, 'nl')
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
