<template>
  <content-header
    title="Licentie"
    href="https://www.vlaanderen.be/digitaal-vlaanderen"
  />

  <vl-layout>
    <vl-region>
      <vl-grid mod-v-center mod-stacked>
        <vl-column width="12">
          <div class="h1-sublink">
            <vl-title mod-no-space-bottom tag-name="h1">
              {{ data?.title ?? `Licentie: ${slug}` }}
            </vl-title>
          </div>
        </vl-column>
        <vl-column width="12">
          <vl-action-group mod-collapse-s>
            <a href="/doc/licentie"
              ><vl-button type="button">Terug naar overzicht</vl-button></a
            >
            <vl-button
              @click="() => openSource(data?.source ?? '')"
              mod-secondary
              mod-small
            >
              <vl-icon icon="download-harddisk" mod-before></vl-icon>
              Bekijk brondata
            </vl-button>
          </vl-action-group>
        </vl-column>

        <license-info :license="data"></license-info>
      </vl-grid>
    </vl-region>
  </vl-layout>

  <content-footer />
</template>

<script setup lang="ts">
import { openSource } from '~/utils/utils'
import { useSeoHead } from '~/composables/useSEO'
import type { License } from '~/types/license'

const route = useRoute()
const slug = computed(() => {
  const params = route.params.slug
  // If slug is an array (from catch-all [...slug]), join it
  // If it's a string, use it directly
  return Array.isArray(params) ? params.join('/') : params
})

const { data } = await useAsyncData<License | null>(
  `licentie-${slug.value}`,
  async () => {
    try {
      return await $fetch(`/doc/api/license/${slug.value?.toString()}`)
    } catch (err) {
      console.error('Error loading concept schemes:', err)
      return null
    }
  },
)

// Redirect to 404 in case of no data
if (!data?.value?.title) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page not found',
  })
}

useSeoHead({
  title: data.value?.title ?? `Conceptschema: ${slug.value}`,
})
</script>
