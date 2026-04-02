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
