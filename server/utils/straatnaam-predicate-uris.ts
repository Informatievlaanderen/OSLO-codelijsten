export const STRAATNAAM_FIELD_URIS = {
  straatnaam: 'http://www.w3.org/2000/01/rdf-schema#label',
  identificator: 'http://www.w3.org/ns/adms#identifier',
  gestructureerdeIdentificator:
    'https://data.vlaanderen.be/ns/generiek#gestructureerdeIdentificator',
  lokaleIdentificator:
    'https://data.vlaanderen.be/ns/generiek#lokaleIdentificator',
  homoniemToevoeging: 'https://data.vlaanderen.be/ns/adres#homoniemToevoeging',
  status: 'https://data.vlaanderen.be/ns/adres#Straatnaam.status',
  isToegekendDoor: 'http://www.w3.org/ns/prov#wasAttributedTo',
} as const
