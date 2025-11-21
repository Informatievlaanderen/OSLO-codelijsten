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

          <vl-pager v-if="filteredSchemes.length" mod-align="center">
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
const isLoading = ref(true)

// Fetch schemes progressively
const schemes = ref<ConceptScheme[]>([])

const fetchSchemesProgressively = async () => {
  try {
    const response = await $fetch<ConceptScheme[]>('/doc/api/conceptscheme')
    schemes.value = response ?? []
  } catch (err) {
    console.error('Error loading concept schemes:', err)
    schemes.value = []
  } finally {
    isLoading.value = false
  }
}

// Start loading immediately
onMounted(() => {
  fetchSchemesProgressively()
})

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

    return labelMatch || uriMatch || idMatch || definitionMatch
  })
})

// Reset to first page when search query changes
watch(searchQuery, () => {
  paginationIndex.value = 1
})

const pagedDatasets = (): ConceptScheme[] => {
  return (
    filteredSchemes.value?.slice(
      (paginationIndex.value - 1) * ITEMS_PER_PAGE,
      paginationIndex.value * ITEMS_PER_PAGE,
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
  title: "Conceptschema's",
})
</script>
