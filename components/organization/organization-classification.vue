<template>
  <template v-if="classifications?.length">
    <vl-column width="12">
      <vl-title tag-name="h2" mod-h3>Classificaties</vl-title>
    </vl-column>
    <vl-column width="12">
      <vl-data-table>
        <thead>
          <tr>
            <th>Classificatie</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="classification in classifications"
            :key="classification.id"
          >
            <td>
              <vl-link :href="classification.uri" external>
                {{ classification.name }}
              </vl-link>
            </td>
          </tr>
        </tbody>
      </vl-data-table>
    </vl-column>
  </template>
</template>

<script setup lang="ts" name="organizationClassification">
import type { Dataset } from '~/types/organization'

interface Props {
  classifications?: Dataset[]
}

defineProps<Props>()
</script>
