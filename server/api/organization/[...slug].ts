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

      // Get the TTL file URL from runtime config and add the slug to get the correct raw file
      const runtimeConfig = useRuntimeConfig()
      const sourceUrl = `${runtimeConfig.ORGANIZATION_TTL_URL}/${slug}`

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

      // add .ttl to the source file of each OVO code
      const sourceUrlWithExtension: string = `${sourceUrl}.ttl`

      // Fetch organization data
      const bindings = await executeQuery(ORGANIZATION_BY_ID_QUERY(cleanSlug), [
        sourceUrlWithExtension,
      ])

      console.log(bindings.length, 'bingindgsss')

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
        sourceUrlWithExtension,
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

      const organization: OrganizationData = {
        id: cleanSlug,
        uri: orgUri,
        name: binding.get('name')?.value ?? cleanSlug,
        alternativeName: binding.get('altLabel')?.value,
        description: binding.get('description')?.value,
        status: binding.get('status')?.value,
        foundingDate: binding.get('issued')?.value,
        website: binding.get('homepage')?.value,
        seeAlso: binding.get('seeAlso')?.value,
        source: sourceUrlWithExtension,
        contactPoints,
      }

      return organization
    } catch (error) {
      console.log(error)
      console.error('Error fetching organization')
      throw createError({
        statusCode: 500,
        statusMessage: 'Error fetching organization',
      })
    }
  },
)
