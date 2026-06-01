<template>
  <content-header
    title="Concept Schema's"
    href="https://www.vlaanderen.be/digitaal-vlaanderen"
  />
  <vl-layout>
    <vl-region>
      <vl-grid mod-v-center mod-center mod-stacked>
        <vl-column width="12">
          <vl-title mod-no-space-bottom tag-name="h1">
            Conceptschema's
          </vl-title>
        </vl-column>

        <!-- Search Bar -->
        <vl-column width="12">
          <vl-form-group>
            <vl-input-field
              v-model="searchQuery"
              placeholder="Zoek op label of URI..."
              mod-block
            >
              <vl-icon slot="before" icon="search"></vl-icon>
            </vl-input-field>
          </vl-form-group>
        </vl-column>

        <vl-column class="vl-u-table-overflow">
          <vl-data-table>
            <thead>
              <tr>
                <th>URI</th>
                <th>Label</th>
                <th>Definitie</th>
                <th>Acties</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-if="pagedDatasets().length"
                v-for="scheme in pagedDatasets()"
                :key="scheme.id"
              >
                <td>
                  <vl-link :href="scheme.uri" external>
                    {{ scheme.uri }}
                  </vl-link>
                </td>
                <td>{{ scheme.label ?? scheme.id }}</td>
                <td>
                  {{ scheme.definition ?? 'Geen definitie beschikbaar' }}
                </td>
                <td>
                  <vl-link :href="`/doc/conceptscheme/${scheme.id}`">
                    Bekijk details
                  </vl-link>
                </td>
              </tr>
              <tr v-else>
                <td colspan="5" class="vl-u-align-center">
                  <span v-if="isLoading">Conceptschema's inladen...</span>
                  <span v-else>Geen schema's gevonden</span>
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
import type { ConceptScheme } from '~/types/conceptScheme'
import { ITEMS_PER_PAGE } from '~/constants/constants'

const paginationIndex = ref(1)
const searchQuery = ref('')
const isLoading = ref(false)
const total = ref(0)
const currentPageItems = ref<ConceptScheme[]>([])

async function fetchPage() {
  isLoading.value = true
  try {
    const response = await $fetch<{ total: number; items: ConceptScheme[] }>(
      '/doc/api/conceptscheme',
      { query: { page: paginationIndex.value, search: searchQuery.value } },
    )
    total.value = response.total ?? 0
    currentPageItems.value = response.items ?? []
  } catch (err) {
    console.error('Error loading concept schemes:', err)
    total.value = 0
    currentPageItems.value = []
  } finally {
    isLoading.value = false
  }
}

// Reset to page 1 when search changes
watch(searchQuery, () => {
  paginationIndex.value = 1
})

// Fetch from server whenever page or search changes
watch([paginationIndex, searchQuery], fetchPage, { immediate: true })

const pagedDatasets = (): ConceptScheme[] => currentPageItems.value

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
  title: "Conceptschema's",
})
</script>
