<template>
  <template v-if="topConcepts?.length">
    <vl-column width="12">
      <vl-title tag-name="h2" mod-h3>Top Concepten</vl-title>
    </vl-column>
    <vl-column width="12">
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
          <tr v-for="concept in topConcepts" :key="concept.id">
            <td>
              <vl-link :href="concept.uri" external>
                {{ concept.uri }}
              </vl-link>
            </td>
            <td>{{ concept.label }}</td>
            <td>{{ concept.definition ?? 'Niet beschikbaar' }}</td>
            <td v-if="conceptScheme">
              <vl-link :href="`/doc/concept/${conceptScheme}/${concept.id}`">
                Bekijk details
              </vl-link>
            </td>
          </tr>
        </tbody>
      </vl-data-table>
    </vl-column>
  </template>
</template>

<script setup lang="ts" name="conceptSchemeConcepts">
import type { TopConcept } from '~/types/concept'

interface Props {
  topConcepts?: TopConcept[]
  conceptScheme?: string
}

defineProps<Props>()
</script>
