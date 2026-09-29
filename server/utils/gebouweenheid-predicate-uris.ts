import type { GebouweenheidData } from '~/types/gebouweenheid'

export const GEBOUWEENHEID_FIELD_URIS = {
  identificator: 'http://www.w3.org/ns/adms#identifier',
  gestructureerdeIdentificator:
    'https://data.vlaanderen.be/ns/generiek#gestructureerdeIdentificator',
  lokaleIdentificator:
    'https://data.vlaanderen.be/ns/generiek#lokaleIdentificator',
  status: 'https://implementatie.data.vlaanderen.be/ns/gebouw#Gebouweenheid.status',
  functie: 'https://implementatie.data.vlaanderen.be/ns/gebouw#Gebouweenheid.functie',
  isDeelVan: 'http://purl.org/dc/terms/isPartOf',
  positie: 'https://data.vlaanderen.be/ns/adres#positie',
  methode: 'https://data.vlaanderen.be/ns/generiek#methode',
  toegekendAdres: 'https://implementatie.data.vlaanderen.be/ns/gebouw#toegekendAdres',
  afwijkingVastgesteld: 'https://implementatie.data.vlaanderen.be/ns/gebouw#afwijkingVastgesteld',
} as const

export type { GebouweenheidData }
