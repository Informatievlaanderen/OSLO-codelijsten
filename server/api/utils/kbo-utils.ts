import {
  DOORHALINGS_REDEN_TTL,
  DOORHALINGS_TYPE_TTL,
  RECHTSVORMTYPE_TTL,
  RECHTSTOESTANDTYPE_TTL,
  RECHTSPERSOONLIJKHEIDTYPE_TTL,
  ORGANISATIESTATUS_TTL,
  PERSONEELSKLASSE_TTL,
  RAPPORTTYPE_TTL,
  STOPZETTINGTYPE_TTL,
} from '~/constants/constants'
import type { KboConcept } from '~/types/KBO'

export function clean(val: string | undefined | null): string | undefined {
  if (!val || !val.trim()) return undefined
  return val.trim()
}

export function cleanDate(val: string | undefined | null): string | undefined {
  const c = clean(val)
  if (!c || c.startsWith('1900-01-01')) return undefined
  if (!c || c.startsWith('9999-12-31')) return undefined
  return new Date(c).toISOString().split('T')[0]
}

export function buildNaceUri(
  code: string | undefined,
  version: string | undefined,
): string | undefined {
  const c = clean(code)
  const v = clean(version)
  if (!c || !v) return undefined
  const vocabPath = v === '2025' ? 'nace2025' : 'nace2008'
  return `http://vocab.belgif.be/auth/${vocabPath}/${c}`
}

let juridicalFormCache: Map<string, string> | null = null

async function getJuridicalFormMap(): Promise<Map<string, string>> {
  if (juridicalFormCache) return juridicalFormCache

  const res = await fetch(RECHTSVORMTYPE_TTL)
  const ttl = await res.text()

  const map = new Map<string, string>()
  // Match each concept URI with its prefLabel
  const conceptRegex =
    /<(https:\/\/data\.vlaanderen\.be\/id\/concept\/Rechtsvormtype\/v1\/[^>]+)>[^]*?skos:prefLabel\s+"([^"]+)"@nl/g
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

  const res = await fetch(RECHTSTOESTANDTYPE_TTL)
  const ttl = await res.text()

  const map = new Map<string, string>()
  const conceptRegex =
    /<(https:\/\/data\.vlaanderen\.be\/id\/concept\/Rechtstoestandtype\/v1\/[^>]+)>[^]*?skos:prefLabel\s+"([^"]+)"@nl/g
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

  const res = await fetch(RECHTSPERSOONLIJKHEIDTYPE_TTL)
  const ttl = await res.text()

  const map = new Map<string, string>()
  const conceptRegex =
    /<(https:\/\/data\.vlaanderen\.be\/id\/concept\/Rechtspersoonlijkheidtype\/v1\/[^>]+)>[^]*?skos:prefLabel\s+"([^"]+)"@nl/g
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
): Promise<KboConcept | undefined> {
  const c = clean(label)
  if (!c) return undefined
  const map = await getJuridicalSituationMap()
  const uri = map.get(c.toLowerCase())
  if (!uri) return undefined
  return { uri, label: c }
}

export async function buildJuridicalFormUri(
  label: string | undefined,
): Promise<KboConcept | undefined> {
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

let doorhalingsTypeCache: Map<string, string> | null = null

async function getDoorhalingsTypeMap(): Promise<Map<string, string>> {
  if (doorhalingsTypeCache) return doorhalingsTypeCache

  const res = await fetch(DOORHALINGS_TYPE_TTL)
  const ttl = await res.text()

  const map = new Map<string, string>()
  const conceptRegex =
    /<(https:\/\/data\.vlaanderen\.be\/id\/concept\/Doorhalingstype\/v1\/[^>]+)>[^]*?skos:prefLabel\s+"([^"]+)"/g
  let match
  while ((match = conceptRegex.exec(ttl)) !== null) {
    const uri = match[1]
    const label = match[2]
    map.set(label.toLowerCase(), uri)
  }

  doorhalingsTypeCache = map
  return map
}

export async function buildDoorhalingsTypeUri(
  label: string | undefined,
): Promise<KboConcept | undefined> {
  const c = clean(label)
  if (!c) return undefined
  const map = await getDoorhalingsTypeMap()
  const uri = map.get(c.toLowerCase())
  if (!uri) return undefined
  return { uri, label: c }
}

let doorhalingsRedenCache: Map<string, string> | null = null

async function getDoorhalingsRedenMap(): Promise<Map<string, string>> {
  if (doorhalingsRedenCache) return doorhalingsRedenCache

  const res = await fetch(DOORHALINGS_REDEN_TTL)
  const ttl = await res.text()

  const map = new Map<string, string>()
  const conceptRegex =
    /<(https:\/\/data\.vlaanderen\.be\/id\/concept\/RedenDoorhaling\/v1\/[^>]+)>[^]*?skos:prefLabel\s+"([^"]+)"/g
  let match
  while ((match = conceptRegex.exec(ttl)) !== null) {
    const uri = match[1]
    const label = match[2]
    map.set(label.toLowerCase(), uri)
  }

  doorhalingsRedenCache = map
  return map
}

