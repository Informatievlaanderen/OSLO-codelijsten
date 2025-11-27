import type { Organization, Contact } from '../types/organization'
import { TtlHelperService } from './ttl-helper.service'

export class OrganizationToTTLService {
  private readonly baseUri = 'https://data.vlaanderen.be'
  private readonly orgUri = `${this.baseUri}/id/organisatie`
  private readonly docUri = `${this.baseUri}/doc/organisatie`

  private readonly helper = new TtlHelperService()

  /**
   * Convert organization data to Turtle format with prefixes
   */
  convertToTTLWithPrefixes(org: Organization): string {
    return `${this.helper.generatePrefixes()}\n${this.convertToTTL(org)}`
  }

  /**
   * Convert organization data to Turtle format
   */
  convertToTTL(org: Organization): string {
    const orgResourceUri = this.helper.createUri(this.orgUri, org.ovoNumber)
    const docResourceUri = this.helper.createUri(this.docUri, org.ovoNumber)

    const parts = [
      this.generateOrganizationResource(org, orgResourceUri, docResourceUri),
      this.generateContactPoints(org),
    ]

    return this.helper.joinNonEmpty(parts)
  }

  /**
   * Generate the main organization resource
   */
  private generateOrganizationResource(
    org: Organization,
    orgResourceUri: string,
    docResourceUri: string,
  ): string {
    const properties = [
      orgResourceUri,
      '  a org:Organization ;',
      this.generateBasicProperties(org),
      this.generateStatus(org),
      this.generateIdentifiers(org),
      this.generateWegwijsLink(org),
      this.generateContactPointReferences(org),
      `.`,
    ]

    return this.helper.joinNonEmpty(properties)
  }

  /**
   * Generate basic organization properties
   */
  private generateBasicProperties(org: Organization): string {
    const properties: string[] = [
      `  skos:prefLabel "${this.helper.escapeString(org.name)}"@nl ;`,
    ]

    if (org.shortName) {
      properties.push(
        `  skos:altLabel "${this.helper.escapeString(org.shortName)}"@nl ;`,
      )
    }

    if (org.description) {
      properties.push(
        `  dct:description "${this.helper.escapeString(org.description)}"@nl ;`,
      )
    }

    return properties.join('\n')
  }

  /**
   * Generate status property
   */
  private generateStatus(org: Organization): string {
    const status = this.helper.determineStatus(org.validity?.end)
    const statusUri = `http://data.vlaanderen.be/id/concept/organisatiestatus/${status}`
    return `  adms:status <${statusUri}> ;`
  }

  /**
   * Generate identifier structures for OVO and optionally KBO
   */
  private generateIdentifiers(org: Organization): string {
    const identifiers: string[] = []

    // OVO identifier
    identifiers.push(this.createOvoIdentifier(org))

    // KBO identifier (if exists)
    if (org.kboNumber) {
      identifiers.push(this.createKboIdentifier(org))
    }

    if (identifiers.length === 0) {
      return ''
    }

    return `  adms:identifier\n${identifiers.join(',\n')} ;`
  }

  /**
   * Create OVO identifier structure
   */
  private createOvoIdentifier(org: Organization): string {
    const issuedDate = this.helper.getIssuedDate(org.validity?.start)

    return `  [
    a adms:Identifier ;
    skos:notation "${org.ovoNumber}" ;
    dct:creator <${this.orgUri}/OVO002949> ;
    adms:schemaAgency "Digitaal Vlaanderen"@nl ;
    dct:issued ${this.helper.formatXsdDate(issuedDate)}
  ]`
  }

  /**
   * Create KBO identifier structure
   */
  private createKboIdentifier(org: Organization): string {
    const issuedDate = this.helper.getIssuedDate(org.validity?.start)

    return `  [
    a adms:Identifier ;
    skos:notation "${org.kboNumber}" ;
    dct:creator <${this.orgUri}/OVO002734> ;
    adms:schemaAgency "Kruispuntenbank van Ondernemingen"@nl ;
    dct:issued ${this.helper.formatXsdDate(issuedDate)}
  ]`
  }

  /**
   * Generate Wegwijs link if organization ID exists
   */
  private generateWegwijsLink(org: Organization): string {
    if (!org.id) {
      return ''
    }

    return `  rdfs:seeAlso <https://wegwijs.vlaanderen.be/#/organisations/${org.id}> ;`
  }

  /**
   * Generate references to contact points
   */
  private generateContactPointReferences(org: Organization): string {
    const validContacts = this.getValidContacts(org)

    if (validContacts.length === 0) {
      return ''
    }

    const contactUris = validContacts.map(
      (_, index) => `<${this.orgUri}/${org.ovoNumber}/contact/${index}>`,
    )

    return `  schema:contactPoint ${contactUris.join(', ')} ;`
  }

  /**
   * Generate contact point resources
   */
  private generateContactPoints(org: Organization): string {
    const validContacts = this.getValidContacts(org)

    if (validContacts.length === 0) {
      return ''
    }

    return validContacts
      .map((contact, index) => this.generateContactPoint(org, contact, index))
      .join('\n')
  }

  /**
   * Generate a single contact point resource
   */
  private generateContactPoint(
    org: Organization,
    contact: Contact,
    index: number,
  ): string {
    const contactUri = `<${this.orgUri}/${org.ovoNumber}/contact/${index}>`

    const properties = [`\n${contactUri}`, '  a schema:ContactPoint ;']

    if (contact.contactTypeName) {
      properties.push(
        `  schema:contactType "${this.helper.escapeString(contact.contactTypeName)}"@nl ;`,
      )
    }

    properties.push(this.generateContactValue(contact))

    return properties.join('\n')
  }

  /**
   * Generate the appropriate property for a contact value
   */
  private generateContactValue(contact: Contact): string {
    const typeName = contact.contactTypeName?.toLowerCase() || ''
    const value = this.helper.escapeString(contact.value)

    if (typeName.includes('email')) {
      return `  schema:email "mailto:${value}" .`
    }

    if (typeName.includes('telefoon') || typeName.includes('telephone')) {
      return `  schema:telephone "${value}" .`
    }

    if (typeName.includes('gsm') || typeName.includes('mobiel')) {
      return `  schema:telephone "${value}" .`
    }

    if (typeName.includes('fax')) {
      return `  schema:faxNumber "${value}" .`
    }

    if (
      typeName.includes('website') ||
      typeName.includes('homepage') ||
      typeName.includes('intranetsite')
    ) {
      return `  schema:url <${contact.value}> .`
    }

    return `  rdfs:comment "${value}"@nl .`
  }

  /**
   * Get valid contacts (those with a value)
   */
  private getValidContacts(org: Organization): Contact[] {
    return org.contacts?.filter((c) => c.value) || []
  }
}
