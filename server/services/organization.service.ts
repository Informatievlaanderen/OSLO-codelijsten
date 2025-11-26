import {
  ORGANIZATION_BY_ID_QUERY,
  CONTACT_POINTS_QUERY,
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

    return {
      id: orgId,
      uri: orgUri,
      name: binding.get('name')?.value ?? orgId,
      alternativeName: binding.get('altLabel')?.value,
      description: binding.get('description')?.value,
      status: binding.get('status')?.value,
      foundingDate: binding.get('issued')?.value,
      website: binding.get('homepage')?.value,
      seeAlso: binding.get('seeAlso')?.value,
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
