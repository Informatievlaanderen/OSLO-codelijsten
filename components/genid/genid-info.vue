<template>
  <vl-column width="12">
    <vl-title tag-name="h2" mod-h3>Gegevens</vl-title>
    <vl-data-table>
      <tbody>
        <tr v-if="resource?.type">
          <td>
            <vl-link
              href="http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
              external
            >
              type
            </vl-link>
          </td>
          <td>
            <vl-link :href="resource.type">
              {{ resource.typeLabel }}
            </vl-link>
          </td>
        </tr>
        <tr
          v-for="triple in resource?.triples"
          :key="`${triple.predicate}-${triple.value}`"
        >
          <td>
            <vl-link
              v-if="!isIdentificatorPredicate(triple.predicate)"
              :href="triple.predicate"
              external
            >
              {{ triple.predicateLabel }}
            </vl-link>
            <vl-link
              v-else
              href="http://www.w3.org/ns/adms#identifier"
              external
            >
              Identificator
            </vl-link>
          </td>
          <td>
            <vl-link
              v-if="
                triple.valueType === 'uri' || triple.value.startsWith('/doc/')
              "
              :href="triple.value"
            >
              {{ triple.value }}
            </vl-link>
            <span v-else>{{ triple.value }}</span>
          </td>
        </tr>
      </tbody>
    </vl-data-table>
  </vl-column>

  <!-- Reverse references grouped by predicate -->
  <vl-column width="12" v-if="resource?.reverseReferences?.length">
    <vl-title tag-name="h2" mod-h3>Verwijzingen naar deze resource</vl-title>
    <vl-data-table>
      <tbody>
        <tr
          v-for="ref in resource.reverseReferences"
          :key="`${ref.subjectUri}-${ref.predicate}`"
        >
          <td>
            <vl-link :href="ref.predicate" external>
              {{ ref.predicateLabel }}
            </vl-link>
          </td>
          <td>
            <vl-link v-if="ref.subjectId" :href="`/doc/${ref.subjectId}`">
              {{ ref.subjectLabel }}
            </vl-link>
            <vl-link
              v-else-if="ref.subjectUri.startsWith('/doc/')"
              :href="ref.subjectUri"
            >
              {{ ref.subjectLabel }}
            </vl-link>
            <vl-link v-else :href="ref.subjectUri">
              {{ ref.subjectLabel }}
            </vl-link>
          </td>
        </tr>
      </tbody>
    </vl-data-table>
  </vl-column>
</template>

<script setup lang="ts" name="genidInfo">
import type { GenidResource } from '~/types/bedrijventerrein'

const props = defineProps<{
  resource?: GenidResource
}>()

const isIdentificatorPredicate = (predicate: string): boolean => {
  return (
    predicate === 'http://mu.semte.ch/vocabularies/core/uuid' ||
    predicate === 'https://www.w3.org/ns/legacy_adms#identifier'
  )
}
</script>
