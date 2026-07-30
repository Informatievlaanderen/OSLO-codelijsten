export const BEDRIJVENTERREIN_URI_BASE = 'https://bedrijventerrein.vlaanderen.be/id/bedrijventerrein/'
export const BEDRIJVENTERREINPERCEEL_URI_BASE = 'https://bedrijventerrein.vlaanderen.be/id/bedrijventerreinperceel/'
export const BEHEERDEBEDRIJVENZONE_URI_BASE = 'https://bedrijventerrein.vlaanderen.be/id/beheerdebedrijvenzone/'
export const OVO_VLAIO = "OVO000039"

export const BEDRIJVENTERREIN_BY_ID_QUERY = (id: string) => `
  PREFIX bt: <https://data.vlaanderen.be/ns/bedrijventerrein#>
  PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
  PREFIX adms: <http://www.w3.org/ns/adms#>
  PREFIX perceel: <https://data.vlaanderen.be/ns/perceel#>
  PREFIX dct: <http://purl.org/dc/terms/>

  SELECT DISTINCT ?subject ?name ?altLabel ?beschikbareKavels ?beschikbareOppervlakte ?oppervlakte ?geometrie ?identifier ?type ?geldigheidsperiode ?perceelUri
  WHERE {
    ?subject a bt:Bedrijventerrein .
    FILTER(STRENDS(STR(?subject), "${id}"))
    OPTIONAL { ?subject skos:prefLabel ?name . }
    OPTIONAL { ?subject skos:altLabel ?altLabel . }
    OPTIONAL { ?subject bt:beschikbareKavels ?beschikbareKavels . }
    OPTIONAL { ?subject bt:beschikbareOppervlakte ?beschikbareOppervlakte . }
    OPTIONAL { ?subject perceel:oppervlakte ?oppervlakte . }
    OPTIONAL { ?subject perceel:geometrie ?geometrie . }
    OPTIONAL { ?subject adms:identifier ?identifier . }
    OPTIONAL { ?subject perceel:RuimtelijkeEenheid.type ?type . }
    OPTIONAL { ?subject perceel:geldigheidsperiode ?geldigheidsperiode . }
    OPTIONAL { ?subject dct:hasPart ?perceelUri . }
  }
`

export const BEDRIJVENTERREIN_LIST_QUERY = `
  PREFIX bt: <https://data.vlaanderen.be/ns/bedrijventerrein#>
  PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

  SELECT ?subject ?name WHERE {
    ?subject a bt:Bedrijventerrein .
    OPTIONAL { ?subject skos:prefLabel ?name . }
  }
  ORDER BY ?name
`

export const BEDRIJVENTERREINPERCEEL_BY_ID_QUERY = (id: string) => `
  PREFIX bt: <https://data.vlaanderen.be/ns/bedrijventerrein#>
  PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
  PREFIX adms: <http://www.w3.org/ns/adms#>
  PREFIX perceel: <https://data.vlaanderen.be/ns/perceel#>
  PREFIX dct: <http://purl.org/dc/terms/>

  SELECT DISTINCT ?subject ?homepageAanbieding ?bebouwing ?beschikbaarheid ?inGebruik ?aanbieder ?beperking ?functie ?geometrie ?identifier ?oppervlakte ?type ?geldigheidsperiode ?isPartOf ?beheerdeBedrijvenzone
  WHERE {
    ?subject a bt:Bedrijventerreinperceel .
    FILTER(STRENDS(STR(?subject), "${id}"))
    OPTIONAL { ?subject bt:homepageAanbieding ?homepageAanbieding . }
    OPTIONAL { ?subject bt:bebouwing ?bebouwing . }
    OPTIONAL { ?subject bt:beschikbaarheid ?beschikbaarheid . }
    OPTIONAL { ?subject bt:inGebruik ?inGebruik . }
    OPTIONAL { ?subject bt:aanbieder ?aanbieder . }
    OPTIONAL { ?subject bt:beperking ?beperking . }
    OPTIONAL { ?subject bt:functie ?functie . }
    OPTIONAL { ?subject perceel:geometrie ?geometrie . }
    OPTIONAL { ?subject adms:identifier ?identifier . }
    OPTIONAL { ?subject perceel:oppervlakte ?oppervlakte . }
    OPTIONAL { ?subject perceel:RuimtelijkeEenheid.type ?type . }
    OPTIONAL { ?subject perceel:geldigheidsperiode ?geldigheidsperiode . }
    OPTIONAL { ?subject dct:isPartOf ?isPartOf . }
    OPTIONAL { ?subject dct:relation ?beheerdeBedrijvenzone . }
  }
`

