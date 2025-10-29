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
          </tr>
        </tbody>
      </vl-data-table>
    </vl-column>
  </template>
</template>

<script setup lang="ts" name="conceptSchemeConcepts">
import type { TopConcept } from '~/types/conceptScheme'

interface Props {
  topConcepts?: TopConcept[]
}

defineProps<Props>()
</script>
