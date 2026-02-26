import type * as RDF from '@rdfjs/types'

const LANGUAGE_MAP: Record<string, string> = {
  '1': 'fr',
  '2': 'nl',
  '3': 'de',
  '4': 'en',
  FR: 'fr',
  NL: 'nl',
  DE: 'de',
}

export const mapLanguage = (code: string): string | undefined => {
  return LANGUAGE_MAP[code]
}

export const quadSort = (quadA: RDF.Quad, quadB: RDF.Quad): number => {
  if (quadA.subject.termType === quadB.subject.termType) {
    return quadA.subject.value.localeCompare(quadB.subject.value)
  }
  return quadA.subject.termType === 'BlankNode' ? 1 : -1
}
