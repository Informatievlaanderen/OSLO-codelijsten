import type { AdresData } from '~/types/adres'

export const ADRES_FIELD_URIS = {
  volledigAdres: 'https://data.vlaanderen.be/ns/adres#volledigAdres',
  huisnummer: 'https://data.vlaanderen.be/ns/adres#huisnummer',
  straatnaam: 'https://data.vlaanderen.be/ns/adres#heeftStraatnaam',
  postinfo: 'https://data.vlaanderen.be/ns/adres#heeftPostinfo',
  gemeentenaam: 'https://data.vlaanderen.be/ns/adres#heeftGemeentenaam',
  status: 'https://data.vlaanderen.be/ns/adres#Adres.status',
  officieelToegekend:
    'https://data.vlaanderen.be/ns/adres#officieelToegekend',
  identificator: 'http://www.w3.org/ns/adms#identifier',
  gestructureerdeIdentificator:
    'https://data.vlaanderen.be/ns/generiek#gestructureerdeIdentificator',
  lokaleIdentificator:
    'https://data.vlaanderen.be/ns/generiek#lokaleIdentificator',
  positie: 'https://data.vlaanderen.be/ns/adres#positie',
  methode: 'https://data.vlaanderen.be/ns/generiek#methode',
  specificatie: 'https://data.vlaanderen.be/ns/generiek#specificatie',
} as const

export type { AdresData }
