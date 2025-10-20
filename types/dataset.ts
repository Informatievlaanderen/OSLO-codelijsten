import type { Image } from '~/types/image'

export interface Dataset {
  title: string,
  description?: string,
  href?: string,
  image?: Image,
  content?: string,
}
