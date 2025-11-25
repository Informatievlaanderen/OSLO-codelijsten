import {
  ORGANIZATION_BY_ID_QUERY,
  CONTACT_POINTS_QUERY,
} from '~/constants/constants'
import { executeQuery } from '~/server/services/rdfquery.service'
import { handleContentNegotiation } from '~/services/content-negotiation.service'
import type { OrganizationData, ContactPoint } from '~/types/organization'

export default defineEventHandler(
  async (event): Promise<OrganizationData | string | null> => {
    try {
      const slug = getRouterParam(event, 'slug')

      if (!slug) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Slug is required',
        })
      }

      console.log(
        `[${new Date().toISOString()}] Fetching organization: ${slug}`,
      )

      // Handle .ttl extension
      const hasTtlExtension = slug.endsWith('.ttl')
      const cleanSlug = hasTtlExtension ? slug.replace(/\.ttl$/, '') : slug

      // Get the TTL file URL from runtime config
      const runtimeConfig = useRuntimeConfig()
      const sourceUrl = runtimeConfig.ORGANIZATION_TTL_URL

      // Handle content negotiation
      const acceptHeader = getHeader(event, 'accept') ?? ''
      if (hasTtlExtension || acceptHeader.includes('text/turtle')) {
        const negotiatedContent = await handleContentNegotiation(
          event,
          acceptHeader,
          sourceUrl,
        )
        if (negotiatedContent) return negotiatedContent
      }

      // Fetch organization data
      const bindings = await executeQuery(ORGANIZATION_BY_ID_QUERY(cleanSlug), [
        sourceUrl,
      ])

      if (!bindings.length) {
        throw createError({
          statusCode: 404,
          statusMessage: `Organization not found: ${cleanSlug}`,
        })
      }

      const binding = bindings[0]
      const orgUri = binding.get('org')?.value ?? ''

      // Fetch contact points
      const contactBindings = await executeQuery(CONTACT_POINTS_QUERY(orgUri), [
        sourceUrl,
      ])

      const contactPoints: ContactPoint[] = contactBindings.map(
        (cb, index) => ({
          id: `contact-${index}`,
          name: cb.get('label')?.value,
          email: cb.get('email')?.value,
          telephone: cb.get('telephone')?.value,
          fax: cb.get('faxNumber')?.value,
          website: cb.get('url')?.value,
        }),
      )

      // Group seeAlso values
      const seeAlsoValues = bindings
        .map((b) => b.get('seeAlso')?.value)
        .filter((v, i, a) => v && a.indexOf(v) === i) as string[]

      const organization: OrganizationData = {
        id: cleanSlug,
        uri: orgUri,
        name: binding.get('name')?.value ?? cleanSlug,
        alternativeName: binding.get('altLabel')?.value,
        description: binding.get('description')?.value,
        status: binding.get('status')?.value,
        foundingDate: binding.get('issued')?.value,
        website: binding.get('homepage')?.value,
        seeAlso: seeAlsoValues.length > 0 ? seeAlsoValues : undefined,
        contactPoints,
      }

      return organization
    } catch (error) {
      console.error('Error fetching organization')
      throw createError({
        statusCode: 500,
        statusMessage: 'Error fetching organization',
      })
    }
  },
)