export async function buildDoorhalingsRedenUri(
  label: string | undefined,
): Promise<KboConcept | undefined> {
  const c = clean(label)
  if (!c) return undefined
  const map = await getDoorhalingsRedenMap()
  const uri = map.get(c.toLowerCase())
  if (!uri) return undefined
  return { uri, label: c }
}

let organisatieStatusCache: Map<string, string> | null = null

async function getOrganisatieStatusMap(): Promise<Map<string, string>> {
  if (organisatieStatusCache) return organisatieStatusCache

  const res = await fetch(ORGANISATIESTATUS_TTL)
  const ttl = await res.text()

  const map = new Map<string, string>()
  const conceptRegex =
    /<(https:\/\/data\.vlaanderen\.be\/id\/concept\/OrganisatieStatus\/v1\/[^>]+)>[^]*?skos:prefLabel\s+"([^"]+)"/g
  let match
  while ((match = conceptRegex.exec(ttl)) !== null) {
    const uri = match[1]
    const label = match[2]
    map.set(label.toLowerCase(), uri)
  }

  organisatieStatusCache = map
  return map
}

export async function buildOrganisatieStatusUri(
  label: string | undefined,
): Promise<KboConcept | undefined> {
  const c = clean(label)
  if (!c) return undefined
  const map = await getOrganisatieStatusMap()
  const uri = map.get(c.toLowerCase())
  if (!uri) return undefined
  return { uri, label: c }
}

let personeelsklasseCache: Map<string, string> | null = null

async function getPersoneelsklasseMap(): Promise<Map<string, string>> {
  if (personeelsklasseCache) return personeelsklasseCache

  const res = await fetch(PERSONEELSKLASSE_TTL)
  const ttl = await res.text()

  const map = new Map<string, string>()
  const conceptRegex =
    /<(https:\/\/data\.vlaanderen\.be\/id\/concept\/RSZ-Personeelsklasse\/v1\/[^>]+)>[^]*?skos:prefLabel\s+"([^"]+)"/g
  let match
  while ((match = conceptRegex.exec(ttl)) !== null) {
    const uri = match[1]
    const label = match[2]
    map.set(label.toLowerCase(), uri)
  }

  personeelsklasseCache = map
  return map
}

export async function buildPersoneelsklasseUri(
  label: string | undefined,
): Promise<KboConcept | undefined> {
  const c = clean(label)
  if (!c) return undefined
  const map = await getPersoneelsklasseMap()
  const uri = map.get(c.toLowerCase())
  if (!uri) return undefined
  return { uri, label: c }
}

let rapportTypeCache: Map<string, string> | null = null

async function getRapportTypeMap(): Promise<Map<string, string>> {
  if (rapportTypeCache) return rapportTypeCache

  const res = await fetch(RAPPORTTYPE_TTL)
  const ttl = await res.text()

  const map = new Map<string, string>()
  const conceptRegex =
    /<(https:\/\/data\.vlaanderen\.be\/id\/concept\/RapportType\/v1\/[^>]+)>[^]*?skos:prefLabel\s+"([^"]+)"/g
  let match
  while ((match = conceptRegex.exec(ttl)) !== null) {
    const uri = match[1]
    const label = match[2]
    map.set(label.toLowerCase(), uri)
  }

  rapportTypeCache = map
  return map
}

export async function buildRapportTypeUri(
  label: string | undefined,
): Promise<KboConcept | undefined> {
  const c = clean(label)
  if (!c) return undefined
  const map = await getRapportTypeMap()
  const uri = map.get(c.toLowerCase())
  if (!uri) return undefined
  return { uri, label: c }
}

let stopzettingTypeCache: Map<string, string> | null = null

async function getStopzettingTypeMap(): Promise<Map<string, string>> {
  if (stopzettingTypeCache) return stopzettingTypeCache

  const res = await fetch(STOPZETTINGTYPE_TTL)
  const ttl = await res.text()

  const map = new Map<string, string>()
  const conceptRegex =
    /<(https:\/\/data\.vlaanderen\.be\/id\/concept\/StopzettingType\/v1\/[^>]+)>[^]*?skos:prefLabel\s+"([^"]+)"/g
  let match
  while ((match = conceptRegex.exec(ttl)) !== null) {
    const uri = match[1]
    const label = match[2]
    map.set(label.toLowerCase(), uri)
  }

  stopzettingTypeCache = map
  return map
}

export async function buildStopzettingTypeUri(
  label: string | undefined,
): Promise<KboConcept | undefined> {
  const c = clean(label)
  if (!c) return undefined
  const map = await getStopzettingTypeMap()
  const uri = map.get(c.toLowerCase())
  if (!uri) return undefined
  return { uri, label: c }
}
