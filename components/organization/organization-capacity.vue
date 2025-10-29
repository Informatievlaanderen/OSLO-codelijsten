<template>
  <template v-if="capacities?.length">
    <vl-column width="12">
      <vl-title tag-name="h2" mod-h3>Capaciteiten</vl-title>
    </vl-column>
    <vl-column width="12">
      <vl-data-table>
        <thead>
          <tr>
            <th>Capaciteit</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="capacity in capacities" :key="capacity.id">
            <td>
              <vl-link :href="capacity.uri" external>
                {{ `${capacity.role} - ${capacity.person}` }}
              </vl-link>
            </td>
          </tr>
        </tbody>
      </vl-data-table>
    </vl-column>
  </template>
</template>

<script setup lang="ts" name="organizationCapacity">
import type { Capacity } from '~/types/organization'

interface Props {
  capacities?: Capacity[]
}

defineProps<Props>()
</script>
