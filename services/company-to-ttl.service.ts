import type {
  Company,
  Activity,
  Contact,
  Address,
  Name,
} from '../types/company'
import { QuadStore, ns } from '@oslo-flanders/core'
import { DataFactory } from 'rdf-data-factory'
import { ns2 } from './namespaces'
import type * as RDF from '@rdfjs/types'
import rdfSerializer from 'rdf-serialize'
import streamifyArray from 'streamify-array'
import { text } from 'stream/consumers'
import { mapLanguage, quadSort } from '../utils/company.utils'

export class CompanyToTTLService {
  private readonly baseUri = 'https://data.vlaanderen.be'
  private store: QuadStore
  private df: DataFactory

  public constructor() {
    this.store = new QuadStore()
    this.df = new DataFactory()
  }

  public convertCodes(codes: any): void {
    this.createCodes(codes)
  }

  /**
   * Convert company data to RDF format
   */
  public convertToRDF(company: Company): void {
    this.createCompany(company)
    this.createEstablishment(company)
    this.createBranch(company)
  }

  /**
   * Output RDF as Turtle
   */
  public async exportRDFAsTurtle(identifier: string): Promise<string> {
    let quads: RDF.Quad[] = []
    this.discoverCompany(
      this.df.namedNode(`${this.baseUri}/id/onderneming/${identifier}`),
      quads,
      this.store,
    )
    quads = quads.sort(quadSort)
    const quadStream = streamifyArray(quads)
    const outputStream = rdfSerializer.serialize(quadStream, {
      contentType: 'text/turtle',
    })
    return text(outputStream)
  }

  private addRegistration(
    parentNode: RDF.NamedNode,
    blankNodeId: string,
    identifier: string,
    startDate: string,
  ): void {
    const registration = this.df.blankNode(blankNodeId)

    this.store.addQuads([
      this.df.quad(parentNode, ns2.reorg('registration'), registration),
      this.df.quad(registration, ns.rdf('type'), ns.adms('Identifier')),
      this.df.quad(
        registration,
        ns.skos('notation'),
        this.df.literal(identifier),
      ),
      this.df.quad(
        registration,
        ns.dcterms('creator'),
        this.df.namedNode(`${this.baseUri}/id/organisatie/OVO027341`),
      ),
      this.df.quad(
        registration,
        ns.adms('schemaAgency'),
        this.df.literal('Kruispuntbank van Ondernemingen (KBO)', 'nl'),
      ),
      this.df.quad(
        registration,
        ns.dcterms('issued'),
        this.df.literal(startDate, ns.xsd('date')),
      ),
    ])
  }

  private addAddress(
    parentNode: RDF.BlankNode,
    blankNodeId: string,
    address: Address,
    addressType: string,
  ): void {
    const addressNode = this.df.blankNode(blankNodeId)

    this.store.addQuads([
      this.df.quad(parentNode, ns2.locn('address'), addressNode),
      this.df.quad(addressNode, ns.rdf('type'), ns2.locn('Address')),
      this.df.quad(
        parentNode,
        ns.dcterms('type'),
        this.df.namedNode(
          `${this.baseUri}/id/concept/TypeOfAddress/${addressType}`,
        ),
      ),
    ])

    const literalFields: Array<{
      value: string | undefined
      predicate: RDF.NamedNode
      lang?: string
    }> = [
      {
        value: address.streetNl,
        predicate: ns2.locn('thoroughfare'),
        lang: 'nl',
      },
      {
        value: address.streetFr,
        predicate: ns2.locn('thoroughfare'),
        lang: 'fr',
      },
      { value: address.houseNumber, predicate: ns.rdfs('label') },
      { value: address.box, predicate: ns2.adres('busnummer') },
      { value: address.zipcode, predicate: ns2.locn('postCode') },
      {
        value: address.municipalityNl,
        predicate: ns2.adres('Gemeentenaam'),
        lang: 'nl',
      },
      {
        value: address.municipalityFr,
        predicate: ns2.adres('Gemeentenaam'),
        lang: 'fr',
      },
      { value: address.countryNl, predicate: ns2.adres('land'), lang: 'nl' },
      { value: address.countryFr, predicate: ns2.adres('land'), lang: 'fr' },
    ]

    for (const { value, predicate, lang } of literalFields) {
      if (value) {
        this.store.addQuad(
          this.df.quad(
            addressNode,
            predicate,
            lang ? this.df.literal(value, lang) : this.df.literal(value),
          ),
        )
      }
    }
  }

