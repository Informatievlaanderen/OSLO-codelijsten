import type { GebouwData } from '~/types/gebouw'

export const GEBOUW_FIELD_URIS = {
  identificator: 'http://www.w3.org/ns/adms#identifier',
  gestructureerdeIdentificator:
    'https://data.vlaanderen.be/ns/generiek#gestructureerdeIdentificator',
  lokaleIdentificator:
    'https://data.vlaanderen.be/ns/generiek#lokaleIdentificator',
  geometrie: 'https://data.vlaanderen.be/ns/gebouw#2DGebouwgeometrie',
  methode: 'https://data.vlaanderen.be/ns/generiek#methode',
  specificatie: 'https://data.vlaanderen.be/ns/generiek#specificatie',
  status: 'https://data.vlaanderen.be/ns/gebouw#Gebouw.status',
  bestaatUit: 'https://data.vlaanderen.be/ns/gebouw#bestaatUit',
  ligtOp: 'https://data.vlaanderen.be/ns/gebouw#ligtOp',
} as const

export type { GebouwData }
