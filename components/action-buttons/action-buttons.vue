<template>
  <vl-action-group mod-collapse-s>
    <slot />
    <vl-button @click="() => openSource(source)" mod-secondary mod-small>
      <vl-icon icon="download-harddisk" mod-before></vl-icon>
      Bekijk brondata
    </vl-button>
    <vl-button
      @click="() => openSource(`/doc${$route.path}.ttl`)"
      mod-secondary
      mod-small
    >
      <vl-icon icon="download-harddisk" mod-before></vl-icon>
      .ttl
    </vl-button>
    <vl-button
      @click="() => openSource(`/doc${$route.path}.jsonld`)"
      mod-secondary
      mod-small
    >
      <vl-icon icon="download-harddisk" mod-before></vl-icon>
      .jsonld
    </vl-button>
  </vl-action-group>
</template>

<script setup lang="ts" name="conceptSchemeDownloads">
import { openSource } from '~/utils/utils'

interface Props {
  source: string
}

const props = defineProps<Props>()
</script>
