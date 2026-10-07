export default defineEventHandler((event) => {
  const slug = getRouterParam(event, 'slug')
  const query = getQuery(event)

  let x: number | undefined
  let y: number | undefined

  // Try query parameters first
  if (query.x && query.y) {
    x = parseFloat(query.x as string)
    y = parseFloat(query.y as string)
  } else if (slug) {
    // Try path-based coordinates: point/lon/lat.geojson
    const match = slug.match(/point\/([\d.-]+)\/([\d.-]+?)\.geojson$/)
    if (match) {
      x = parseFloat(match[1])
      y = parseFloat(match[2])
    }
  }

  const features: Array<{
    type: string
    geometry: { type: string; coordinates: number[] }
    properties: Record<string, string>
  }> = []

  if (x !== undefined && y !== undefined && !isNaN(x) && !isNaN(y)) {
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [x, y],
      },
      properties: { id: 'contact-0' },
    })
  }

  return {
    type: 'FeatureCollection',
    features,
  }
})