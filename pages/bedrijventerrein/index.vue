<template>
  <content-header
    title="Bedrijventerrein"
    href="https://www.vlaanderen.be/digitaal-vlaanderen"
  />

  <vl-layout>
    <vl-region>
      <vl-grid mod-v-center mod-stacked>
        <vl-column width="12">
          <vl-title mod-no-space-bottom tag-name="h1">
            Bedrijventerreinen
          </vl-title>
        </vl-column>

        <!-- Search Bar -->
        <vl-column width="12">
          <vl-form-group>
            <vl-input-field
              v-model="searchQuery"
              placeholder="Zoek op naam of URI..."
              mod-block
            >
              <vl-icon slot="before" icon="search"></vl-icon>
            </vl-input-field>
          </vl-form-group>
        </vl-column>

        <vl-column>
          <vl-data-table>
            <thead>
              <tr>
                <th>Naam</th>
                <th>URI</th>
                <th>Acties</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-if="pagedItems().length"
                v-for="item in pagedItems()"
                :key="item.id"
              >
                <td>{{ item.name ?? item.id }}</td>
                <td>
                  <vl-link :href="item.uri" external>
                    {{ item.uri }}
                  </vl-link>
                </td>
                <td>
                  <vl-link :href="`/doc/bedrijventerrein/${item.id}`">
                    Bekijk details
                  </vl-link>
                </td>
              </tr>
              <tr v-else>
                <td colspan="3" class="vl-u-align-center">
                  <span v-if="isLoading">Bedrijventerreinen inladen...</span>
                  <span v-else>Geen bedrijventerreinen gevonden</span>
                </td>
              </tr>
            </tbody>
          </vl-data-table>

          <vl-pager v-if="total" mod-align="center">
            <vl-pager-bounds
              :from="paginationFrom?.toString()"
              :to="paginationTo?.toString()"
              :total="total.toString()"
              prefix="van"
            />
            <vl-pager-item
              v-if="paginationIndex > 1"
              a11yLabel="previous"
              label="vorige"
              type="previous"
              @click="setPreviousPage"
            />
            <vl-pager-item
              v-if="hasNextPage"
              a11yLabel="next"
              type="next"
              label="volgende"
              @click="setNextPage"
            />
          </vl-pager>
        </vl-column>
      </vl-grid>
    </vl-region>
  </vl-layout>

  <content-footer />
</template>

<script setup lang="ts">
import type { BedrijventerreinListItem } from '~/types/bedrijventerrein'
import { ITEMS_PER_PAGE } from '~/constants/constants'
import { useSeoHead } from '~/composables/useSEO'

const paginationIndex = ref(1)
const searchQuery = ref('')
const isLoading = ref(false)
const total = ref(0)
const currentPageItems = ref<BedrijventerreinListItem[]>([])

async function fetchPage() {
  isLoading.value = true
  try {
    const response = await $fetch<{
      total: number
      items: BedrijventerreinListItem[]
    }>('/doc/api/bedrijventerrein', {
      query: { page: paginationIndex.value, search: searchQuery.value },
    })
    total.value = response.total ?? 0
    currentPageItems.value = response.items ?? []
  } catch (err) {
    console.error('Error loading bedrijventerreinen:', err)
    total.value = 0
    currentPageItems.value = []
  } finally {
    isLoading.value = false
  }
}

watch(searchQuery, () => {
  paginationIndex.value = 1
})

watch([paginationIndex, searchQuery], fetchPage, { immediate: true })

const pagedItems = (): BedrijventerreinListItem[] => currentPageItems.value

const paginationFrom = computed(() => {
  if (total.value === 0) return 0
  return (paginationIndex.value - 1) * ITEMS_PER_PAGE + 1
})

const paginationTo = computed(() => {
  const to = paginationIndex.value * ITEMS_PER_PAGE
  return Math.min(to, total.value)
})

const hasNextPage = computed(() => {
  return paginationIndex.value * ITEMS_PER_PAGE < total.value
})

const setPreviousPage = () => {
  if (paginationIndex.value > 1) paginationIndex.value--
}

const setNextPage = () => {
  if (hasNextPage.value) paginationIndex.value++
}

useSeoHead({
  title: 'Bedrijventerreinen',
  description: 'Overzicht van alle bedrijventerreinen',
})
</script>
