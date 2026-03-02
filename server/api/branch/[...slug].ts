import {
  SUPPORTED_FORMATS,
  SUPPORTED_EXTENSIONS,
  KBO_BRANCH_BY_ID_QUERY,
} from '~/constants/constants'
import { executeQuery } from '~/server/services/rdfquery.service'
import { serializeAllTriples } from '~/services/serialization-service'
import type { KBOBranchData, KBOBranchRegistration } from '~/types/KBO'

export default defineEventHandler(
  async (event): Promise<KBOBranchData | string | null> => {
    try {
      const slug = getRouterParam(event, 'slug')

      if (!slug) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Slug is required',
        })
      }

      console.log(`[${new Date().toISOString()}] Fetching KBO branch: ${slug}`)

      // Detect supported file extension (.ttl, .jsonld, .nt)
      const extension: string | undefined = SUPPORTED_EXTENSIONS.find((ext) =>
        slug.endsWith(ext),
      )

      const cleanSlug = extension ? slug.replace(extension, '') : slug

      const runtimeConfig = useRuntimeConfig()
      const KBO_TTL_URL = runtimeConfig.KBO_TTL_URL ?? process.env.KBO_TTL_URL

      const sourceUrl = `${KBO_TTL_URL}/branches/${cleanSlug}.ttl`

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

      // Fetch branch data as JSON
      const bindings = await executeQuery(KBO_BRANCH_BY_ID_QUERY(cleanSlug), [
        sourceUrl,
      ])

      if (!bindings.length) {
        throw createError({
          statusCode: 404,
          statusMessage: `KBO branch not found: ${cleanSlug}`,
        })
      }

      const binding = bindings[0]

      const registration: KBOBranchRegistration | undefined =
        binding.get('regNotation')?.value ||
        binding.get('regCreator')?.value ||
        binding.get('regSchemaAgency')?.value ||
        binding.get('regIssued')?.value
          ? {
              notation: binding.get('regNotation')?.value,
              creator: binding.get('regCreator')?.value,
              schemaAgency: binding.get('regSchemaAgency')?.value,
              issued: binding.get('regIssued')?.value,
            }
          : undefined

      const branchData: KBOBranchData = {
        id: cleanSlug,
        uri: binding.get('site')?.value,
        type: binding.get('type')?.value,
        created: binding.get('created')?.value,
        registration,
        source: sourceUrl,
      }

      return branchData
    } catch (error) {
      console.error('Error fetching KBO branch:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Error fetching KBO branch data',
      })
    }
  },
)
