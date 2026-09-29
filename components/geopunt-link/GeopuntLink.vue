<template>
  <vl-column v-if="centroid" width="12">
    <vl-data-table>
      <tbody>
        <tr>
          <td>
            <vl-link :href="fieldUri" external>
              Geometrie
            </vl-link>
          </td>
          <td>
            <vl-link :href="geopuntUrl" external>
              {{ centroid.x.toFixed(2) }}, {{ centroid.y.toFixed(2) }}
            </vl-link>
          </td>
        </tr>
        <slot />
      </tbody>
    </vl-data-table>
  </vl-column>
</template>

<script setup lang="ts">
export interface GeopuntLinkProps {
  centroid?: { x: number; y: number }
  geopuntUrl?: string
  fieldUri: string
}

defineProps<GeopuntLinkProps>()
</script>
