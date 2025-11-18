import type { SeoConfig } from '~/types/SEO'

export const useSeoHead = (config: SeoConfig) => {
  const { title, description, type = 'website' } = config

  useHead({
    title: `${title} | Codelijsten`,
    meta: [
      {
        name: 'description',
        content: description ?? title,
      },
      {
        property: 'og:title',
        content: title,
      },
      {
        property: 'og:description',
        content: description ?? title,
      },
      {
        property: 'og:type',
        content: type,
      },
    ],
  })
}
