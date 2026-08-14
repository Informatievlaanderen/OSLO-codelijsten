export const POSTINFO_FIELD_URIS = {
  postcode: 'https://data.vlaanderen.be/ns/adres#postcode',
  postnaam: 'https://data.vlaanderen.be/ns/adres#postnaam',
  identificator: 'http://www.w3.org/ns/adms#identifier',
  gestructureerdeIdentificator:
    'https://data.vlaanderen.be/ns/generiek#gestructureerdeIdentificator',
  lokaleIdentificator:
    'https://data.vlaanderen.be/ns/generiek#lokaleIdentificator',
  status: 'https://implementatie.data.vlaanderen.be/ns/adres#Postinfo.status',
  isToegekendAan: 'http://www.w3.org/ns/prov#wasAttributedTo',
  nuts3: 'https://implementatie.data.vlaanderen.be/ns/adres#nuts3',
} as const
