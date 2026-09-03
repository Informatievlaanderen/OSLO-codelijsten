import type { PerceelData } from '~/types/perceel'

export const PERCEEL_FIELD_URIS = {
  identificator: 'http://www.w3.org/ns/adms#identifier',
  gestructureerdeIdentificator:
    'https://data.vlaanderen.be/ns/generiek#gestructureerdeIdentificator',
  lokaleIdentificator:
    'https://data.vlaanderen.be/ns/generiek#lokaleIdentificator',
  status: 'https://implementatie.data.vlaanderen.be/ns/perceel#status',
  adressen: 'https://implementatie.data.vlaanderen.be/ns/gebouw#toegekendAdres',
} as const

export type { PerceelData }
