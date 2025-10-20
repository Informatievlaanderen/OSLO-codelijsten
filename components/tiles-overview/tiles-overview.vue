<template>
  <vl-region>
    <vl-grid mod-stacked>
      <template v-for="navigationItem in tiles">
        <vl-column width="12" width-s="12">
          <vl-infoblock mod-type="news" :title="navigationItem?.title" />
        </vl-column>
        <vl-column
          v-for="link in navigationItem?.links"
          width="4"
          width-m="6"
          width-s="12"
        >
          <tile
            :href="link?.href"
            :description="link?.description"
            :title="link?.title"
          />
        </vl-column>
      </template>
    </vl-grid>
  </vl-region>
</template>

<script setup lang="ts">
import type { NavigationMenu } from '~/types/navigationMenu'

defineProps({
  tiles: {
    type: Array<NavigationMenu>,
  },
})
</script>
