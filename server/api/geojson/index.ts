export default defineEventHandler((event) => {
  const query = getQuery(event)
  const x = query.x as string | undefined
  const y = query.y as string | undefined

  const features: Array<{
    type: string
    geometry: { type: string; coordinates: number[] }
    properties: Record<string, string>
  }> = []

  if (x && y) {
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(x), parseFloat(y)],
      },
      properties: { id: 'contact-0' },
    })
  }

  return {
    type: 'FeatureCollection',
    features,
  }
})
