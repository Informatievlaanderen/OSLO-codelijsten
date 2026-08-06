import { getOntwikkelbareBedrijvenzoneList } from '~/server/services/bedrijventerrein.service'
import { ITEMS_PER_PAGE } from '~/constants/constants'
import type { OntwikkelbareBedrijvenzoneListItem } from '~/types/bedrijventerrein'

export default defineEventHandler(
  async (event): Promise<{ total: number; items: OntwikkelbareBedrijvenzoneListItem[] }> => {
    try {
      const query = getQuery(event)
      const page = Math.max(1, parseInt((query.page as string) ?? '1', 10))
      const search = ((query.search as string) ?? '').toLowerCase().trim()

      console.log(
        `[${new Date().toISOString()}] Fetching ontwikkelbarebedrijvenzone list (page=${page}, search="${search}")`,
      )

      const allItems = await getOntwikkelbareBedrijvenzoneList()

      const filtered = search
        ? allItems.filter(
            (item) =>
              item.name?.toLowerCase().includes(search) ||
              item.id.toLowerCase().includes(search) ||
              item.uri.toLowerCase().includes(search),
          )
        : allItems

      const total = filtered.length
      const start = (page - 1) * ITEMS_PER_PAGE
      const items = filtered.slice(start, start + ITEMS_PER_PAGE)

      return { total, items }
    } catch (error) {
      console.error('Error fetching ontwikkelbarebedrijvenzone list:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Error fetching ontwikkelbarebedrijvenzone list',
      })
    }
  },
)
