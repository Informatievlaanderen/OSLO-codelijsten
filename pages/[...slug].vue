<template>
  <content-header
    title="Genid resource"
    href="https://www.vlaanderen.be/digitaal-vlaanderen"
  />

  <vl-toaster v-if="showToaster" mod-top-right fade-out>
    <vl-alert
      mod-small
      mod-success
      icon="check-circle"
      mod-fade-out
      title="URI gekopiëerd"
    />
  </vl-toaster>

  <vl-layout>
    <vl-region>
      <vl-grid mod-v-center mod-stacked>
        <vl-column width="12">
          <div class="h1-sublink">
            <vl-title mod-no-space-bottom ag-name="h1" class="vl-title">
              {{ `Genid: ${slug}` }}
            </vl-title>
            <vl-link @click="copyToClipboard(data?.uri ?? '')">
              <vl-icon icon="file-copy" mod-before></vl-icon>
              {{ data?.uri ?? '' }}
            </vl-link>
          </div>
        </vl-column>

        <vl-column width="12">
          <action-buttons :source="data?.source ?? ''" />
        </vl-column>

        <genid-info v-if="data" :resource="data" />
      </vl-grid>
    </vl-region>
  </vl-layout>

  <content-footer />
</template>

<script setup lang="ts">
import type { GenidResource } from '~/types/bedrijventerrein'
import { useSeoHead } from '~/composables/useSEO'

const showToaster = ref(false)

const route = useRoute()
const slug = computed(() => {
  const params = route.params.slug
  return Array.isArray(params) ? params.join('/') : params
})

// Only handle .well-known/genid/ paths
if (!slug.value.startsWith('.well-known/genid/')) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Pagina niet gevonden',
  })
}

const genidSlug = slug.value.replace('.well-known/genid/', '')

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    showToaster.value = true
    setTimeout(() => {
      showToaster.value = false
    }, 3000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

const { data } = await useAsyncData<GenidResource | null>(
  `genid-${genidSlug}`,
  async () => {
    try {
      return await $fetch(`/doc/api/genid/${genidSlug}`)
    } catch (err) {
      console.error('Error loading genid resource:', err)
      return null
    }
  },
)

if (!data?.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Genid resource niet gevonden',
  })
}

useSeoHead({
  title: `Genid: ${genidSlug}`,
  description: `Genid resource ${genidSlug}`,
})
</script>

<style scoped>
.vl-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
