export const ALL = 'All'
export const ITEMS_PER_PAGE = 20
export const FLANDERS_COLOR = '#FFED00'
export const EXTERNAL_COLOR = '#d62728'
export const BASEPATH = '/standaarden'
export const CODELIST_ROOT = 'https://data.vlaanderen.be/id/concept/Domein/'

export const CONCEPT_SCHEME_QUERY = `
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
      }`

export const CONCEPT_QUERY = `
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

export const topConceptQuery = (schemeUri: string) => `
      PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

      SELECT ?concept ?label ?definition ?notation WHERE {
        ?concept skos:topConceptOf <${schemeUri}> .
        OPTIONAL { ?concept skos:prefLabel ?label . }
        OPTIONAL { ?concept skos:definition ?definition . }
        OPTIONAL { ?concept skos:notation ?notation . }
      }
    `

export const relatedConceptsQuery = (
  conceptUri: string,
  relation: 'broader' | 'narrower',
) => `
      PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

      SELECT ?relatedConcept ?label ?definition ?notation WHERE {
        <${conceptUri}> skos:${relation} ?relatedConcept .
        OPTIONAL { ?relatedConcept skos:prefLabel ?label . }
        OPTIONAL { ?relatedConcept skos:definition ?definition . }
        OPTIONAL { ?relatedConcept skos:notation ?notation . }
      }
    `

export const schemeQuery = (schemeUri: string) => `
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

    SELECT ?label ?definition WHERE {
      <${schemeUri}> skos:prefLabel ?label .
      OPTIONAL { <${schemeUri}> skos:definition ?definition . }
    }
  `

export const TEXT_TURTLE = 'text/turtle'
export const TTL = '.ttl'
