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
