export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('nl-BE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const openSource = (source: string) => {
  if (!source) return
  window.open(source, '_blank')
}

export const extractConcept = (uri: string): string => {
  try {
    const url = new URL(uri)

    // if it's a Vlaanderen url, it will most likely be one of our conceptschemes and thus needs to be an internal path
    // Can't return the full url to keep test environments working
    if (!url.origin.includes('vlaanderen')) {
      return uri
    }

    return `/doc/${uri.replace(url.origin, '').replace(/\/(id|doc)\//, '')}`
  } catch {
    return ''
  }
}

export const compareText = (a?: string, b?: string) => {
  const left = a?.trim()
  const right = b?.trim()

  // Put empty values at the end
  if (!left && !right) return 0
  if (!left) return 1
  if (!right) return -1

  return left.localeCompare(right, 'nl-BE', {
    sensitivity: 'base',
    numeric: true,
  })
}

/**
 * Parse a GML geometry string and compute the centroid.
 * Supports both Polygon (gml:posList) and Point (gml:pos).
 * Returns {x, y} in the original coordinate system (Lambert 1972 EPSG:31370).
 */
export const parseGmlCentroid = (
  gml: string,
): { x: number; y: number } | null => {
  // Try posList first (Polygon), then pos (Point)
  const match = gml.match(/<gml:posList>([^<]+)<\/gml:posList>/)
    ?? gml.match(/<gml:pos>([^<]+)<\/gml:pos>/)
  if (!match) return null

  const numbers = match[1].trim().split(/\s+/).map(Number)
  if (numbers.length < 2 || numbers.some(isNaN)) return null

  // Pair up: x y x y x y ...
  const xs: number[] = []
  const ys: number[] = []
  for (let i = 0; i < numbers.length - 1; i += 2) {
    xs.push(numbers[i])
    ys.push(numbers[i + 1])
  }

  const cx = xs.reduce((a, b) => a + b, 0) / xs.length
  const cy = ys.reduce((a, b) => a + b, 0) / ys.length

  return { x: cx, y: cy }
}

/**
 * Build a Geopunt URL from the centroid of a GML geometry
 * Uses the coordinaten parameter + zoom level for a reliable result.
 */
export const buildGeopuntUrl = (x: number, y: number, lod = 12): string => {
  // Lambert 1972 (EPSG:31370) — format: x,y
  const round = (n: number) => n.toFixed(2)
  return `https://www.geopunt.be?app=algemene-kaart&coordinaten=${round(x)},${round(y)}&lod=${lod}`
}

/**
 * Build a Geopunt embed iframe URL from coordinates.
 * Geopunt supports Lambert 1972 (EPSG:31370), Lambert 2008 (EPSG:3812),
 * WGS84 (EPSG:4326) and Web Mercator (EPSG:3857).
 * Coordinates are space-separated: "x y" (URL-encoded as %20).
 * The GRB basemap is added by default.
 */
export const buildGeopuntEmbedUrl = (x: number, y: number): string => {
  const round = (n: number) => n.toFixed(2)
  return `https://www.geopunt.be/embed/fcf65745-c2a3-4105-be53-b120318bf708/?searchbar=0?coordinaten=${encodeURIComponent(`${round(x)} ${round(y)}`)}&kaart=landb 2018`
}