export const BEDRIJVENTERREINPERCEEL_LIST_QUERY = `
  PREFIX bt: <https://data.vlaanderen.be/ns/bedrijventerrein#>

  SELECT ?subject WHERE {
    ?subject a bt:Bedrijventerreinperceel .
  }
`

export const BEHEERDEBEDRIJVENZONE_BY_ID_QUERY = (id: string) => `
  PREFIX bt: <https://data.vlaanderen.be/ns/bedrijventerrein#>
  PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
  PREFIX adms: <http://www.w3.org/ns/adms#>
  PREFIX perceel: <https://data.vlaanderen.be/ns/perceel#>
  PREFIX dct: <http://purl.org/dc/terms/>

  SELECT DISTINCT ?subject ?name ?aanspreekpunt ?juridischeHandhaver ?digitalebeheerder ?identifier ?oppervlakte ?geometrie ?type ?geldigheidsperiode ?isPartOf ?perceelUri
  WHERE {
    ?subject a bt:BeheerdeBedrijvenzone .
    FILTER(STRENDS(STR(?subject), "${id}"))
    OPTIONAL { ?subject skos:prefLabel ?name . }
    OPTIONAL { ?subject bt:aanspreekpunt ?aanspreekpunt . }
    OPTIONAL { ?subject bt:juridischeHandhaver ?juridischeHandhaver . }
    OPTIONAL { ?subject bt:digitalebeheerder ?digitalebeheerder . }
    OPTIONAL { ?subject adms:identifier ?identifier . }
    OPTIONAL { ?subject perceel:oppervlakte ?oppervlakte . }
    OPTIONAL { ?subject perceel:geometrie ?geometrie . }
    OPTIONAL { ?subject perceel:RuimtelijkeEenheid.type ?type . }
    OPTIONAL { ?subject perceel:geldigheidsperiode ?geldigheidsperiode . }
    OPTIONAL { ?subject dct:isPartOf ?isPartOf . }
    OPTIONAL { ?subject dct:relation ?perceelUri . }
  }
`

export const BEHEERDEBEDRIJVENZONE_LIST_QUERY = `
  PREFIX bt: <https://data.vlaanderen.be/ns/bedrijventerrein#>
  PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

  SELECT ?subject ?name WHERE {
    ?subject a bt:BeheerdeBedrijvenzone .
    OPTIONAL { ?subject skos:prefLabel ?name . }
  }
  ORDER BY ?name
`

export const CONCEPT_LABEL_QUERY = (uri: string) => `
  PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
  PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

  SELECT ?label WHERE {
    <${uri}> skos:prefLabel|rdfs:label ?label .
  }
  LIMIT 1
`

export const BEDRIJVENTERREIN_HAS_PARTS_QUERY = (uri: string) => `
  PREFIX dct: <http://purl.org/dc/terms/>
  PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

  SELECT ?perceel ?label WHERE {
    <${uri}> dct:hasPart ?perceel .
    OPTIONAL { ?perceel skos:prefLabel ?label . }
  }
`

export const BEHEERDEBEDRIJVENZONE_HAS_PARTS_QUERY = (uri: string) => `
  PREFIX dct: <http://purl.org/dc/terms/>
  PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

  SELECT ?perceel ?label WHERE {
    <${uri}> dct:relation ?perceel .
    OPTIONAL { ?perceel skos:prefLabel ?label . }
  }
`