  private addContactPoint(
    parentNode: RDF.NamedNode,
    blankNodeId: string,
    contact: Contact,
    address: Address,
    entityContactType: string,
    addressType: string,
  ): void {
    if (!Object.keys(contact).length && !Object.keys(address).length) {
      return
    }

    const contactNode = this.df.blankNode(blankNodeId)

    this.store.addQuads([
      this.df.quad(parentNode, ns.schema('contactinfo'), contactNode),
      this.df.quad(contactNode, ns.rdf('type'), ns.schema('ContactPoint')),
      this.df.quad(
        contactNode,
        ns.dcterms('type'),
        this.df.namedNode(
          `${this.baseUri}/id/concept/EntityContact/${entityContactType}`,
        ),
      ),
    ])

    const contactFields: Array<{
      value: string | undefined
      predicate: RDF.NamedNode
    }> = [
      { value: contact.email, predicate: ns.schema('email') },
      { value: contact.telephone, predicate: ns.schema('telephone') },
      { value: contact.fax, predicate: ns.schema('faxNumber') },
      { value: contact.homepage, predicate: ns.foaf('homepage') },
    ]

    for (const { value, predicate } of contactFields) {
      if (value) {
        this.store.addQuad(
          this.df.quad(contactNode, predicate, this.df.literal(value)),
        )
      }
    }

    if (Object.keys(address).length) {
      this.addAddress(
        contactNode,
        `address_${blankNodeId}`,
        address,
        addressType,
      )
    }
  }

  private addCompanyActivities(
    subjectUri: RDF.NamedNode,
    activities: Activity[],
  ): void {
    for (const activity of activities) {
      this.store.addQuads([
        this.df.quad(
          subjectUri,
          ns2.reorg('orgActivity'),
          this.df.namedNode(
            `${this.baseUri}/id/concept/ActivitityGroup/${activity.group}`,
          ),
        ),
        this.df.quad(
          subjectUri,
          ns2.org('classification'),
          this.df.namedNode(
            `${this.baseUri}/id/concept/Classification/${activity.classification}`,
          ),
        ),
      ])

      this.addNaceActivity(subjectUri, activity)
    }
  }

  private addNaceActivity(subjectUri: RDF.NamedNode, activity: Activity): void {
    const descriptionNl = activity.naceDescriptionNl
    const descriptionFr = activity.naceDescriptionFr

    switch (activity.naceVersion) {
      case '2003': {
        const naceNode = this.df.blankNode(
          `nace_${activity.naceVersion}_${activity.naceCode}`,
        )
        this.store.addQuads([
          this.df.quad(subjectUri, ns2.reorg('orgActivity'), naceNode),
          this.df.quad(naceNode, ns.rdf('type'), ns.skos('Concept')),
          this.df.quad(
            naceNode,
            ns.skos('definition'),
            this.df.literal(descriptionNl, 'nl'),
          ),
          this.df.quad(
            naceNode,
            ns.skos('definition'),
            this.df.literal(descriptionFr, 'fr'),
          ),
          this.df.quad(
            naceNode,
            ns.skos('prefLabel'),
            this.df.literal(activity.naceCode),
          ),
        ])
        break
      }

      case '2008':
        this.addNaceRevision(
          subjectUri,
          activity,
          descriptionNl,
          descriptionFr,
          {
            baseUri: 'http://vocab.belgif.be/auth/nace2008',
            europaUri: 'http://data.europa.eu/ux2/nace2',
          },
        )
        break

      case '2025':
        this.addNaceRevision(
          subjectUri,
          activity,
          descriptionNl,
          descriptionFr,
          {
            baseUri: 'http://vocab.belgif.be/auth/nace2025',
            europaUri: 'http://data.europa.eu/ux2/nace2.1',
          },
        )
        break
    }
  }

