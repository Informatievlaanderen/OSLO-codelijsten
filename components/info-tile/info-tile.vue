<template>
  <vl-info-tile
    tag-name="div"
    :href="href"
    :title="title"
    :subtitle="description"
  >
    <template v-if="image" v-slot:badge>
      <vl-badge>
        <img :src="image?.src" :alt="image?.alt ?? 'placeholder'" />
      </vl-badge>
    </template>
    <div v-if="content">{{ content }}</div>
  </vl-info-tile>
</template>

<script setup lang="ts" name="infoTile">
import type { Dataset } from '~/types/dataset'

const props = defineProps<Dataset>()
defineExpose({ props })
</script>
