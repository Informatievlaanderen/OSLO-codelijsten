import { QueryEngine } from '@comunica/query-sparql'
import {
  CONCEPT_QUERY,
  schemeQuery,
  topConceptQuery,
} from '~/constants/constants'
import type { Concept, TopConcept } from '~/types/concept'
import type { ConceptScheme } from '~/types/conceptScheme'

const queryEngine = new QueryEngine()

export const executeQuery = (
  query: string,
  sources: string[],
): Promise<any[]> => {
  const bindings: any[] = []

  return new Promise<any[]>((resolve, reject) => {
    queryEngine
      .queryBindings(query, { sources })
      .then((bindingsStream) => {
        bindingsStream.on('data', (binding) => {
          bindings.push(binding)
        })

        bindingsStream.on('end', () => {
          resolve(bindings)
        })

        bindingsStream.on('error', (error) => {
          reject(error)
        })
      })
      .catch(reject)
  })
}

export const getTopConcepts = async (
  schemeUri: string,
  sourceUrl: string,
): Promise<TopConcept[]> => {
  const query = topConceptQuery(schemeUri)

  try {
    const result = await executeQuery(query, [sourceUrl])

    return result.map((binding: any) => ({
      id: binding.get('concept')?.value.split('/').pop() ?? '',
      uri: binding.get('concept')?.value ?? '',
      label: binding.get('label')?.value ?? '',
      definition: binding.get('definition')?.value ?? '',
      notation: binding.get('notation')?.value ?? '',
      source: sourceUrl,
    }))
  } catch (error) {
    console.error('Error fetching top concepts:', error)
    return []
  }
}

export const getConcept = async (
  slug: string,
  sourceUrl: string,
): Promise<Concept | null> => {
  // Determine sources to query
  let sources: string[] = []

  sources = [sourceUrl]

  if (!sources.length) {
    console.error(`No sources available to search for concept: ${slug}`)
    return null
  }

  const query = CONCEPT_QUERY
  try {
    // Try each source until we find the concept
    for (const source of sources) {
      const result = await executeQuery(query, [source])

      if (!result.length) {
        continue
      }

      // Find the binding where the concept URI's last path segment matches the concept ID
      const binding = result.find((b: any) => {
        const conceptUri = b.get('concept')?.value ?? ''
        const lastSegment = conceptUri.split('/').pop() ?? ''
        return lastSegment === slug
      })

      if (!binding) {
        continue
      }

      const conceptUri = binding.get('concept')?.value ?? ''

      // Get all related concepts
      const broaderConcepts = await getRelatedConcepts(
        conceptUri,
        source,
        'broader',
      )
      const narrowerConcepts = await getRelatedConcepts(
        conceptUri,
        source,
        'narrower',
      )

      // Get scheme information
      const inSchemeUris = result
        .filter(
          (b: any) =>
            b.get('concept')?.value === conceptUri && b.get('inScheme'),
        )
        .map((b: any) => b.get('inScheme')?.value)
        .filter((v, i, a) => v && a.indexOf(v) === i) as string[]

      const topConceptOfUris = result
        .filter(
          (b: any) =>
            b.get('concept')?.value === conceptUri && b.get('topConceptOf'),
        )
        .map((b: any) => b.get('topConceptOf')?.value)
        .filter((v, i, a) => v && a.indexOf(v) === i) as string[]

      const inScheme = await Promise.all(
        inSchemeUris.map((uri) => getSchemeInfo(uri, source)),
      )

      const topConceptOf = await Promise.all(
        topConceptOfUris.map((uri) => getSchemeInfo(uri, source)),
      )

      return {
        id: slug,
        uri: conceptUri,
        label: binding.get('label')?.value ?? slug,
        definition: binding.get('definition')?.value ?? '',
        notation: binding.get('notation')?.value ?? '',
        status: binding.get('status')?.value ?? '',
        dataset:
          inSchemeUris[0] ?? 'https://data.vlaanderen.be/id/dataset/codelist',
        inScheme: inScheme.filter((s) => s !== null) as ConceptScheme[],
        topConceptOf: topConceptOf.filter((s) => s !== null) as ConceptScheme[],
        broader: broaderConcepts,
        narrower: narrowerConcepts,
        source: source,
      } as Concept
    }

    return null
  } catch (error) {
    console.error('Error fetching concept:', error)
    return null
  }
}

export const getRelatedConcepts = async (
  conceptUri: string,
  sourceUrl: string,
  relation: 'broader' | 'narrower',
): Promise<Concept[]> => {
  const query = `
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

    SELECT ?relatedConcept ?label ?definition ?notation WHERE {
      <${conceptUri}> skos:${relation} ?relatedConcept .
      OPTIONAL { ?relatedConcept skos:prefLabel ?label . }
      OPTIONAL { ?relatedConcept skos:definition ?definition . }
      OPTIONAL { ?relatedConcept skos:notation ?notation . }
    }
  `

  try {
    const result = await executeQuery(query, [sourceUrl])

    return result.map((binding: any) => ({
      id: binding.get('relatedConcept')?.value.split('/').pop() ?? '',
      uri: binding.get('relatedConcept')?.value ?? '',
      label: binding.get('label')?.value,
      definition: binding.get('definition')?.value,
      notation: binding.get('notation')?.value,
      source: sourceUrl,
    }))
  } catch (error) {
    console.error(`Error fetching ${relation} concepts:`, error)
    return []
  }
}

export const getSchemeInfo = async (
  schemeUri: string,
  sourceUrl: string,
): Promise<ConceptScheme | null> => {
  const query = schemeQuery(schemeUri)

  try {
    const result = await executeQuery(query, [sourceUrl])

    if (!result.length) {
      return null
    }

    const binding = result[0]
    const schemeId = schemeUri.split('/').pop() ?? ''

    return {
      id: schemeId,
      uri: schemeUri,
      label: binding.get('label')?.value ?? schemeId,
      definition: binding.get('definition')?.value,
      source: sourceUrl,
    } as ConceptScheme
  } catch (error) {
    console.error('Error fetching scheme info:', error)
    return null
  }
}
