import { useRdfQuery } from '~/composables/useRdfQuery'
import { useDatasetConfig } from '~/composables/useDatasetConfig'
import {
  CONCEPT_SCHEME_QUERY,
  CONCEPT_QUERY,
  topConceptQuery,
  schemeQuery,
  relatedConceptsQuery,
} from '~/constants/constants'
import type { ConceptScheme } from '~/types/conceptScheme'
import type { TopConcept, Concept } from '~/types/concept'

export class ConceptSchemeService {
  private rdfQuery = useRdfQuery()
  private datasetConfig = useDatasetConfig()

  async getConceptScheme(
    slug: string,
    sourceUrl?: string,
  ): Promise<ConceptScheme | null> {
    // Find the matching entry in dataset config by key
    const datasetEntry = await this.datasetConfig.getConceptSchemeByKey(slug)

    if (!datasetEntry && !sourceUrl) {
      console.error(`No dataset configuration found for slug: ${slug}`)
      return null
    }

    // Use provided sourceUrl, or fall back to the URL from dataset config
    const source = sourceUrl ?? datasetEntry?.url

    if (!source) {
      console.error(`No source URL available for slug: ${slug}`)
      return null
    }

    try {
      const result = await this.rdfQuery.executeQuery({
        query: CONCEPT_SCHEME_QUERY,
        sources: [source],
      })

      let schemeUri: string = ''

      if (!result.bindings.length) {
        return null
      }
      // Find the binding where the scheme URI's last path segment matches the slug
      // can be multiple bindings, for example in an all.nt file: https://raw.githubusercontent.com/Informatievlaanderen/OSLO-codelistgenerated/digitalewatermeter-main/all.nt
      const binding =
        result.bindings.find((b) => {
          schemeUri = b.get('scheme')?.value ?? ''
          const lastSegment = schemeUri.split('/').pop() ?? ''
          return lastSegment === slug
        }) ?? result.bindings[0] // Fallback to first binding if no match found

      // Get top concepts separately
      const topConcepts = await this.getTopConcepts(schemeUri, source)

      return {
        id: slug,
        uri: schemeUri,
        label: binding.get('label')?.value ?? slug,
        definition: binding.get('definition')?.value ?? '',
        status: binding.get('status')?.value ?? '',
        dataset:
          binding.get('dataset')?.value ??
          'https://data.vlaanderen.be/id/dataset/codelist',
        topConcepts,
        concepts: topConcepts,
        source: datasetEntry?.url ?? '',
      }
    } catch (error) {
      console.error('Error fetching concept scheme:', error)
      return null
    }
  }

