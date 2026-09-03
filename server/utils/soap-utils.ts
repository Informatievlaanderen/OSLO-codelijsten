import { cleanDate } from './kbo-utils'

/**
 * Extract a plain string value from a SOAP response object.
 * Handles plain strings, `{ _: 'value' }`, and `{ $value: 'value' }` formats.
 */
export const getNaam = (obj: any): string | undefined => {
  if (!obj) return undefined
  if (typeof obj === 'string') return obj.trim() || undefined
  if (obj._) return String(obj._).trim() || undefined
  if (obj.$value) return String(obj.$value).trim() || undefined
  return undefined
}

/**
 * Extract a date string from a SOAP value (handles both plain strings and `{ _: 'value' }`).
 * Returns undefined for placeholder dates (1900-01-01, 9999-12-31).
 */
export const getDate = (obj: any): string | undefined => {
  return cleanDate(getNaam(obj))
}

/**
 * Extract a code from a SOAP type like `{ Code: { _: 'value' } }` or `{ Code: { $value: '2' } }`.
 */
export const getCode = (obj: any): string | undefined => {
  if (!obj) return undefined
  if (typeof obj === 'string') return obj
  if (obj.Code?._) return obj.Code._
  if (obj.Code?.$value) return String(obj.Code.$value)
  if (obj.Code) return typeof obj.Code === 'string' ? obj.Code : undefined
  return undefined
}

/**
 * Extract the description/omschrijving from a SOAP type.
 * Handles `{ Code: { attributes: { Beschrijving: 'text' } } }` and `{ Omschrijving: 'text' }`.
 */
export const getOmschrijving = (obj: any): string | undefined => {
  if (!obj) return undefined
  if (obj.Omschrijving) return obj.Omschrijving
  if (obj.Code?.attributes?.Beschrijving) return obj.Code.attributes.Beschrijving
  if (obj.Code?.Beschrijving) return obj.Code.Beschrijving
  if (obj.Code?._?.Beschrijving) return obj.Code._.Beschrijving
  return undefined
}

/**
 * Extract a localized value from a SOAP name object ({ Naam, Taalcode }) into
 * `{ value, taalcode }`. Returns undefined when the value is empty.
 */
export const getLocalized = <T extends { Naam?: any; Taalcode?: any }>(
  obj: T | undefined,
): { value: string; taalcode?: string } | undefined => {
  const value = getNaam(obj?.Naam)
  if (!value) return undefined
  const taalcode = getTaalcode(obj?.Taalcode)
  return taalcode ? { value, taalcode } : { value }
}

/**
 * Normalize a SOAP value that may be a single item or an array into a proper array.
 */
export const toArray = <T>(obj: T | T[] | undefined): T[] => {
  if (!obj) return []
  return Array.isArray(obj) ? obj : [obj]
}

/** Language preference order for localized text: Dutch first, then the other
 *  official Belgian languages, then English as a final fallback. */
const LANGUAGE_PREFERENCE = ['nl', 'fr', 'de', 'en'] as const

/**
 * Normalize a SOAP Taalcode/TaalCode value to a lowercase BCP-47 language tag
 * (e.g. "NL" -> "nl"). Returns undefined for missing or non-language values.
 */
export const getTaalcode = (obj: any): string | undefined => {
  const code = getNaam(obj)?.toLowerCase().trim()
  // MAGDA uses "xx" as a placeholder for "no language specified". It is not a
  // valid BCP-47/ISO 639-1 tag, so treat it (and any other non-language value)
  // as missing instead of leaking it into RDF language tags (e.g. "@xx").
  return code && /^[a-z]{2}$/.test(code) && code !== 'xx' ? code : undefined
}

/**
 * Pick the preferred item from a list of language-tagged objects, following the
 * LANGUAGE_PREFERENCE order (NL > FR > DE > EN), falling back to any other
 * language and finally to the first item. Used to select the best localized
 * Descriptie when an address is available in multiple languages.
 */
export const pickPreferredByTaalcode = <T extends { Taalcode?: any }>(
  items: T[],
): T | undefined => {
  if (!items.length) return undefined

  let best: T = items[0]
  let bestRank: number = LANGUAGE_PREFERENCE.length

  for (const item of items) {
    const code = getTaalcode(item.Taalcode)
    const idx = code
      ? (LANGUAGE_PREFERENCE as readonly string[]).indexOf(code)
      : -1
    // Unknown/missing languages rank lower than any preferred language.
    const rank = idx === -1 ? LANGUAGE_PREFERENCE.length : idx
    if (rank < bestRank) {
      bestRank = rank
      best = item
    }
  }

  return best
}
