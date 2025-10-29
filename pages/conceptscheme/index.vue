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
            Concept schema's
          </vl-title>
        </vl-column>
        <vl-column v-if="!paginatedSchemes.length" width="12">
          <vl-alert type="info"> Geen concept schema's gevonden. </vl-alert>
        </vl-column>

        <template v-else>
          <vl-column class="vl-u-table-overflow">
            <vl-data-table mod-zebra>
              <thead>
                <tr>
                  <th>URI</th>
                  <th>Label</th>
                  <th>Definitie</th>
                  <th>Status</th>
                  <th>Concepten</th>
                  <th>Acties</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="scheme in paginatedSchemes" :key="scheme.id">
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
                    <vl-link v-if="scheme.status">
                      {{ scheme.status }}
                    </vl-link>
                    <span v-else>-</span>
                  </td>
                  <td>{{ scheme.topConcepts?.length ?? 0 }}</td>
                  <td>
                    <vl-link :href="`/conceptscheme/${scheme?.id}`">
                      Details
                    </vl-link>
                  </td>
                </tr>
              </tbody>
            </vl-data-table>

            <vl-pager mod-align="center">
              <vl-pager-bounds
                :from="paginationFrom.toString()"
                :to="paginationTo.toString()"
                :total="totalSchemes.toString()"
                prefix="van"
              />
              <vl-pager-item
                v-if="currentPage > 1"
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
        </template>
      </vl-grid>
    </vl-region>
  </vl-layout>

  <content-footer />
</template>

<script setup lang="ts">
import type { ConceptScheme } from '~/types/conceptScheme'
import { useConceptSchemeService } from '~/services/comunica.service'
import { ITEMS_PER_PAGE } from '~/constants/constants'

const conceptSchemeService = useConceptSchemeService()
const datasetConfig = useDatasetConfig()

const currentPage = ref(1)
const schemes = ref<ConceptScheme[]>([])

// Fetch all concept schemes
const { data: conceptSchemes } = await useAsyncData<ConceptScheme[]>(
  'all-concept-schemes',
  async () => {
    try {
      // Get all concept scheme configurations
      const allSchemeConfigs = await datasetConfig.getAllConceptSchemes()

      // Fetch data for each concept scheme
      const schemePromises = allSchemeConfigs.map(async (config) => {
        try {
          const scheme = await conceptSchemeService.getConceptScheme(config.key)
          return scheme
        } catch (err) {
          console.error(`Error loading scheme ${config.key}:`, err)
          return null
        }
      })

      const results = await Promise.all(schemePromises)

      // Filter out null results and return
      return results.filter(
        (scheme): scheme is ConceptScheme => scheme !== null,
      )
    } catch (err) {
      console.error('Error loading concept schemes:', err)
      return []
    } finally {
    }
  },
)

// Update schemes ref when data is loaded
watch(
  () => conceptSchemes.value,
  (newSchemes) => {
    if (newSchemes) {
      schemes.value = newSchemes
    }
  },
  { immediate: true },
)

const totalSchemes = computed(() => schemes.value.length)

const paginatedSchemes = computed(() => {
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE
  const end = start + ITEMS_PER_PAGE
  return schemes.value.slice(start, end)
})

const paginationFrom = computed(() => {
  if (totalSchemes.value === 0) return 0
  return (currentPage.value - 1) * ITEMS_PER_PAGE + 1
})

const paginationTo = computed(() => {
  const to = currentPage.value * ITEMS_PER_PAGE
  return Math.min(to, totalSchemes.value)
})

const hasNextPage = computed(() => {
  return currentPage.value * ITEMS_PER_PAGE < totalSchemes.value
})

// Pagination methods
const setPreviousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const setNextPage = () => {
  if (hasNextPage.value) {
    currentPage.value++
  }
}
</script>
