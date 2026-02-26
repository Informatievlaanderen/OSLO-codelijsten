import { Address } from '../types/company'
import { ns2 } from './namespaces'
import { ns } from '@oslo-flanders/core'
import type * as RDF from '@rdfjs/types'

export const literalFields = (
  address: Address,
): Array<{
  value: string | undefined
  predicate: RDF.NamedNode
  lang?: string
}> => {
  return [
    {
      value: address.streetNl,
      predicate: ns2.locn('thoroughfare'),
      lang: 'nl',
    },
    {
      value: address.streetFr,
      predicate: ns2.locn('thoroughfare'),
      lang: 'fr',
    },
    { value: address.houseNumber, predicate: ns.rdfs('label') },
    { value: address.box, predicate: ns2.adres('busnummer') },
    { value: address.zipcode, predicate: ns2.locn('postCode') },
    {
      value: address.municipalityNl,
      predicate: ns2.adres('Gemeentenaam'),
      lang: 'nl',
    },
    {
      value: address.municipalityFr,
      predicate: ns2.adres('Gemeentenaam'),
      lang: 'fr',
    },
    { value: address.countryNl, predicate: ns2.adres('land'), lang: 'nl' },
    { value: address.countryFr, predicate: ns2.adres('land'), lang: 'fr' },
  ]
}
