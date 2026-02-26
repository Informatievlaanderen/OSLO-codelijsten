import {
  CONTACT_POINTS_QUERY,
  SUPPORTED_FORMATS,
  SUPPORTED_EXTENSIONS,
  KBO_BY_ID_QUERY,
} from '~/constants/constants'
import { executeQuery } from '~/server/services/rdfquery.service'
import { serializeKboData } from '~/services/serialization-service'
import type { KboData, KboContactPoint } from '~/types/KBO'

export default defineEventHandler(
  async (event): Promise<KboData | string | null> => {
    try {
      const slug = getRouterParam(event, 'slug')

      if (!slug) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Slug is required',
        })
      }

      console.log(`[${new Date().toISOString()}] Fetching KBO: ${slug}`)

      // Detect supported file extension (.ttl, .jsonld, .nt)
      const extension: string | undefined = SUPPORTED_EXTENSIONS.find((ext) =>
        slug.endsWith(ext),
      )
      const cleanSlug = extension ? slug.replace(extension, '') : slug

      const runtimeConfig = useRuntimeConfig()
      const KBO_TTL_URL = runtimeConfig.KBO_TTL_URL ?? process.env.KBO_TTL_URL

      const sourceUrl = `${KBO_TTL_URL}/${cleanSlug}.ttl`

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
        const serialized = await serializeKboData(
          cleanSlug,
          sourceUrl,
          requestedFormat,
        )
        setHeader(event, 'Content-Type', requestedFormat)
        return serialized
      }

      const sanitizedId = cleanSlug.replace(/\./g, '')
      console.log(sanitizedId, cleanSlug, 'kekek')

      // Fetch KBO data as JSON
      const bindings = await executeQuery(KBO_BY_ID_QUERY(sanitizedId), [
        sourceUrl,
      ])

      if (!bindings.length) {
        throw createError({
          statusCode: 404,
          statusMessage: `KBO not found: ${cleanSlug}`,
        })
      }

      const binding = bindings[0]

      console.log(binding, 'bindinggggg')
      console.log(binding, 'bindinggggg')
      console.log(binding, 'bindinggggg')

      const kboData: KboData = {
        id: cleanSlug,
        source: sourceUrl,
      }

      return kboData
    } catch (error) {
      console.error('Error fetching KBO:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Error fetching KBO data',
      })
    }
  },
)
