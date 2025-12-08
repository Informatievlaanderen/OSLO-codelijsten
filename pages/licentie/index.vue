<template>
  <content-header
    title="Licenties"
    href="https://www.vlaanderen.be/digitaal-vlaanderen"
  />
  <vl-layout>
    <vl-region>
      <vl-grid mod-v-center mod-center mod-stacked>
        <vl-column width="12">
          <vl-title mod-no-space-bottom tag-name="h1"> Licenties </vl-title>
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
                <th>Titel</th>
                <th>Definitie</th>
                <th>Acties</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-if="pagedDatasets().length"
                v-for="license in pagedDatasets()"
                :key="license.id"
              >
                <td>
                  <vl-link :href="license.uri" external>
                    {{ license.uri }}
                  </vl-link>
                </td>
                <td>{{ license.title ?? license.id }}</td>
                <td>
                  {{ license.description ?? 'Geen definitie beschikbaar' }}
                </td>
                <td>
                  <vl-link :href="`/doc/licentie/${license.id}`">
                    Bekijk details
                  </vl-link>
                </td>
              </tr>
              <tr v-else>
                <td colspan="5" class="vl-u-align-center">
                  <span v-if="isLoading">Licenties inladen...</span>
                  <span v-else>Geen licenties gevonden</span>
                </td>
              </tr>
            </tbody>
          </vl-data-table>

          <vl-pager v-if="filteredLicenses.length" mod-align="center">
            <vl-pager-bounds
              :from="paginationFrom?.toString()"
              :to="paginationTo?.toString()"
              :total="filteredLicenses?.length?.toString()"
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
import { ITEMS_PER_PAGE } from '~/constants/constants'
import type { License } from '~/types/license'

const paginationIndex = ref(1)
const searchQuery = ref('')
const isLoading = ref(true)

// Fetch schemes progressively
const licenses = ref<License[]>([])

const fetchSchemesProgressively = async () => {
  try {
    const response = await $fetch<License[]>('/doc/api/license')
    licenses.value = response ?? []
  } catch (err) {
    console.error('Error loading licenses', err)
    licenses.value = []
  } finally {
    isLoading.value = false
  }
}

// Start loading immediately
onMounted(() => {
  fetchSchemesProgressively()
})

// Filter licenses based on search query
const filteredLicenses = computed(() => {
  if (!searchQuery.value.trim()) {
    return licenses.value ?? []
  }

  const query = searchQuery.value.toLowerCase().trim()

  return (licenses.value ?? []).filter((license) => {
    const titleMatch = license.title?.toLowerCase().includes(query)
    const descriptionMatch = license.description?.toLowerCase().includes(query)
    const uriMatch = license.uri?.toLowerCase().includes(query)
    const idMatch = license.id?.toLowerCase().includes(query)

    return titleMatch || descriptionMatch || uriMatch || idMatch
  })
})

// Reset to first page when search query changes
watch(searchQuery, () => {
  paginationIndex.value = 1
})

const pagedDatasets = (): License[] => {
  return (
    filteredLicenses.value?.slice(
      (paginationIndex.value - 1) * ITEMS_PER_PAGE,
      paginationIndex.value * ITEMS_PER_PAGE,
    ) ?? []
  )
}

const paginationFrom = computed(() => {
  if (filteredLicenses.value.length === 0) return 0
  return (paginationIndex.value - 1) * ITEMS_PER_PAGE + 1
})

const paginationTo = computed(() => {
  const to = paginationIndex.value * ITEMS_PER_PAGE
  return Math.min(to, filteredLicenses.value.length)
})

const hasNextPage = computed(() => {
  return paginationIndex.value * ITEMS_PER_PAGE < filteredLicenses.value.length
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
  title: 'Licenties',
})
</script>
