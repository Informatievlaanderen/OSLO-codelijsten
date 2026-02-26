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

export const LICENSE_QUERY = `
  PREFIX dct: <http://purl.org/dc/terms/>
  PREFIX cc: <https://creativecommons.org/ns#>
  PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
  PREFIX owl: <http://www.w3.org/2002/07/owl#>

  SELECT ?license ?title ?description ?type ?seeAlso ?requires ?versionInfo WHERE {
    ?license a dct:LicenseDocument .
    OPTIONAL { ?license dct:title ?title . }
    OPTIONAL { ?license dct:description ?description . }
    OPTIONAL { ?license dct:type ?type . }
    OPTIONAL { ?license rdfs:seeAlso ?seeAlso . }
    OPTIONAL { ?license cc:requires ?requires . }
    OPTIONAL { ?license owl:versionInfo ?versionInfo . }
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

export const ORGANIZATION_BY_ID_QUERY = (orgId: string) => `
  PREFIX dct: <http://purl.org/dc/terms/>
  PREFIX foaf: <http://xmlns.com/foaf/0.1/>
  PREFIX org: <http://www.w3.org/ns/org#>
  PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
  PREFIX adms: <http://www.w3.org/ns/adms#>
  PREFIX schema: <http://schema.org/>
  PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

  SELECT DISTINCT
    ?org ?identifier ?name ?altLabel ?description ?status ?issued ?valid ?homepage ?seeAlso
    ?identifierNode ?notation ?identifierCreator ?identifierSchemaAgency ?identifierIssued
    ?contactPoint ?isDefinedBy
  WHERE {
    ?org a org:Organization .
    {
      ?org dct:identifier "${orgId}" .
    }
    UNION
    {
      ?org adms:identifier ?identifierNodeMatch .
      ?identifierNodeMatch skos:notation "${orgId}" .
    }
    OPTIONAL { ?org dct:identifier ?identifier . }

    OPTIONAL { ?org skos:prefLabel ?name . }
    OPTIONAL { ?org foaf:name ?name . }
    OPTIONAL { ?org skos:altLabel ?altLabel . }
    OPTIONAL { ?org dct:description ?description . }
    OPTIONAL { ?org adms:status ?status . }
    OPTIONAL { ?org dct:issued ?issued . }
    OPTIONAL { ?org rdfs:seeAlso ?seeAlso . }
    OPTIONAL { ?org dct:valid ?valid . }
    OPTIONAL { ?org foaf:homepage ?homepage . }

    OPTIONAL {
      ?org adms:identifier ?identifierNode .
      OPTIONAL { ?identifierNode skos:notation ?notation . }
      OPTIONAL { ?identifierNode dct:creator ?identifierCreator . }
      OPTIONAL { ?identifierNode adms:schemaAgency ?identifierSchemaAgency . }
      OPTIONAL { ?identifierNode dct:issued ?identifierIssued . }
    }

    OPTIONAL { ?org schema:contactPoint ?contactPoint . }
    OPTIONAL { ?org rdfs:isDefinedBy ?isDefinedBy . }
  }
  LIMIT 1
`

export const KBO_BY_ID_QUERY = (kboId: string) => `
  PREFIX dct: <http://purl.org/dc/terms/>
  PREFIX foaf: <http://xmlns.com/foaf/0.1/>
  PREFIX org: <http://www.w3.org/ns/org#>
  PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
  PREFIX adms: <http://www.w3.org/ns/adms#>
  PREFIX schema: <http://schema.org/>
  PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
  PREFIX vcard: <http://www.w3.org/2006/vcard/ns#>

  SELECT DISTINCT
    ?organization ?identifier ?name ?altLabel ?description ?status ?issued ?valid ?homepage
    ?contactPoint ?email ?telephone ?address ?legalForm ?activityDescription
  WHERE {
    ?organization a org:Organization .
    {
      ?organization dct:identifier "${kboId}" .
    }
    UNION
    {
      ?organization adms:identifier ?identifierNodeMatch .
      ?identifierNodeMatch skos:notation "${kboId}" .
    }

    OPTIONAL { ?organization dct:identifier ?identifier . }
    OPTIONAL { ?organization skos:prefLabel ?name . }
    OPTIONAL { ?organization foaf:name ?name . }
    OPTIONAL { ?organization skos:altLabel ?altLabel . }
    OPTIONAL { ?organization dct:description ?description . }
    OPTIONAL { ?organization adms:status ?status . }
    OPTIONAL { ?organization dct:issued ?issued . }
    OPTIONAL { ?organization dct:valid ?valid . }
    OPTIONAL { ?organization foaf:homepage ?homepage . }
    OPTIONAL { ?organization org:legalForm ?legalForm . }
    OPTIONAL { ?organization dct:description ?activityDescription . }

    OPTIONAL { ?organization schema:contactPoint ?contactPoint . }
    OPTIONAL { ?contactPoint schema:email ?email . }
    OPTIONAL { ?contactPoint schema:telephone ?telephone . }
    OPTIONAL { ?contactPoint vcard:hasAddress ?address . }
  }
  LIMIT 1
`

export const CONTACT_POINTS_QUERY = (orgUri: string) => `
  PREFIX schema: <http://schema.org/>
  PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

  SELECT ?contactPoint ?label ?email ?telephone ?faxNumber ?url WHERE {
    <${orgUri}> schema:contactPoint ?contactPoint .
    OPTIONAL { ?contactPoint rdfs:label ?label . }
    OPTIONAL { ?contactPoint schema:email ?email . }
    OPTIONAL { ?contactPoint schema:telephone ?telephone . }
    OPTIONAL { ?contactPoint schema:faxNumber ?faxNumber . }
    OPTIONAL { ?contactPoint schema:url ?url . }
  }
`

export const LICENSE_BY_ID_QUERY = (licenseId: string) => `
  PREFIX dct: <http://purl.org/dc/terms/>
  PREFIX cc: <https://creativecommons.org/ns#>
  PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
  PREFIX owl: <http://www.w3.org/2002/07/owl#>

  SELECT ?license ?title ?description ?type ?seeAlso ?requires ?versionInfo WHERE {
    ?license a dct:LicenseDocument .
    FILTER(CONTAINS(STR(?license), "${licenseId}"))
    OPTIONAL { ?license dct:title ?title . }
    OPTIONAL { ?license dct:description ?description . }
    OPTIONAL { ?license dct:type ?type . }
    OPTIONAL { ?license rdfs:seeAlso ?seeAlso . }
    OPTIONAL { ?license cc:requires ?requires . }
    OPTIONAL { ?license owl:versionInfo ?versionInfo . }
  }
`

export const TTL = '.ttl'

export const SUPPORTED_FORMATS: { [key: string]: string } = {
  ttl: 'text/turtle',
  jsonld: 'application/ld+json',
  nt: 'application/n-triples',
}

export const SUPPORTED_EXTENSIONS = ['.ttl', '.jsonld', '.nt']
