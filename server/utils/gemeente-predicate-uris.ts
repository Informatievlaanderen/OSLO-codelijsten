import type { GemeenteData } from '~/types/gemeente'

export const GEMEENTE_FIELD_URIS = {
  identificator: 'http://www.w3.org/ns/adms#identifier',
  gestructureerdeIdentificator:
    'https://data.vlaanderen.be/ns/generiek#gestructureerdeIdentificator',
  lokaleIdentificator:
    'https://data.vlaanderen.be/ns/generiek#lokaleIdentificator',
  naam: 'http://purl.org/dc/terms/title',
  officieleTaal: 'https://implementatie.data.vlaanderen.be/ns/adres#officieleTaal',
  faciliteitenTaal:
    'https://implementatie.data.vlaanderen.be/ns/adres#faciliteitenTaal',
  status: 'https://implementatie.data.vlaanderen.be/ns/adres#Gemeente.status',
} as const

export type { GemeenteData }
