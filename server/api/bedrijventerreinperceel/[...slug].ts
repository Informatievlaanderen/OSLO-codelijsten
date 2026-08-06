import { getBedrijventerreinperceel, getSparqlEndpoint } from '~/server/services/bedrijventerrein.service'
import { SUPPORTED_EXTENSIONS, SUPPORTED_FORMATS } from '~/constants/constants'
import { BEDRIJVENTERREINPERCEEL_URI_BASE } from '~/constants/bedrijventerrein.constants'
import { serializeEntityTriples } from '~/services/serialization.service'
import type { Bedrijventerreinperceel } from '~/types/bedrijventerrein'

export default defineEventHandler(
  async (event): Promise<Bedrijventerreinperceel | string | null> => {
    try {
      const slug = getRouterParam(event, 'slug')

      if (!slug) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Slug parameter is required',
        })
      }

      console.log(
        `[${new Date().toISOString()}] Fetching bedrijventerreinperceel: ${slug}`,
      )

      // Detect supported file extension
      const extension: string | undefined = SUPPORTED_EXTENSIONS.find((ext) =>
        slug.endsWith(ext),
      )
      const cleanSlug = extension ? slug.replace(extension, '') : slug

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
        const entityUri = `${BEDRIJVENTERREINPERCEEL_URI_BASE}${cleanSlug}`
        const serialized = await serializeEntityTriples(
          entityUri,
          getSparqlEndpoint(),
          requestedFormat,
        )
        setHeader(event, 'Content-Type', requestedFormat)
        return serialized
      }

      const data = await getBedrijventerreinperceel(cleanSlug)

      if (!data) {
        throw createError({
          statusCode: 404,
          statusMessage: `Bedrijventerreinperceel not found: ${cleanSlug}`,
        })
      }

      return data
    } catch (error: any) {
      if (error?.statusCode === 404) throw error
      console.error('Error fetching bedrijventerreinperceel:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Error fetching bedrijventerreinperceel',
      })
    }
  },
)
