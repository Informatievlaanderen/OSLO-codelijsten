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
                <th>Status</th>
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
                  <vl-pill v-if="scheme.status" mod-success>
                    {{ scheme.status }}
                  </vl-pill>
                  <span v-else>-</span>
                </td>
                <td>
                  <vl-link :href="`/doc/conceptscheme/${scheme.id}`">
                    Bekijk details
                  </vl-link>
                </td>
              </tr>
              <tr v-else>
                <td colspan="7" class="vl-u-align-center">
                  Geen concepten gevonden
                </td>
              </tr>
            </tbody>
          </vl-data-table>

          <vl-pager mod-align="center">
            <vl-pager-bounds
              :from="paginationFrom?.toString()"
              :to="paginationTo?.toString()"
              :total="filteredSchemes?.length?.toString()"
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

// Fetch all schemes from the backend API (no CORS issues)
const { data: schemes } = await useAsyncData<ConceptScheme[]>(
  'concept-schemes',
  async () => {
    try {
      return await $fetch('/doc/api/conceptscheme')
    } catch (err) {
      console.error('Error loading concept schemes:', err)
      return []
    }
  },
)

// Filter schemes based on search query
const filteredSchemes = computed(() => {
  if (!searchQuery.value.trim()) {
    return schemes.value ?? []
  }

  const query = searchQuery.value.toLowerCase().trim()

  return (schemes.value ?? []).filter((scheme) => {
    const labelMatch = scheme.label?.toLowerCase().includes(query)
    const uriMatch = scheme.uri?.toLowerCase().includes(query)
    const idMatch = scheme.id?.toLowerCase().includes(query)
    const definitionMatch = scheme.definition?.toLowerCase().includes(query)

    return labelMatch ?? uriMatch ?? idMatch ?? definitionMatch
  })
})

// Reset to first page when search query changes
watch(searchQuery, () => {
  paginationIndex.value = 1
})

const pagedDatasets = (): ConceptScheme[] => {
  return (
    filteredSchemes.value?.slice(
      paginationIndex.value - 1,
      paginationIndex.value + ITEMS_PER_PAGE - 1,
    ) ?? []
  )
}

const paginationFrom = computed(() => {
  if (filteredSchemes.value.length === 0) return 0
  return (paginationIndex.value - 1) * ITEMS_PER_PAGE + 1
})

const paginationTo = computed(() => {
  const to = paginationIndex.value * ITEMS_PER_PAGE
  return Math.min(to, filteredSchemes.value.length)
})

const hasNextPage = computed(() => {
  return paginationIndex.value * ITEMS_PER_PAGE < filteredSchemes.value.length
})

// Pagination methods
const setPreviousPage = () => {
  if (paginationIndex.value > 1) {
    paginationIndex.value--
  }
}

const setNextPage = () => {
  if (hasNextPage.value) {
    paginationIndex.value++
  }
}

useSeoHead({
  title: 'Concepten',
})
</script>
