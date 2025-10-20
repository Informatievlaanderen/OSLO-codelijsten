<template>
  <vl-region>
    <vl-grid mod-stacked>
      <vl-column v-for="tile in tiles" width="6" width-s="12">
        <info-tile
          :image="tile?.image"
          :href="tile?.href"
          :title="tile?.title"
          :subtitle="tile?.description"
          :content="tile?.content"
        />
      </vl-column>
    </vl-grid>
  </vl-region>
</template>

<script setup lang="ts">
import type { Dataset } from '~/types/dataset'

defineProps({
  tiles: {
    type: Array<Dataset>,
  },
})
</script>
