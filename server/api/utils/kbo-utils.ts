import {
  JURIDICAL_FORM_TTL,
  JURIDICAL_SITUATION_TTL,
  ORGANISATIE_TYPE_TTL,
} from '~/constants/constants'

export function clean(val: string | undefined | null): string | undefined {
  if (!val || !val.trim()) return undefined
  return val.trim()
}

export function cleanDate(val: string | undefined | null): string | undefined {
  const c = clean(val)
  if (!c || c.startsWith('1900-01-01')) return undefined
  return new Date(c).toLocaleDateString('be-NL')
}

export function buildNaceUri(
  code: string | undefined,
  version: string | undefined,
): string | undefined {
  const c = clean(code)
  const v = clean(version)
  if (!c || !v) return undefined
  const vocabPath = v === '2025' ? 'nace2025' : 'nace2008'
  return `https://vocab.belgif.be/auth/${vocabPath}/${c}`
}

let juridicalFormCache: Map<string, string> | null = null

async function getJuridicalFormMap(): Promise<Map<string, string>> {
  if (juridicalFormCache) return juridicalFormCache

  const res = await fetch(JURIDICAL_FORM_TTL)
  const ttl = await res.text()

  const map = new Map<string, string>()
  // Match each concept URI with its prefLabel
  const conceptRegex =
    /<(https:\/\/data\.vlaanderen\.be\/id\/concept\/JuridicalForm\/[^>]+)>[^]*?skos:prefLabel\s+"([^"]+)"@nl/g
  let match
  while ((match = conceptRegex.exec(ttl)) !== null) {
    const uri = match[1]
    const label = match[2]
    map.set(label.toLowerCase(), uri)
  }

  juridicalFormCache = map
  return map
}

let juridicalSituationCache: Map<string, string> | null = null

async function getJuridicalSituationMap(): Promise<Map<string, string>> {
  if (juridicalSituationCache) return juridicalSituationCache

  const res = await fetch(JURIDICAL_SITUATION_TTL)
  const ttl = await res.text()

  const map = new Map<string, string>()
  const conceptRegex =
    /<(https:\/\/data\.vlaanderen\.be\/id\/concept\/JuridicalSituation\/[^>]+)>[^]*?skos:prefLabel\s+"([^"]+)"@nl/g
  let match
  while ((match = conceptRegex.exec(ttl)) !== null) {
    const uri = match[1]
    const label = match[2]
    map.set(label.toLowerCase(), uri)
  }

  juridicalSituationCache = map
  return map
}

let organisationTypeCache: Map<string, string> | null = null

async function getOrganisationTypeMap(): Promise<Map<string, string>> {
  if (organisationTypeCache) return organisationTypeCache

  const res = await fetch(ORGANISATIE_TYPE_TTL)
  const ttl = await res.text()

  const map = new Map<string, string>()
  const conceptRegex =
    /<(https:\/\/data\.vlaanderen\.be\/id\/concept\/TypeOfEnterprise\/[^>]+)>[^]*?skos:prefLabel\s+"([^"]+)"@nl/g
  let match
  while ((match = conceptRegex.exec(ttl)) !== null) {
    const uri = match[1]
    const label = match[2]
    map.set(label.toLowerCase(), uri)
  }

  organisationTypeCache = map
  return map
}

export async function buildJuridicalSituationUri(
  label: string | undefined,
): Promise<{ uri: string; label: string } | undefined> {
  const c = clean(label)
  if (!c) return undefined
  const map = await getJuridicalSituationMap()
  const uri = map.get(c.toLowerCase())
  if (!uri) return undefined
  return { uri, label: c }
}

export async function buildJuridicalFormUri(
  label: string | undefined,
): Promise<{ uri: string; label: string } | undefined> {
  const c = clean(label)
  if (!c) return undefined
  const map = await getJuridicalFormMap()
  const uri = map.get(c.toLowerCase())
  if (!uri) return undefined
  return { uri, label: c }
}

export async function buildOrganisationTypeUri(
  label: string | undefined,
): Promise<{ uri: string; label: string } | undefined> {
  const c = clean(label)
  if (!c) return undefined
  const map = await getOrganisationTypeMap()
  const uri = map.get(c.toLowerCase())
  if (!uri) return undefined
  return { uri, label: c }
}
