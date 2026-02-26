import {
  ORGANIZATION_BY_ID_QUERY,
  CONTACT_POINTS_QUERY,
  SUPPORTED_FORMATS,
  SUPPORTED_EXTENSIONS,
} from '~/constants/constants'
import { executeQuery } from '~/server/services/rdfquery.service'
import { serializeAllTriples } from '~/services/serialization-service'
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

      // Detect supported file extension (.ttl, .jsonld, .nt)
      const extension: string | undefined = SUPPORTED_EXTENSIONS.find((ext) =>
        slug.endsWith(ext),
      )
      const cleanSlug = extension ? slug.replace(extension, '') : slug

      // Get the TTL file URL from runtime config and add the slug to get the correct raw file
      const runtimeConfig = useRuntimeConfig()
      const ORGANIZATION_URL =
        process.env.ORGANIZATION_TTL_URL ?? runtimeConfig.ORGANIZATION_TTL_URL
      const sourceUrl = `${ORGANIZATION_URL}/${cleanSlug}.ttl`

      // Handle content negotiation - serialize in requested format
      const acceptHeader = getHeader(event, 'accept') ?? ''
      const extensionFormat = extension
        ? SUPPORTED_FORMATS[
            extension.replace('.', '') as keyof typeof SUPPORTED_FORMATS
          ]
        : null
      const requestedFormat =
        extensionFormat ||
        Object.values(SUPPORTED_FORMATS).find((fmt) =>
          acceptHeader.includes(fmt),
        )

      if (requestedFormat) {
        const serialized = await serializeAllTriples(sourceUrl, requestedFormat)
        setHeader(event, 'Content-Type', requestedFormat)
        return serialized
      }

      // Fetch organization data as JSON
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
        source: sourceUrl,
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
