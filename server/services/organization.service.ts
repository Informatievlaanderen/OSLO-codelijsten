import {
  ORGANIZATION_BY_ID_QUERY,
  CONTACT_POINTS_QUERY,
  ORGANIZATION_QUERY,
} from '~/constants/constants'
import { executeQuery } from './rdfquery.service'
import type { OrganizationData, ContactPoint } from '~/types/organization'

export const getOrganizationById = async (
  orgId: string,
  sourceUrl: string,
): Promise<OrganizationData | null> => {
  try {
    const query = ORGANIZATION_BY_ID_QUERY(orgId)

    const bindings = await executeQuery(query, [sourceUrl])

    if (!bindings.length) {
      return null
    }

    const binding = bindings[0]
    const orgUri = binding.get('org')?.value ?? ''

    // Fetch contact points
    const contactPoints = await getContactPoints(orgUri, sourceUrl)

    // Group seeAlso values
    const seeAlsoValues = bindings
      .map((b) => b.get('seeAlso')?.value)
      .filter((v, i, a) => v && a.indexOf(v) === i) as string[]

    return {
      id: orgId,
      uri: orgUri,
      name: binding.get('name')?.value ?? orgId,
      alternativeName: binding.get('altLabel')?.value,
      description: binding.get('description')?.value,
      status: binding.get('status')?.value,
      foundingDate: binding.get('issued')?.value,
      website: binding.get('homepage')?.value,
      seeAlso: seeAlsoValues.length > 0 ? seeAlsoValues : undefined,
      contactPoints,
      source: sourceUrl,
    }
  } catch (error) {
    console.error(`Error fetching organization ${orgId}:`)
    return null
  }
}

export const getContactPoints = async (
  orgUri: string,
  sourceUrl: string,
): Promise<ContactPoint[]> => {
  try {
    const query = CONTACT_POINTS_QUERY(orgUri)
    const bindings = await executeQuery(query, [sourceUrl])

    return bindings.map((binding, index) => {
      const email = binding.get('email')?.value
      const telephone = binding.get('telephone')?.value
      const faxNumber = binding.get('faxNumber')?.value
      const url = binding.get('url')?.value

      return {
        id: `contact-${index}`,
        name: binding.get('label')?.value,
        email: email?.replace('mailto:', ''),
        telephone,
        fax: faxNumber,
        website: url,
      }
    })
  } catch (error) {
    console.error('Error fetching contact points:', error)
    return []
  }
}

export const getAllOrganizations = async (
  sourceUrl: string,
): Promise<OrganizationData[]> => {
  try {
    const bindings = await executeQuery(ORGANIZATION_QUERY, [sourceUrl])

    const organizations: OrganizationData[] = []
    const orgMap = new Map<string, any>()

    // Group bindings by organization URI
    bindings.forEach((binding) => {
      const orgUri = binding.get('org')?.value
      if (!orgUri) return

      if (!orgMap.has(orgUri)) {
        orgMap.set(orgUri, {
          uri: orgUri,
          name: binding.get('name')?.value,
          alternativeName: binding.get('altLabel')?.value,
          description: binding.get('description')?.value,
          status: binding.get('status')?.value,
          foundingDate: binding.get('issued')?.value,
          website: binding.get('homepage')?.value,
          seeAlso: [],
        })
      }

      const seeAlso = binding.get('seeAlso')?.value
      if (seeAlso && !orgMap.get(orgUri).seeAlso.includes(seeAlso)) {
        orgMap.get(orgUri).seeAlso.push(seeAlso)
      }
    })

    // Convert map to array and extract IDs
    for (const [uri, org] of orgMap.entries()) {
      const id = uri.split('/').pop() ?? ''
      organizations.push({
        id,
        uri,
        name: org.name ?? id,
        alternativeName: org.alternativeName,
        description: org.description,
        status: org.status,
        foundingDate: org.foundingDate,
        website: org.website,
        seeAlso: org.seeAlso.length > 0 ? org.seeAlso : undefined,
        contactPoints: [],
        source: sourceUrl,
      })
    }

    return organizations
  } catch (error) {
    console.error('Error fetching all organizations:', error)
    return []
  }
}
