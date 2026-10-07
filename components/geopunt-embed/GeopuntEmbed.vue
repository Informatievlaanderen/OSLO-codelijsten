<template>
  <vl-column v-if="src" width="12">
    <iframe
      :src="src"
      width="100%"
      height="480"
      frameborder="0"
      style="border: 0"
      allowfullscreen
    ></iframe>
  </vl-column>
</template>

<script setup lang="ts">
export interface GeopuntEmbedProps {
  src?: string
}

defineProps<GeopuntEmbedProps>()
</script>
