import type { Company, Contact } from '../types/company'
import { TtlHelperService } from './ttl-helper.service'
import { QuadStore, ns } from '@oslo-flanders/core'
import { DataFactory } from 'rdf-data-factory'
import { ns2 } from './namespaces'
import type * as RDF from '@rdfjs/types'
import { createWriteStream } from 'fs'
import rdfSerializer from 'rdf-serialize'
import streamifyArray from 'streamify-array'
import { text } from 'stream/consumers'

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
   * Sort function used on an array of quads. First sorts named nodes alphabetically, then blank nodes alphabetically.
   * @param quadA An RDF.Quad
   * @param quadB An RDF.Quad
   * @returns a number
   */
  private quadSort(quadA: RDF.Quad, quadB: RDF.Quad): number {
    if (quadA.subject.termType === quadB.subject.termType) {
      return quadA.subject.value.localeCompare(quadB.subject.value)
    }

    return quadA.subject.termType === 'BlankNode' ? 1 : -1
  }

  private createCodes(codes: any) {
    for (const category in codes) {
      const schemeNode = this.df.namedNode(
        `https://data.vlaanderen.be/id/conceptscheme/${category}`,
      )
      for (const entity of codes[category]) {
        const code = entity.code
        const description = entity.description
        let language = undefined
        switch (entity.language) {
          case 'FR':
            language = 'fr'
            break
          case 'NL':
            language = 'nl'
            break
          case 'DE':
            language = 'de'
            break
        }
        const categoryNode = this.df.namedNode(
          `https://data.vlaanderen.be/id/concept/${category}/${code}`,
        )
        this.store.addQuads([
          this.df.quad(categoryNode, ns.rdf('type'), ns.skos('Concept')),
          this.df.quad(
            categoryNode,
            ns.skos('prefLabel'),
            this.df.literal(code),
          ),
          this.df.quad(
            categoryNode,
            ns.skos('definition'),
            this.df.literal(description, language),
          ),
          this.df.quad(categoryNode, ns.skos('inscheme'), schemeNode),
          this.df.quad(categoryNode, ns.skos('topConceptOf'), schemeNode),
        ])
      }
    }
  }

  private createCompany(company: Company) {
    const companyUri = this.df.namedNode(
      this.baseUri + '/id/onderneming/' + company.identifier,
    )
    const registrationBlanknode = this.df.blankNode(
      `registration_company_${company.identifier}`,
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
          this.baseUri +
            '/id/concept/TypeOfEnterprise/' +
            company.juridicalEntity,
        ),
      ),
      this.df.quad(
        companyUri,
        ns2.organisatie('rechtstoestand'),
        this.df.namedNode(
          this.baseUri +
            '/id/concept/JuridicalSituation/' +
            company.juridicalState,
        ),
      ),
      this.df.quad(
        companyUri,
        ns2.organisatie('rechtsvorm'),
        this.df.namedNode(
          this.baseUri + '/id/concept/JuridicalForm/' + company.juridicalForm,
        ),
      ),
      this.df.quad(
        companyUri,
        ns2.reorg('registration'),
        registrationBlanknode,
      ),
      this.df.quad(
        companyUri,
        ns.dcterms('created'),
        this.df.literal(company.startDate, ns.xsd('date')),
      ),
    ])

    /* Identifier */
    this.store.addQuads([
      this.df.quad(
        registrationBlanknode,
        ns.rdf('type'),
        ns.adms('Identifier'),
      ),
      this.df.quad(
        registrationBlanknode,
        ns.skos('notation'),
        this.df.literal(company.identifier),
      ),
      this.df.quad(
        registrationBlanknode,
        ns.dcterms('creator'),
        this.df.namedNode(
          'https://data.vlaanderen.be/id/organisatie/OVO027341',
        ),
      ),
      this.df.quad(
        registrationBlanknode,
        ns.adms('schemaAgency'),
        this.df.literal('Kruispuntbank van Ondernemingen (KBO)', 'nl'),
      ),
      this.df.quad(
        registrationBlanknode,
        ns.dcterms('issued'),
        this.df.literal(company.startDate, ns.xsd('date')),
      ),
    ])

    /* Activities */
    for (const activity of company.activity) {
      this.store.addQuads([
        this.df.quad(
          companyUri,
          ns2.reorg('orgActivity'),
          this.df.namedNode(
            `https://data.vlaanderen.be/id/concept/ActivitityGroup/${activity.group}`,
          ),
        ),
        this.df.quad(
          companyUri,
          ns2.org('classification'),
          this.df.namedNode(
            `https://data.vlaanderen.be/id/concept/Classification/${activity.classification}`,
          ),
        ),
      ])

      const descriptionNl = activity.naceDescriptionNl
      const descriptionFr = activity.naceDescriptionFr
      switch (activity.naceVersion) {
        /* No URIs at data.europe.eu for NACE 2003 */
        case '2003':
          const naceBlanknode = this.df.blankNode(
            `nace_${activity.naceVersion}_${activity.naceCode}`,
          )
          this.store.addQuads([
            this.df.quad(companyUri, ns2.reorg('orgActivity'), naceBlanknode),
            this.df.quad(naceBlanknode, ns.rdf('type'), ns.skos('Concept')),
            this.df.quad(
              naceBlanknode,
              ns.skos('definition'),
              this.df.literal(descriptionNl, 'nl'),
            ),
            this.df.quad(
              naceBlanknode,
              ns.skos('definition'),
              this.df.literal(descriptionFr, 'fr'),
            ),
            this.df.quad(
              naceBlanknode,
              ns.skos('prefLabel'),
              this.df.literal(activity.naceCode),
            ),
          ])
          break
        /* NACE Rev 2. */
        case '2008':
          const naceUri2008 = this.df.namedNode(
            `http://vocab.belgif.be/auth/nace2008/${activity.naceCode}`,
          )
          this.store.addQuads([
            this.df.quad(companyUri, ns2.reorg('orgActivity'), naceUri2008),
            this.df.quad(naceUri2008, ns.rdf('type'), ns.skos('Concept')),
            this.df.quad(
              naceUri2008,
              ns.skos('broader'),
              this.df.namedNode(
                `http://data.europa.eu/ux2/nace2/${activity.naceCode.slice(0, -1)}`,
              ),
            ),
            this.df.quad(
              naceUri2008,
              ns.skos('broader'),
              this.df.namedNode(
                `http://vocab.belgif.be/auth/nace2008/${activity.naceCode.slice(0, -1)}`,
              ),
            ),
            this.df.quad(
              naceUri2008,
              ns.skos('definition'),
              this.df.literal(descriptionNl, 'nl'),
            ),
            this.df.quad(
              naceUri2008,
              ns.skos('definition'),
              this.df.literal(descriptionFr, 'fr'),
            ),
            this.df.quad(
              naceUri2008,
              ns.skos('prefLabel'),
              this.df.literal(activity.naceCode),
            ),
          ])
          break
        /* NACE Rev 2.1 */
        case '2025':
          const naceUri2025 = this.df.namedNode(
            `http://vocab.belgif.be/auth/nace2025/${activity.naceCode}`,
          )
          this.store.addQuads([
            this.df.quad(companyUri, ns2.reorg('orgActivity'), naceUri2025),
            this.df.quad(naceUri2025, ns.rdf('type'), ns.skos('Concept')),
            this.df.quad(
              naceUri2025,
              ns.skos('broader'),
              this.df.namedNode(
                `http://data.europa.eu/ux2/nace2.1/${activity.naceCode.slice(0, -1)}`,
              ),
            ),
            this.df.quad(
              naceUri2025,
              ns.skos('broader'),
              this.df.namedNode(
                `http://vocab.belgif.be/auth/nace2025/${activity.naceCode.slice(0, -1)}`,
              ),
            ),
            this.df.quad(
              naceUri2025,
              ns.skos('definition'),
              this.df.literal(descriptionNl, 'nl'),
            ),
            this.df.quad(
              naceUri2025,
              ns.skos('definition'),
              this.df.literal(descriptionFr, 'fr'),
            ),
            this.df.quad(
              naceUri2025,
              ns.skos('prefLabel'),
              this.df.literal(activity.naceCode),
            ),
          ])
          break
      }
    }

    /* Contact */
    if (
      Object.keys(company.mainContact).length ||
      Object.keys(company.mainAddress).length
    ) {
      const contactBlanknode = this.df.blankNode(
        `contact_${company.identifier}`,
      )
      this.store.addQuad(
        this.df.quad(companyUri, ns.schema('contactinfo'), contactBlanknode),
      )
      this.store.addQuads([
        this.df.quad(
          contactBlanknode,
          ns.rdf('type'),
          ns.schema('ContactPoint'),
        ),
        this.df.quad(
          contactBlanknode,
          ns.rdf('type'),
          this.df.namedNode(
            'https://data.vlaanderen.be/id/concept/EntityContact/ENT',
          ),
        ),
      ])

      if (company.mainContact.email) {
        this.store.addQuad(
          this.df.quad(
            contactBlanknode,
            ns.schema('email'),
            this.df.literal(company.mainContact.email),
          ),
        )
      }

      if (company.mainContact.telephone) {
        this.store.addQuad(
          this.df.quad(
            contactBlanknode,
            ns.schema('telephone'),
            this.df.literal(company.mainContact.telephone),
          ),
        )
      }

      if (company.mainContact.fax) {
        this.store.addQuad(
          this.df.quad(
            contactBlanknode,
            ns.schema('faxNumber'),
            this.df.literal(company.mainContact.fax),
          ),
        )
      }

      if (company.mainContact.homepage) {
        this.store.addQuad(
          this.df.quad(
            contactBlanknode,
            ns.foaf('homepage'),
            this.df.literal(company.mainContact.homepage),
          ),
        )
      }

      /* Address */
      const addressBlanknode = this.df.blankNode(
        `address_${company.identifier}`,
      )
      this.store.addQuad(
        this.df.quad(contactBlanknode, ns2.locn('address'), addressBlanknode),
      )
      this.store.addQuads([
        this.df.quad(addressBlanknode, ns.rdf('type'), ns2.locn('Address')),
        this.df.quad(
          contactBlanknode,
          ns.rdf('type'),
          this.df.namedNode(
            'https://data.vlaanderen.be/id/concept/TypeOfAddress/REGO',
          ),
        ),
      ])

      if (company.mainAddress.streetNl) {
        this.store.addQuad(
          this.df.quad(
            addressBlanknode,
            ns2.locn('thoroughfare'),
            this.df.literal(company.mainAddress.streetNl, 'nl'),
          ),
        )
      }

      if (company.mainAddress.streetFr) {
        this.store.addQuad(
          this.df.quad(
            addressBlanknode,
            ns2.locn('thoroughfare'),
            this.df.literal(company.mainAddress.streetFr, 'fr'),
          ),
        )
      }

      if (company.mainAddress.houseNumber) {
        this.store.addQuad(
          this.df.quad(
            addressBlanknode,
            ns.rdfs('label'),
            this.df.literal(company.mainAddress.houseNumber),
          ),
        )
      }

      if (company.mainAddress.box) {
        this.store.addQuad(
          this.df.quad(
            addressBlanknode,
            ns2.adres('busnummer'),
            this.df.literal(company.mainAddress.box),
          ),
        )
      }

      if (company.mainAddress.zipcode) {
        this.store.addQuad(
          this.df.quad(
            addressBlanknode,
            ns2.locn('postCode'),
            this.df.literal(company.mainAddress.zipcode),
          ),
        )
      }

      if (company.mainAddress.municipalityNl) {
        this.store.addQuad(
          this.df.quad(
            addressBlanknode,
            ns2.adres('Gemeentenaam'),
            this.df.literal(company.mainAddress.municipalityNl, 'nl'),
          ),
        )
      }

      if (company.mainAddress.municipalityFr) {
        this.store.addQuad(
          this.df.quad(
            addressBlanknode,
            ns2.adres('Gemeentenaam'),
            this.df.literal(company.mainAddress.municipalityFr, 'fr'),
          ),
        )
      }

      if (company.mainAddress.countryNl) {
        this.store.addQuad(
          this.df.quad(
            addressBlanknode,
            ns2.adres('land'),
            this.df.literal(company.mainAddress.countryNl, 'nl'),
          ),
        )
      }

      if (company.mainAddress.countryFr) {
        this.store.addQuad(
          this.df.quad(
            addressBlanknode,
            ns2.adres('land'),
            this.df.literal(company.mainAddress.countryFr, 'fr'),
          ),
        )
      }
    }

    /* Names */
    for (const name of company.name) {
      let language = undefined

      switch (name.language) {
        case '1':
          language = 'fr'
          break
        case '2':
          language = 'nl'
          break
        case '3':
          language = 'de'
          break
        case '4':
          language = 'en'
          break
      }

      this.store.addQuad(
        this.df.quad(
          companyUri,
          ns2.reorg('legalName'),
          this.df.literal(name.name, language),
        ),
      )
    }
  }

  private createEstablishment(company: Company) {
    for (const establishment of company.establishment) {
      const companyUri = this.df.namedNode(
        this.baseUri + '/id/onderneming/' + company.identifier,
      )
      const establishmentUri = this.df.namedNode(
        this.baseUri + '/id/vestiging/' + establishment.identifier,
      )
      const registrationBlanknode = this.df.blankNode(
        `registration_establishment_${establishment.identifier}`,
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
          ns2.reorg('registration'),
          registrationBlanknode,
        ),
        this.df.quad(
          establishmentUri,
          ns.dcterms('created'),
          this.df.literal(establishment.startDate, ns.xsd('date')),
        ),
      ])

      /* Identifier */
      this.store.addQuads([
        this.df.quad(
          registrationBlanknode,
          ns.rdf('type'),
          ns.adms('Identifier'),
        ),
        this.df.quad(
          registrationBlanknode,
          ns.skos('notation'),
          this.df.literal(establishment.identifier),
        ),
        this.df.quad(
          registrationBlanknode,
          ns.dcterms('creator'),
          this.df.namedNode(
            'https://data.vlaanderen.be/id/organisatie/OVO027341',
          ),
        ),
        this.df.quad(
          registrationBlanknode,
          ns.adms('schemaAgency'),
          this.df.literal('Kruispuntbank van Ondernemingen (KBO)', 'nl'),
        ),
        this.df.quad(
          registrationBlanknode,
          ns.dcterms('issued'),
          this.df.literal(company.startDate, ns.xsd('date')),
        ),
      ])

      /* Activities */
      for (const activity of establishment.activity) {
        this.store.addQuads([
          this.df.quad(
            establishmentUri,
            ns2.reorg('orgActivity'),
            this.df.namedNode(
              `https://data.vlaanderen.be/id/concept/ActiviteitGroep/${activity.group}`,
            ),
          ),
          this.df.quad(
            establishmentUri,
            ns2.reorg('orgActivity'),
            this.df.namedNode(
              `https://data.vlaanderen.be/id/concept/NACE/${activity.naceVersion}/${activity.naceCode}`,
            ),
          ),
          this.df.quad(
            establishmentUri,
            ns2.org('classification'),
            this.df.namedNode(
              `https://data.vlaanderen.be/id/concept/Classificatie/${activity.classification}`,
            ),
          ),
        ])
      }

      /* Contact */
      if (
        Object.keys(establishment.contact).length ||
        Object.keys(establishment.address).length
      ) {
        const contactBlanknode = this.df.blankNode(
          `contact_${establishment.identifier}`,
        )
        this.store.addQuads([
          this.df.quad(
            contactBlanknode,
            ns.rdf('type'),
            ns.schema('ContactPoint'),
          ),
          this.df.quad(
            contactBlanknode,
            ns.rdf('type'),
            this.df.namedNode(
              'https://data.vlaanderen.be/id/concept/EntityContact/EST',
            ),
          ),
        ])
        this.store.addQuad(
          this.df.quad(
            establishmentUri,
            ns.schema('contactinfo'),
            contactBlanknode,
          ),
        )

        if (establishment.contact.email) {
          this.store.addQuad(
            this.df.quad(
              contactBlanknode,
              ns.schema('email'),
              this.df.literal(establishment.contact.email),
            ),
          )
        }

        if (establishment.contact.telephone) {
          this.store.addQuad(
            this.df.quad(
              contactBlanknode,
              ns.schema('telephone'),
              this.df.literal(establishment.contact.telephone),
            ),
          )
        }

        if (establishment.contact.fax) {
          this.store.addQuad(
            this.df.quad(
              contactBlanknode,
              ns.schema('faxNumber'),
              this.df.literal(establishment.contact.fax),
            ),
          )
        }

        if (establishment.contact.homepage) {
          this.store.addQuad(
            this.df.quad(
              contactBlanknode,
              ns.foaf('homepage'),
              this.df.literal(establishment.contact.homepage),
            ),
          )
        }

        /* Address */
        const addressBlanknode = this.df.blankNode(
          `address_${establishment.identifier}`,
        )
        this.store.addQuads([
          this.df.quad(contactBlanknode, ns2.locn('address'), addressBlanknode),
          this.df.quad(addressBlanknode, ns.rdf('type'), ns2.locn('Address')),
          this.df.quad(
            contactBlanknode,
            ns.rdf('type'),
            this.df.namedNode(
              'https://data.vlaanderen.be/id/concept/TypeOfAddress/BAET',
            ),
          ),
        ])

        if (establishment.address.streetNl) {
          this.store.addQuad(
            this.df.quad(
              addressBlanknode,
              ns2.locn('thoroughfare'),
              this.df.literal(establishment.address.streetNl, 'nl'),
            ),
          )
        }

        if (establishment.address.streetFr) {
          this.store.addQuad(
            this.df.quad(
              addressBlanknode,
              ns2.locn('thoroughfare'),
              this.df.literal(establishment.address.streetFr, 'fr'),
            ),
          )
        }

        if (establishment.address.houseNumber) {
          this.store.addQuad(
            this.df.quad(
              addressBlanknode,
              ns.rdfs('label'),
              this.df.literal(establishment.address.houseNumber),
            ),
          )
        }

        if (establishment.address.box) {
          this.store.addQuad(
            this.df.quad(
              addressBlanknode,
              ns2.adres('busnummer'),
              this.df.literal(establishment.address.box),
            ),
          )
        }

        if (establishment.address.zipcode) {
          this.store.addQuad(
            this.df.quad(
              addressBlanknode,
              ns2.locn('postCode'),
              this.df.literal(establishment.address.zipcode),
            ),
          )
        }

        if (establishment.address.municipalityNl) {
          this.store.addQuad(
            this.df.quad(
              addressBlanknode,
              ns2.adres('Gemeentenaam'),
              this.df.literal(establishment.address.municipalityNl, 'nl'),
            ),
          )
        }

        if (establishment.address.municipalityFr) {
          this.store.addQuad(
            this.df.quad(
              addressBlanknode,
              ns2.adres('Gemeentenaam'),
              this.df.literal(establishment.address.municipalityFr, 'fr'),
            ),
          )
        }

        if (establishment.address.countryNl) {
          this.store.addQuad(
            this.df.quad(
              addressBlanknode,
              ns2.adres('land'),
              this.df.literal(establishment.address.countryNl, 'nl'),
            ),
          )
        }

        if (establishment.address.countryFr) {
          this.store.addQuad(
            this.df.quad(
              addressBlanknode,
              ns2.adres('land'),
              this.df.literal(establishment.address.countryFr, 'fr'),
            ),
          )
        }
      }

      /* Names */
      for (const name of establishment.name) {
        let language = undefined
        let predicate = undefined

        switch (name.language) {
          case '1':
            language = 'fr'
            break
          case '2':
            language = 'nl'
            break
        }

        switch (name.type) {
          case '001':
            predicate = ns2.reorg('legalName')
            break
          case '002':
          case '003':
          case '004':
            predicate = ns.skos('altLabel')
          default:
            continue
            break
        }

        this.store.addQuad(
          this.df.quad(
            establishmentUri,
            ns2.reorg('legalName'),
            this.df.literal(name.name, language),
          ),
        )
      }
    }
  }

  private createBranch(company: Company) {
    for (const branch of company.branch) {
      const companyUri = this.df.namedNode(
        this.baseUri + '/id/onderneming/' + company.identifier,
      )
      const branchUri = this.df.namedNode(
        this.baseUri + '/id/bijkantoor/' + branch.identifier,
      )
      const registrationBlanknode = this.df.blankNode(
        `registration_branch_${branch.identifier}`,
      )

      this.store.addQuads([
        this.df.quad(companyUri, ns2.org('hasRegisteredSite'), branchUri),
        this.df.quad(branchUri, ns.rdf('type'), ns2.org('Site')),
        this.df.quad(
          branchUri,
          ns2.reorg('registration'),
          registrationBlanknode,
        ),
        this.df.quad(
          branchUri,
          ns.dcterms('created'),
          this.df.literal(branch.startDate, ns.xsd('date')),
        ),
      ])

      /* Identifier */
      this.store.addQuads([
        this.df.quad(
          registrationBlanknode,
          ns.rdf('type'),
          ns.adms('Identifier'),
        ),
        this.df.quad(
          registrationBlanknode,
          ns.skos('notation'),
          this.df.literal(branch.identifier),
        ),
        this.df.quad(
          registrationBlanknode,
          ns.dcterms('creator'),
          this.df.namedNode(
            'https://data.vlaanderen.be/id/organisatie/OVO027341',
          ),
        ),
        this.df.quad(
          registrationBlanknode,
          ns.adms('schemaAgency'),
          this.df.literal('Kruispuntbank van Ondernemingen (KBO)', 'nl'),
        ),
        this.df.quad(
          registrationBlanknode,
          ns.dcterms('issued'),
          this.df.literal(company.startDate, ns.xsd('date')),
        ),
      ])

      /* Contact */
      if (Object.keys(branch.address).length) {
        const contactBlanknode = this.df.blankNode(
          `contact_${branch.identifier}`,
        )
        this.store.addQuads([
          this.df.quad(
            contactBlanknode,
            ns.rdf('type'),
            ns.schema('ContactPoint'),
          ),
          this.df.quad(
            contactBlanknode,
            ns.rdf('type'),
            this.df.namedNode(
              'https://data.vlaanderen.be/id/concept/EntityContact/BRA',
            ),
          ),
          this.df.quad(branchUri, ns.schema('contactinfo'), contactBlanknode),
        ])

        /* Address */
        const addressBlanknode = this.df.blankNode(
          `address_${branch.identifier}`,
        )
        this.store.addQuads([
          this.df.quad(contactBlanknode, ns2.locn('address'), addressBlanknode),
          this.df.quad(addressBlanknode, ns.rdf('type'), ns2.locn('Address')),
          this.df.quad(
            contactBlanknode,
            ns.rdf('type'),
            this.df.namedNode(
              'https://data.vlaanderen.be/id/concept/TypeOfAddress/ABBR',
            ),
          ),
        ])

        if (branch.address.streetNl) {
          this.store.addQuad(
            this.df.quad(
              addressBlanknode,
              ns2.locn('thoroughfare'),
              this.df.literal(branch.address.streetNl, 'nl'),
            ),
          )
        }

        if (branch.address.streetFr) {
          this.store.addQuad(
            this.df.quad(
              addressBlanknode,
              ns2.locn('thoroughfare'),
              this.df.literal(branch.address.streetFr, 'fr'),
            ),
          )
        }

        if (branch.address.houseNumber) {
          this.store.addQuad(
            this.df.quad(
              addressBlanknode,
              ns.rdfs('label'),
              this.df.literal(branch.address.houseNumber),
            ),
          )
        }

        if (branch.address.box) {
          this.store.addQuad(
            this.df.quad(
              addressBlanknode,
              ns2.adres('busnummer'),
              this.df.literal(branch.address.box),
            ),
          )
        }

        if (branch.address.zipcode) {
          this.store.addQuad(
            this.df.quad(
              addressBlanknode,
              ns2.locn('postCode'),
              this.df.literal(branch.address.zipcode),
            ),
          )
        }

        if (branch.address.municipalityNl) {
          this.store.addQuad(
            this.df.quad(
              addressBlanknode,
              ns2.adres('Gemeentenaam'),
              this.df.literal(branch.address.municipalityNl, 'nl'),
            ),
          )
        }

        if (branch.address.municipalityFr) {
          this.store.addQuad(
            this.df.quad(
              addressBlanknode,
              ns2.adres('Gemeentenaam'),
              this.df.literal(branch.address.municipalityFr, 'fr'),
            ),
          )
        }

        if (branch.address.countryNl) {
          this.store.addQuad(
            this.df.quad(
              addressBlanknode,
              ns2.adres('land'),
              this.df.literal(branch.address.countryNl, 'nl'),
            ),
          )
        }

        if (branch.address.countryFr) {
          this.store.addQuad(
            this.df.quad(
              addressBlanknode,
              ns2.adres('land'),
              this.df.literal(branch.address.countryFr, 'fr'),
            ),
          )
        }
      }
    }
  }

  private discoverCompany(
    nodeId: RDF.NamedNode | RDF.BlankNode,
    quads: RDF.Quad[],
    store: QuadStore,
  ) {
    for (const q of store.findQuads(nodeId, null, null)) {
      quads.push(q)
      if (
        (q.object.termType === 'NamedNode' ||
          q.object.termType === 'BlankNode') &&
        store.findObject(q.object, ns.rdf('type'))?.value !=
          ns2.reorg('RegisteredOrganization').value 
      )
        this.discoverCompany(q.object, quads, store)
    }
  }

  /**
   * Output RDF as Turtle
   */
  public async exportRDFAsTurtle(identifier: string): Promise<string> {
    let quads: RDF.Quad[] = []
    this.discoverCompany(
      this.df.namedNode(this.baseUri + '/id/onderneming/' + identifier),
      quads,
      this.store,
    )
    quads = quads.sort(this.quadSort)
    const quadStream = streamifyArray(quads)
    const outputStream = rdfSerializer.serialize(quadStream, {
      contentType: 'text/turtle',
    })
    return text(outputStream)
  }
}
