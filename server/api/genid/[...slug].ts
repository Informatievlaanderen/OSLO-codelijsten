import { getGenidResource, getSparqlEndpoint } from '~/server/services/bedrijventerrein.service'
import { SUPPORTED_EXTENSIONS, SUPPORTED_FORMATS } from '~/constants/constants'
import { GENID_URI_BASE } from '~/constants/bedrijventerrein.constants'
import { serializeEntityTriples } from '~/services/serialization.service'
import type { GenidResource } from '~/types/bedrijventerrein'

export default defineEventHandler(
  async (event): Promise<GenidResource | string | null> => {
    try {
      const slug = getRouterParam(event, 'slug')

      if (!slug) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Slug parameter is required',
        })
      }

      console.log(
        `[${new Date().toISOString()}] Fetching genid: ${slug}`,
      )

      // Detect supported file extension
      const extension: string | undefined = SUPPORTED_EXTENSIONS.find((ext) =>
        slug.endsWith(ext),
      )
      const cleanSlug = extension ? slug.replace(extension, '') : slug

      // Parse type/hash from slug
      const parts = cleanSlug.split('/')
      if (parts.length < 2) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid genid slug format. Expected: type/hash',
        })
      }
      const type = parts[0]
      const hash = parts.slice(1).join('/')

      // Handle content negotiation
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
        const entityUri = `${GENID_URI_BASE}${type}/${hash}`
        const serialized = await serializeEntityTriples(
          entityUri,
          getSparqlEndpoint(),
          requestedFormat,
        )
        setHeader(event, 'Content-Type', requestedFormat)
        return serialized
      }

      const data = await getGenidResource(type, hash)

      if (!data) {
        throw createError({
          statusCode: 404,
          statusMessage: `Genid resource not found: ${type}/${hash}`,
        })
      }

      return data
    } catch (error: any) {
      if (error?.statusCode === 404) throw error
      console.error('Error fetching genid resource:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Error fetching genid resource',
      })
    }
  },
)
