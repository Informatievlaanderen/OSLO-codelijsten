<template>
  <vl-toaster v-if="showToaster" mod-top-right fade-out>
    <vl-alert
      mod-small
      mod-success
      mod-fade-out
      icon="check-circle"
      title="Notitie gekopiëerd"
    />
  </vl-toaster>
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
            <vl-link
              v-if="concept.notation"
              class="notation-copy"
              @click="copyToClipboard(concept.notation)"
            >
              <vl-icon icon="file-copy" mod-before></vl-icon>
            </vl-link>
          </td>

          <td>{{ concept.label }}</td>
          <td>{{ concept.definition ?? 'Niet beschikbaar' }}</td>
          <td>
            <span
              v-if="getStatusLabel(concept.status, concept.statusLabel)"
              :class="['status-pill', getStatusClass(concept.status)]"
            >
              {{ getStatusLabel(concept.status, concept.statusLabel) }}
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

const showToaster = ref(false)

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    showToaster.value = true
    setTimeout(() => {
      showToaster.value = false
    }, 3000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}
</script>

<style scoped src="./style.scss" />