  async getConcept(slug: string, sourceUrl?: string): Promise<Concept | null> {
    // Extract concept scheme and concept ID from slug
    // Format: ConceptScheme/ConceptId or just ConceptId
    const slugParts = slug.split('/')
    const conceptSchemeSlug = slugParts.length > 1 ? slugParts[0] : null
    const conceptId = slugParts.length > 1 ? slugParts[1] : slugParts[0]

    // Determine sources to query
    let sources: string[] = []

    if (sourceUrl) {
      sources = [sourceUrl]
    } else if (conceptSchemeSlug) {
      // Use the concept scheme from the slug to get the specific source
      const scheme =
        await this.datasetConfig.getConceptSchemeByKey(conceptSchemeSlug)
      if (scheme?.url) {
        sources = [scheme.url]
      } else {
        console.warn(`No concept scheme found for: ${conceptSchemeSlug}`)
        // Fallback to searching all schemes
        const allSchemes = await this.datasetConfig.getAllConceptSchemes()
        sources = allSchemes.map((s) => s.url)
      }
    } else {
      // No concept scheme specified, search all
      const allSchemes = await this.datasetConfig.getAllConceptSchemes()
      sources = allSchemes.map((s) => s.url)
    }

    if (!sources.length) {
      console.error(`No sources available to search for concept: ${slug}`)
      return null
    }

    const query = CONCEPT_QUERY

    try {
      // Try each source until we find the concept
      for (const source of sources) {
        const result = await this.rdfQuery.executeQuery({
          query,
          sources: [source],
        })

        if (!result.bindings.length) {
          continue
        }

        // Find the binding where the concept URI's last path segment matches the concept ID
        const binding = result.bindings.find((b) => {
          const conceptUri = b.get('concept')?.value ?? ''
          const lastSegment = conceptUri.split('/').pop() ?? ''
          return lastSegment === conceptId
        })

        if (!binding) {
          continue
        }

        const conceptUri = binding.get('concept')?.value ?? ''

        // Get all related concepts
        const broaderConcepts = await this.getRelatedConcepts(
          conceptUri,
          source,
          'broader',
        )
        const narrowerConcepts = await this.getRelatedConcepts(
          conceptUri,
          source,
          'narrower',
        )

        // Get scheme information
        const inSchemeUris = result.bindings
          .filter(
            (b) => b.get('concept')?.value === conceptUri && b.get('inScheme'),
          )
          .map((b) => b.get('inScheme')?.value)
          .filter((v, i, a) => v && a.indexOf(v) === i) as string[]

        const topConceptOfUris = result.bindings
          .filter(
            (b) =>
              b.get('concept')?.value === conceptUri && b.get('topConceptOf'),
          )
          .map((b) => b.get('topConceptOf')?.value)
          .filter((v, i, a) => v && a.indexOf(v) === i) as string[]

        const inScheme = await Promise.all(
          inSchemeUris.map((uri) => this.getSchemeInfo(uri, source)),
        )
        const topConceptOf = await Promise.all(
          topConceptOfUris.map((uri) => this.getSchemeInfo(uri, source)),
        )

        return {
          id: conceptId,
          uri: conceptUri,
          label: binding.get('label')?.value ?? conceptId,
          definition: binding.get('definition')?.value ?? '',
          notation: binding.get('notation')?.value ?? '',
          status: binding.get('status')?.value ?? '',
          dataset:
            inSchemeUris[0] ?? 'https://data.vlaanderen.be/id/dataset/codelist',
          inScheme: inScheme.filter((s) => s !== null) as ConceptScheme[],
          topConceptOf: topConceptOf.filter(
            (s) => s !== null,
          ) as ConceptScheme[],
          broader: broaderConcepts,
          narrower: narrowerConcepts,
          source: source,
        }
      }

      return null
    } catch (error) {
      console.error('Error fetching concept:', error)
      return null
    }
  }

  private async getRelatedConcepts(
    conceptUri: string,
    sourceUrl: string,
    relation: 'broader' | 'narrower',
  ): Promise<Concept[]> {
    const query = relatedConceptsQuery(conceptUri, relation)

    try {
      const result = await this.rdfQuery.executeQuery({
        query,
        sources: [sourceUrl],
      })

      return result.bindings.map((binding) => ({
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

  private async getSchemeInfo(
    schemeUri: string,
    sourceUrl: string,
  ): Promise<ConceptScheme | null> {
    const query = schemeQuery(schemeUri)

    try {
      const result = await this.rdfQuery.executeQuery({
        query,
        sources: [sourceUrl],
      })

      if (!result.bindings.length) {
        return null
      }

      const binding = result.bindings[0]
      const schemeId = schemeUri.split('/').pop() ?? ''

      return {
        id: schemeId,
        uri: schemeUri,
        label: binding.get('label')?.value ?? schemeId,
        definition: binding.get('definition')?.value,
        source: sourceUrl,
      }
    } catch (error) {
      console.error('Error fetching scheme info:', error)
      return null
    }
  }

  async getTopConcepts(
    schemeUri: string,
    sourceUrl: string,
  ): Promise<TopConcept[]> {
    const query = topConceptQuery(schemeUri)

    try {
      const result = await this.rdfQuery.executeQuery({
        query,
        sources: [sourceUrl],
      })

      return result.bindings.map((binding) => ({
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
}

export const useConceptSchemeService = () => {
  return new ConceptSchemeService()
}
