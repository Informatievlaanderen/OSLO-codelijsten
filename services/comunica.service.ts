import { useRdfQuery } from '~/composables/useRdfQuery'
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

    const query = `
      PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX adms: <https://www.w3.org/ns/adms#>
      PREFIX dct: <http://purl.org/dc/terms/>

      SELECT ?scheme ?label ?definition ?status ?dataset WHERE {
        ?scheme a skos:ConceptScheme .
        OPTIONAL { ?scheme skos:prefLabel ?label . }
        OPTIONAL { ?scheme skos:definition ?definition . }
        OPTIONAL { ?scheme adms:status ?status . }
        OPTIONAL { ?scheme dct:isPartOf ?dataset . }
      }
    `

    try {
      const result = await this.rdfQuery.executeQuery({
        query,
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
        console.log('Using specific concept scheme source:', scheme.url)
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

    const query = `
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    PREFIX adms: <https://www.w3.org/ns/adms#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    SELECT ?concept ?label ?definition ?notation ?status ?inScheme ?topConceptOf ?broader ?narrower WHERE {
      ?concept a skos:Concept .
      OPTIONAL { ?concept skos:prefLabel ?label . }
      OPTIONAL { ?concept skos:definition ?definition . }
      OPTIONAL { ?concept skos:notation ?notation . }
      OPTIONAL { ?concept adms:status ?status . }
      OPTIONAL { ?concept skos:inScheme ?inScheme . }
      OPTIONAL { ?concept skos:topConceptOf ?topConceptOf . }
      OPTIONAL { ?concept skos:broader ?broader . }
      OPTIONAL { ?concept skos:narrower ?narrower . }
    }
  `

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
    const query = `
      PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

      SELECT ?label ?definition WHERE {
        <${schemeUri}> skos:prefLabel ?label .
        OPTIONAL { <${schemeUri}> skos:definition ?definition . }
      }
    `

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
    const query = `
      PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

      SELECT ?concept ?label ?definition ?notation WHERE {
        ?concept skos:topConceptOf <${schemeUri}> .
        OPTIONAL { ?concept skos:prefLabel ?label . }
        OPTIONAL { ?concept skos:definition ?definition . }
        OPTIONAL { ?concept skos:notation ?notation . }
      }
    `

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
