export const KBO_FIELD_URIS = {
  type: 'http://www.w3.org/ns/regorg#orgType',
  wettelijkeNaam: 'http://www.w3.org/ns/regorg#legalName',
  voorkeursnaam: 'http://www.w3.org/2004/02/skos/core#prefLabel',
  alternatieveNaam: 'http://www.w3.org/2004/02/skos/core#altLabel',
  rechtsvorm: 'https://data.vlaanderen.be/ns/organisatie#rechtsvorm',
  rechtstoestand: 'https://data.vlaanderen.be/ns/organisatie#rechtstoestand',
  activiteit: 'http://www.w3.org/ns/regorg#orgActivity',
  identificator: 'http://www.w3.org/ns/regorg#registration',
  toegekendOp: 'http://purl.org/dc/terms/issued',
  oprichting: 'http://purl.org/dc/terms/date',
  stopzetting: 'http://purl.org/dc/terms/date',
  parentOrganisatie: 'http://www.w3.org/ns/org#siteOf',
} as const
