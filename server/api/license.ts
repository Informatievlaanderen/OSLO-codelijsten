import { LICENSE_QUERY } from '~/constants/constants'
import { executeQuery } from '~/server/services/rdfquery.service'
import type { License } from '~/types/license'

export default defineEventHandler(async (_event): Promise<License[]> => {
  try {
    console.log(`[${new Date().toISOString()}] Fetching all licenses`)

    // Get the TTL file URL from runtime config
    const runtimeConfig = useRuntimeConfig()
    const sourceUrl = runtimeConfig.LICENSE_TTL_URL

    // Fetch license data
    const bindings = await executeQuery(LICENSE_QUERY, [sourceUrl])

    if (!bindings.length) {
      return []
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

    // Transform grouped bindings into License objects
    const licenses: License[] = Array.from(licenseMap.entries()).map(
      ([licenseUri, licensBindings]) => {
        // keep the id. Bit of a dirty fix due to the version also being present in the URI
        const licenseId =
          licenseUri.replace('https://data.vlaanderen.be/id/licentie/', '') ??
          ''
        // Extract arrays from multiple bindings
        const types: Set<string> = new Set()
        const seeAlsos: Set<string> = new Set()
        const requires: Set<string> = new Set()
        let title: string | undefined
        let description: string | undefined
        let versionInfo: string | undefined
        let sameAs: string | undefined

        licensBindings.forEach((binding) => {
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

        return {
          id: licenseId,
          uri: licenseUri,
          title,
          description,
          type: Array.from(types),
          seeAlso: Array.from(seeAlsos),
          requires: Array.from(requires),
          versionInfo,
          sameAs,
          source: sourceUrl,
        } as License
      },
    )

    console.log(`Successfully fetched ${licenses.length} licenses`)

    return licenses
  } catch (error) {
    console.error('Error fetching licenses:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error fetching licenses',
    })
  }
})
