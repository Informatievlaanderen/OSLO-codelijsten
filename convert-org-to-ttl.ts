import * as fs from 'fs'
import * as path from 'path'

interface Contact {
  value?: string
  contactTypeName?: string
}

interface Organization {
  id: string
  ovoNumber: string
  name: string
  shortName?: string
  description?: string
  validity?: { start?: string; end?: string }
  contacts?: Contact[]
}

class OrganizationToTTL {
  private baseUri = 'https://data.vlaanderen.be'
  private orgUri = `${this.baseUri}/id/organisatie`

  /**
   * Convert organization data to Turtle format
   */
  convertToTTL(org: Organization): string {
    let ttl = ''

    const orgResourceUri = `<${this.orgUri}/${org.ovoNumber}>`
    const docUri = `<${this.baseUri}/doc/organisatie/${org.ovoNumber}>`

    // Organization resource
    ttl += `${orgResourceUri}\n`
    ttl += `  a org:Organization ;\n`
    ttl += `  dct:identifier "${org.ovoNumber}" ;\n`
    ttl += `  foaf:name "${this.escapeString(org.name)}"@nl ;\n`

    if (org.shortName) {
      ttl += `  skos:altLabel "${this.escapeString(org.shortName)}"@nl ;\n`
    }

    if (org.description) {
      ttl += `  dct:description "${this.escapeString(org.description)}"@nl ;\n`
    }

    if (org.validity?.start) {
      ttl += `  dct:issued "${org.validity.start}"^^xsd:date ;\n`
    }

    if (org.validity?.end) {
      ttl += `  dct:valid "${org.validity.end}"^^xsd:date ;\n`
    }

    // All contact points in a single schema:contactPoint property
    const validContacts = org.contacts?.filter((c) => c.value) || []
    if (validContacts.length > 0) {
      ttl += `  schema:contactPoint `
      ttl += validContacts
        .map((_, index) => `<${this.orgUri}/${org.ovoNumber}/contact/${index}>`)
        .join(', ')
      ttl += ` ;\n`
    }

    ttl += `  rdfs:isDefinedBy ${docUri} .\n`

    // Contact point resources
    if (validContacts.length > 0) {
      ttl += this.generateContactPointTriples(org, validContacts)
    }

    // Document resource
    ttl += `\n${docUri}\n`
    ttl += `  a foaf:Document ;\n`
    ttl += `  rdfs:label "Document voor ${this.escapeString(org.name)}"@nl ;\n`
    ttl += `  foaf:primaryTopic ${orgResourceUri} .\n`

    return ttl
  }

  /**
   * Generate contact point triples
   */
  private generateContactPointTriples(
    org: Organization,
    validContacts: Contact[]
  ): string {
    let ttl = ''

    validContacts.forEach((contact, index) => {
      const contactUri = `<${this.orgUri}/${org.ovoNumber}/contact/${index}>`

      ttl += `\n${contactUri}\n`
      ttl += `  a schema:ContactPoint ;\n`

      if (contact.contactTypeName) {
        ttl += `  rdfs:label "${this.escapeString(
          contact.contactTypeName
        )}"@nl ;\n`
      }

      // Handle different contact types - always end with a period
      if (contact.contactTypeName?.toLowerCase().includes('email')) {
        ttl += `  schema:email "${this.escapeString(contact.value)}" .\n`
      } else if (
        contact.contactTypeName?.toLowerCase().includes('telefoon') ||
        contact.contactTypeName?.toLowerCase().includes('telephone')
      ) {
        ttl += `  schema:telephone "${this.escapeString(contact.value)}" .\n`
      } else if (contact.contactTypeName?.toLowerCase().includes('fax')) {
        ttl += `  schema:faxNumber "${this.escapeString(contact.value)}" .\n`
      } else if (
        contact.contactTypeName?.toLowerCase().includes('website') ||
        contact.contactTypeName?.toLowerCase().includes('homepage')
      ) {
        ttl += `  schema:url <${contact.value}> .\n`
      } else if (
        contact.contactTypeName?.toLowerCase().includes('gsm') ||
        contact.contactTypeName?.toLowerCase().includes('mobiel')
      ) {
        ttl += `  schema:telephone "${this.escapeString(contact.value)}" .\n`
      } else {
        ttl += `  rdfs:comment "${this.escapeString(contact.value)}"@nl .\n`
      }
    })

    return ttl
  }

  /**
   * Generate RDF prefixes
   */
  private generatePrefixes(): string {
    return `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix dct: <http://purl.org/dc/terms/> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix org: <http://www.w3.org/ns/org#> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix schema: <http://schema.org/> .

`
  }

  /**
   * Escape special characters in strings
   */
  private escapeString(str: string | undefined): string {
    if (!str) return ''
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
  }

  private get docUri(): string {
    return `${this.baseUri}/doc/organisatie`
  }
}

/**
 * Main conversion function
 */
async function convertOrganizationsToTTL(
  inputPath: string,
  outputPath: string
): Promise<void> {
  try {
    // Read JSON file
    const jsonData = fs.readFileSync(inputPath, 'utf-8')
    const organizations: Organization[] = JSON.parse(jsonData)

    const converter = new OrganizationToTTL()

    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputPath)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Generate prefixes once
    let allTTL = converter['generatePrefixes']()

    // Convert each organization
    organizations.forEach((org, index) => {
      if (org.ovoNumber && org.name) {
        allTTL += converter.convertToTTL(org)
        if (index < organizations.length - 1) {
          allTTL += '\n'
        }
      }
    })

    // Write to file
    fs.writeFileSync(outputPath, allTTL, 'utf-8')
    console.log(`✓ Converted ${organizations.length} organizations to TTL`)
    console.log(`✓ Output written to: ${outputPath}`)
  } catch (error) {
    console.error('Error converting organizations:', error)
    process.exit(1)
  }
}

// Run conversion
const inputFile = process.argv[2] || './dummy.json'
const outputFile = process.argv[3] || './output/organisations.ttl'

convertOrganizationsToTTL(inputFile, outputFile)
