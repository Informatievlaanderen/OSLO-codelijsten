<template>
  <vl-column width="12">
    <vl-data-table>
      <thead>
        <tr>
          <th>Notitie/aanleverwaarde</th>
          <th>Label</th>
          <th>Definitie</th>
          <th>Status</th>
          <th>Acties</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="concept in concepts" :key="concept.id">
          <td>
            <vl-link :href="concept.uri" external>
              {{ concept.notation ?? 'Geen notitie beschikbaar' }}
            </vl-link>
          </td>

          <td>{{ concept.label }}</td>
          <td>{{ concept.definition ?? 'Niet beschikbaar' }}</td>
          <td>
            <span
              v-if="getStatusLabel(concept.status)"
              :class="['status-pill', getStatusClass(concept.status)]"
            >
              {{ getStatusLabel(concept.status) }}
            </span>
            <span v-else />
          </td>
          <td v-if="conceptScheme">
            <vl-link :href="`${extractConcept(concept.uri)}`">
              Bekijk details
            </vl-link>
          </td>
        </tr>
      </tbody>
    </vl-data-table>
  </vl-column>
</template>

<script setup lang="ts" name="conceptSchemeConcepts">
import type { Concept } from '~/types/concept'
import type { extractConcept } from '~/utils/utils'

interface Props {
  concepts?: Concept[]
  conceptScheme?: string
}

defineProps<Props>()

const getStatusLabel = (status?: string): string => {
  if (!status) {
    return ''
  }

  const value = status.trim()
  if (!value) {
    return ''
  }

  const segments = value.split('/')
  return segments[segments.length - 1]
}

const getStatusClass = (status?: string): string => {
  const label = getStatusLabel(status).toLowerCase()

  if (label === 'ingebruik') {
    return 'status-pill--ingebruik'
  }

  if (label === 'uitgebruik') {
    return 'status-pill--uitgebruik'
  }

  if (label === 'verwijderd') {
    return 'status-pill--verwijderd'
  }

  return ''
}
</script>

<style scoped>
.status-pill {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 0.25rem;
}

.status-pill--ingebruik {
  background-color: #d1fae5;
}

.status-pill--uitgebruik {
  background-color: #fef3c7;
}

.status-pill--verwijderd {
  background-color: #fee2e2;
}
</style>
