import { executeQuery } from '~/server/services/rdfquery.service'
import { statusLabelQuery } from '~/constants/constants'

/**
 * Resolves the human-readable label for a status URI by querying its concept scheme TTL source.
 * Falls back to an empty string if the label cannot be resolved.
 */
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
