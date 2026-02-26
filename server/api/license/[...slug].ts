import {
  LICENSE_BY_ID_QUERY,
  SUPPORTED_FORMATS,
  TTL,
} from '~/constants/constants'
import { executeQuery } from '~/server/services/rdfquery.service'
import { handleContentNegotiation } from '~/services/content-negotiation.service'
import type { License } from '~/types/license'

export default defineEventHandler(
  async (event): Promise<License | string | null> => {
    try {
      const slug = getRouterParam(event, 'slug')

      if (!slug) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Slug is required',
        })
      }

      console.log(`[${new Date().toISOString()}] Fetching license: ${slug}`)

      // Handle slug array and .ttl extension
      const slugString = Array.isArray(slug) ? slug.join('/') : slug
      const hasTtlExtension = slugString.endsWith(TTL)
      const cleanSlug = hasTtlExtension
        ? slugString.replace(/\.ttl$/, '')
        : slugString

      // Get the TTL file URL from runtime config
      const runtimeConfig = useRuntimeConfig()
      const LICENSE_TTL_URL =
        process.env.LICENSE_TTL_URL ?? runtimeConfig.LICENSE_TTL_URL

      if (!LICENSE_TTL_URL) {
        throw createError({
          statusCode: 400,
          statusMessage: 'LICENSE_TTL_URL is not configured',
        })
      }

      // Handle content negotiation
      const acceptHeader = getHeader(event, 'accept') ?? ''
      if (hasTtlExtension || acceptHeader.includes(SUPPORTED_FORMATS.ttl)) {
        const negotiatedContent = await handleContentNegotiation(
          event,
          acceptHeader,
          LICENSE_TTL_URL,
        )
        if (negotiatedContent) return negotiatedContent
      }

      // Fetch license data
      const bindings = await executeQuery(LICENSE_BY_ID_QUERY(cleanSlug), [
        LICENSE_TTL_URL,
      ])

      if (!bindings.length) {
        throw createError({
          statusCode: 404,
          statusMessage: `License not found: ${cleanSlug}`,
        })
      }

      // Group bindings by license URI to handle multiple values per license
      const licenseMap = new Map<string, any[]>()

      bindings.forEach((binding) => {
        const licenseUri = binding.get('license')?.value ?? ''
        if (!licenseMap.has(licenseUri)) {
          licenseMap.set(licenseUri, [])
        }
        licenseMap.get(licenseUri)!.push(binding)
      })

      // Transform grouped bindings into License object (take first/only license)
      const firstEntry = licenseMap.entries().next().value
      if (!firstEntry) {
        throw createError({
          statusCode: 404,
          statusMessage: `No license data found for: ${cleanSlug}`,
        })
      }
      const [licenseUri, licenseBindings] = firstEntry

      // keep the id. Bit of a dirty fix due to the version also being present in the URI
      const licenseId =
        licenseUri.replace('https://data.vlaanderen.be/id/licentie/', '') ?? ''

      // Extract arrays from multiple bindings
      const types: Set<string> = new Set()
      const seeAlsos: Set<string> = new Set()
      const requires: Set<string> = new Set()
      let title: string | undefined
      let description: string | undefined
      let versionInfo: string | undefined
      let sameAs: string | undefined

      licenseBindings.forEach((binding: any) => {
        if (binding.get('title')?.value) {
          title = binding.get('title')?.value
        }
        if (binding.get('description')?.value) {
          description = binding.get('description')?.value
        }
        if (binding.get('versionInfo')?.value) {
          versionInfo = binding.get('versionInfo')?.value
        }
        if (binding.get('sameAs')?.value) {
          sameAs = binding.get('sameAs')?.value
        }
        if (binding.get('type')?.value) {
          types.add(binding.get('type')?.value)
        }
        if (binding.get('seeAlso')?.value) {
          seeAlsos.add(binding.get('seeAlso')?.value)
        }
        if (binding.get('requires')?.value) {
          requires.add(binding.get('requires')?.value)
        }
      })

      const license: License = {
        id: licenseId,
        uri: licenseUri,
        title,
        description,
        type: Array.from(types),
        seeAlso: Array.from(seeAlsos),
        requires: Array.from(requires),
        versionInfo,
        sameAs,
        source: LICENSE_TTL_URL,
      }

      console.log('License fetched successfully:', license.uri)

      return license
    } catch (error) {
      console.error('Error fetching license:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Error fetching license',
      })
    }
  },
)
