<template>
  <content-header
    title="Conceptschema"
    href="https://www.vlaanderen.be/digitaal-vlaanderen"
  />

  <vl-layout>
    <vl-region>
      <vl-grid mod-v-center mod-stacked>
        <vl-column width="12">
          <div class="h1-sublink">
            <vl-title mod-no-space-bottom tag-name="h1">
              {{ data?.label ?? `Conceptschema: ${slug}` }}
            </vl-title>
          </div>
        </vl-column>
        <vl-column width="12">
          <vl-button
            @click="() => openSource(data?.source ?? '')"
            mod-secondary
            mod-small
          >
            <vl-icon icon="download-harddisk" mod-before></vl-icon>
            Bekijk brondata
          </vl-button>
        </vl-column>

        <concept-scheme-info v-if="data" :concept-scheme="data" />
        <concept-scheme-concepts
          v-if="data"
          :top-concepts="data?.topConcepts"
          :conceptScheme="data.id"
        />
      </vl-grid>
    </vl-region>
  </vl-layout>

  <content-footer />
</template>

<script setup lang="ts">
import { openSource } from '~/utils/utils'
import { useSeoHead } from '~/composables/useSEO'

import type { ConceptScheme } from '~/types/conceptScheme'

const route = useRoute()
const slug = computed(() => route.params.slug as string)

const { data } = await useAsyncData<ConceptScheme | null>(
  'conceptscheme',
  async () => {
    try {
      return await $fetch(`/doc/api/conceptschemes/${slug?.value?.toString()}`)
    } catch (err) {
      console.error('Error loading concept schemes:', err)
      return null
    }
  },
)

// Redirect to 404 in case of no data
if (!data?.value?.label) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page not found',
  })
}

useSeoHead({
  title: data.value?.label ?? `Conceptschema: ${slug.value}`,
})
</script>