  private addNaceRevision(
    subjectUri: RDF.NamedNode,
    activity: Activity,
    descriptionNl: string,
    descriptionFr: string,
    uris: { baseUri: string; europaUri: string },
  ): void {
    const naceUri = this.df.namedNode(`${uris.baseUri}/${activity.naceCode}`)
    const broaderCode = activity.naceCode.slice(0, -1)

    this.store.addQuads([
      this.df.quad(subjectUri, ns2.reorg('orgActivity'), naceUri),
      this.df.quad(naceUri, ns.rdf('type'), ns.skos('Concept')),
      this.df.quad(
        naceUri,
        ns.skos('broader'),
        this.df.namedNode(`${uris.europaUri}/${broaderCode}`),
      ),
      this.df.quad(
        naceUri,
        ns.skos('broader'),
        this.df.namedNode(`${uris.baseUri}/${broaderCode}`),
      ),
      this.df.quad(
        naceUri,
        ns.skos('definition'),
        this.df.literal(descriptionNl, 'nl'),
      ),
      this.df.quad(
        naceUri,
        ns.skos('definition'),
        this.df.literal(descriptionFr, 'fr'),
      ),
      this.df.quad(
        naceUri,
        ns.skos('prefLabel'),
        this.df.literal(activity.naceCode),
      ),
    ])
  }

  // ── Entity builders ──────────────────────────────────────────────────

  private createCodes(codes: any): void {
    for (const category in codes) {
      const schemeNode = this.df.namedNode(
        `${this.baseUri}/id/conceptscheme/${category}`,
      )

      for (const entity of codes[category]) {
        const language = mapLanguage(entity.language)
        const categoryNode = this.df.namedNode(
          `${this.baseUri}/id/concept/${category}/${entity.code}`,
        )

        this.store.addQuads([
          this.df.quad(categoryNode, ns.rdf('type'), ns.skos('Concept')),
          this.df.quad(
            categoryNode,
            ns.skos('prefLabel'),
            this.df.literal(entity.code),
          ),
          this.df.quad(
            categoryNode,
            ns.skos('definition'),
            this.df.literal(entity.description, language),
          ),
          this.df.quad(categoryNode, ns.skos('inscheme'), schemeNode),
          this.df.quad(categoryNode, ns.skos('topConceptOf'), schemeNode),
        ])
      }
    }
  }

  private createCompany(company: Company): void {
    const companyUri = this.df.namedNode(
      `${this.baseUri}/id/onderneming/${company.identifier}`,
    )

    this.store.addQuads([
      this.df.quad(
        companyUri,
        ns.rdf('type'),
        ns2.reorg('RegisteredOrganization'),
      ),
      this.df.quad(
        companyUri,
        ns2.organisatie('rechtspersoonlijkheid'),
        this.df.namedNode(
          `${this.baseUri}/id/concept/TypeOfEnterprise/${company.juridicalEntity}`,
        ),
      ),
      this.df.quad(
        companyUri,
        ns2.organisatie('rechtstoestand'),
        this.df.namedNode(
          `${this.baseUri}/id/concept/JuridicalSituation/${company.juridicalState}`,
        ),
      ),
      this.df.quad(
        companyUri,
        ns2.organisatie('rechtsvorm'),
        this.df.namedNode(
          `${this.baseUri}/id/concept/JuridicalForm/${company.juridicalForm}`,
        ),
      ),
      this.df.quad(
        companyUri,
        ns.dcterms('created'),
        this.df.literal(company.startDate, ns.xsd('date')),
      ),
    ])

    this.addRegistration(
      companyUri,
      `registration_company_${company.identifier}`,
      company.identifier,
      company.startDate,
    )

    this.addCompanyActivities(companyUri, company.activity)

    this.addContactPoint(
      companyUri,
      `contact_${company.identifier}`,
      company.mainContact,
      company.mainAddress,
      'ENT',
      'REGO',
    )

    this.addNames(companyUri, company.name)
  }

  private addNames(subjectUri: RDF.NamedNode, names: Name[]): void {
    for (const name of names) {
      const language = mapLanguage(name.language)
      this.store.addQuad(
        this.df.quad(
          subjectUri,
          ns2.reorg('legalName'),
          this.df.literal(name.name, language),
        ),
      )
    }
  }

