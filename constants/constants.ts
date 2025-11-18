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
