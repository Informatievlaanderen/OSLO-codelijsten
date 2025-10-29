<template>
  <template v-if="datasets?.length">
    <vl-column width="12">
      <vl-title tag-name="h2" mod-h3>Gekoppelde datasets</vl-title>
    </vl-column>
    <vl-column
      v-for="dataset in datasets"
      :key="dataset.id"
      width="6"
      width-s="12"
    >
      <vl-info-tile>
        <vl-icon icon="database" slot="icon"></vl-icon>
        <vl-title tag-name="h4" slot="title">{{ dataset.name }}</vl-title>
        <vl-link :href="dataset.uri" slot="cta" external>
          Bekijk dataset
        </vl-link>
      </vl-info-tile>
    </vl-column>
  </template>
</template>

<script setup lang="ts" name="organizationDatasets">
import type { Dataset } from '~/types/organization'

interface Props {
  datasets?: Dataset[]
}

defineProps<Props>()
</script>