  private createEstablishment(company: Company): void {
    const companyUri = this.df.namedNode(
      `${this.baseUri}/id/onderneming/${company.identifier}`,
    )

    for (const establishment of company.establishment) {
      const establishmentUri = this.df.namedNode(
        `${this.baseUri}/id/vestiging/${establishment.identifier}`,
      )

      this.store.addQuads([
        this.df.quad(
          companyUri,
          ns2.org('hasRegisteredSite'),
          establishmentUri,
        ),
        this.df.quad(establishmentUri, ns.rdf('type'), ns2.org('Site')),
        this.df.quad(
          establishmentUri,
          ns.dcterms('created'),
          this.df.literal(establishment.startDate, ns.xsd('date')),
        ),
      ])

      this.addRegistration(
        establishmentUri,
        `registration_establishment_${establishment.identifier}`,
        establishment.identifier,
        company.startDate,
      )

      this.addEstablishmentActivities(establishmentUri, establishment.activity)

      this.addContactPoint(
        establishmentUri,
        `contact_${establishment.identifier}`,
        establishment.contact,
        establishment.address,
        'EST',
        'BAET',
      )

      this.addEstablishmentNames(establishmentUri, establishment.name)
    }
  }

  private addEstablishmentActivities(
    subjectUri: RDF.NamedNode,
    activities: Activity[],
  ): void {
    for (const activity of activities) {
      this.store.addQuads([
        this.df.quad(
          subjectUri,
          ns2.reorg('orgActivity'),
          this.df.namedNode(
            `${this.baseUri}/id/concept/ActiviteitGroep/${activity.group}`,
          ),
        ),
        this.df.quad(
          subjectUri,
          ns2.reorg('orgActivity'),
          this.df.namedNode(
            `${this.baseUri}/id/concept/NACE/${activity.naceVersion}/${activity.naceCode}`,
          ),
        ),
        this.df.quad(
          subjectUri,
          ns2.org('classification'),
          this.df.namedNode(
            `${this.baseUri}/id/concept/Classificatie/${activity.classification}`,
          ),
        ),
      ])
    }
  }

  private addEstablishmentNames(
    subjectUri: RDF.NamedNode,
    names: Name[],
  ): void {
    for (const name of names) {
      const language =
        name.language === '1' ? 'fr' : name.language === '2' ? 'nl' : undefined

      switch (name.type) {
        case '001':
        case '002':
        case '003':
        case '004':
          this.store.addQuad(
            this.df.quad(
              subjectUri,
              ns2.reorg('legalName'),
              this.df.literal(name.name, language),
            ),
          )
          break
        default:
          continue
      }
    }
  }

  private createBranch(company: Company): void {
    const companyUri = this.df.namedNode(
      `${this.baseUri}/id/onderneming/${company.identifier}`,
    )

    for (const branch of company.branch) {
      const branchUri = this.df.namedNode(
        `${this.baseUri}/id/bijkantoor/${branch.identifier}`,
      )

      this.store.addQuads([
        this.df.quad(companyUri, ns2.org('hasRegisteredSite'), branchUri),
        this.df.quad(branchUri, ns.rdf('type'), ns2.org('Site')),
        this.df.quad(
          branchUri,
          ns.dcterms('created'),
          this.df.literal(branch.startDate, ns.xsd('date')),
        ),
      ])

      this.addRegistration(
        branchUri,
        `registration_branch_${branch.identifier}`,
        branch.identifier,
        company.startDate,
      )

      if (Object.keys(branch.address).length) {
        const contactNode = this.df.blankNode(`contact_${branch.identifier}`)

        this.store.addQuads([
          this.df.quad(branchUri, ns.schema('contactinfo'), contactNode),
          this.df.quad(contactNode, ns.rdf('type'), ns.schema('ContactPoint')),
          this.df.quad(
            contactNode,
            ns.dcterms('type'),
            this.df.namedNode(`${this.baseUri}/id/concept/EntityContact/BRA`),
          ),
        ])

        this.addAddress(
          contactNode,
          `address_${branch.identifier}`,
          branch.address,
          'ABBR',
        )
      }
    }
  }

  // ── Graph traversal ──────────────────────────────────────────────────

  private discoverCompany(
    nodeId: RDF.NamedNode | RDF.BlankNode,
    quads: RDF.Quad[],
    store: QuadStore,
  ): void {
    for (const q of store.findQuads(nodeId, null, null)) {
      quads.push(q)
      if (
        (q.object.termType === 'NamedNode' ||
          q.object.termType === 'BlankNode') &&
        store.findObject(q.object, ns.rdf('type'))?.value !==
          ns2.reorg('RegisteredOrganization').value
      ) {
        this.discoverCompany(q.object, quads, store)
      }
    }
  }
}
