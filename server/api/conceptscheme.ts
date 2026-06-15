import {
  CONCEPT_SCHEME_QUERY,
  CONCEPT_SCHEME_BY_ID_QUERY,
  ITEMS_PER_PAGE,
  statusLabelQuery,
} from '~/constants/constants'
import { executeQuery } from '~/server/services/rdfquery.service'
import type { ConceptScheme, ConceptSchemeConfig } from '~/types/conceptScheme'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Math.max(1, parseInt((query.page as string) ?? '1', 10))
  const search = ((query.search as string) ?? '').toLowerCase().trim()

  try {
    const runtimeConfig = useRuntimeConfig()
    const DATASET_CONFIG_URL: string =
      process.env.DATASET_CONFIG_URL ?? runtimeConfig.DATASET_CONFIG_URL
    const response = await $fetch<any>(DATASET_CONFIG_URL)

    console.log(
      `[${new Date().toISOString()}] Fetched concept scheme config from:`,
      DATASET_CONFIG_URL,
    )
    const data = typeof response === 'string' ? JSON.parse(response) : response
    const configs: ConceptSchemeConfig[] = data.conceptSchemes

    const filtered = search
      ? configs.filter((c) => c.urlRef.toLowerCase().includes(search))
      : configs

    const total = filtered.length
    const start = (page - 1) * ITEMS_PER_PAGE
    const pageConfigs = filtered.slice(start, start + ITEMS_PER_PAGE)

    const items = await Promise.all(
      pageConfigs.map(async (config): Promise<ConceptScheme> => {
        try {
          let bindings = await executeQuery(
            CONCEPT_SCHEME_BY_ID_QUERY(config.urlRef),
            [config.sourceUrl],
          )

          if (!bindings.length) {
            bindings = await executeQuery(CONCEPT_SCHEME_QUERY, [
              config.sourceUrl,
            ])
          }

          if (!bindings.length) {
            return {
              id: config.urlRef,
              uri: '',
              label: config.urlRef,
              source: config.sourceUrl,
              topConcepts: [],
            }
          }

          const binding = bindings[0]
          return {
            id: config.urlRef,
            uri: binding.get('scheme')?.value ?? '',
            label: binding.get('label')?.value ?? config.urlRef,
            definition: binding.get('definition')?.value ?? '',
            status: binding.get('status')?.value ?? '',
            dataset: binding.get('dataset')?.value ?? '',
            source: config.sourceUrl,
            topConcepts: [],
          }
        } catch {
          console.error(`Error fetching scheme ${config.urlRef}`)
          return {
            id: config.urlRef,
            uri: '',
            label: config.urlRef,
            source: config.sourceUrl,
            topConcepts: [],
          }
        }
      }),
    )

    return { total, items }
  } catch (error) {
    console.error('Error fetching concept schemes:', error)
    return { total: 0, items: [] }
  }
})

export const resolveStatusLabel = async (
  statusUri?: string,
): Promise<string> => {
  if (!statusUri) {
    return ''
  }

  const statusSource = statusUri.endsWith('.ttl')
    ? statusUri
    : `${statusUri}.ttl`

  try {
    const result = await executeQuery(statusLabelQuery(statusUri), [
      statusSource,
    ])

    const label = result[0]?.get('label')?.value ?? ''
    return label
  } catch (error) {
    console.error(`Error resolving status label for: ${statusUri}`, error)
    return ''
  }
}
