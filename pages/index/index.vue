<template>
  <content-header
    title="OSLO"
    href="https://www.vlaanderen.be/digitaal-vlaanderen"
    subtitle="Frontend template"
  />
  <vl-layout>
    <vl-region>
      <vl-grid>
        <vl-column width="10" width-s="12">
          <vl-title tag-name="h2" id="OSLO-Frontend">OSLO frontend</vl-title>
          <vl-region v-html="data?.about" />
        </vl-column>
      </vl-grid>
    </vl-region>
  </vl-layout>
  <content-footer />
</template>

<script setup lang="ts">
import type { Index } from '~/types/index'

// Multiple queryContents require to await them all at the same time: https://github.com/nuxt/content/issues/1368
const { data } = await useAsyncData('data', async () => {
  const [data] = await Promise.all([
    queryContent<Index>('/configuration').find(),
  ])
  return data[0]
})
</script>
