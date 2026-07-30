<template>
  <content-header
    title="Beheerde bedrijvenzone"
    href="https://www.vlaanderen.be/digitaal-vlaanderen"
  />

  <vl-toaster v-if="showToaster" mod-top-right fade-out>
    <vl-alert mod-small mod-success icon="check-circle" mod-fade-out title="URI gekopiëerd" />
  </vl-toaster>

  <vl-layout>
    <vl-region>
      <vl-grid mod-v-center mod-stacked>
        <vl-column width="12">
          <div class="h1-sublink">
            <vl-title mod-no-space-bottom tag-name="h1">
              {{ data?.name ? `Beheerde bedrijventerrein: ${data.name}` : `Beheerde bedrijvenzone: ${slug}` }}
            </vl-title>
            <vl-link @click="copyToClipboard(data?.uri ?? '')">
              <vl-icon icon="file-copy" mod-before></vl-icon>
              {{ data?.uri ?? '' }}
            </vl-link>
          </div>
        </vl-column>

        <vl-column width="12">
          <action-buttons :source="data?.source ?? ''">
            <a href="/doc/beheerdebedrijvenzone"
              ><vl-button type="button">Terug naar overzicht</vl-button></a
            >
          </action-buttons>
        </vl-column>

        <beheerdebedrijvenzone-info v-if="data" :zone="data" />
      </vl-grid>
    </vl-region>
  </vl-layout>

  <content-footer />
</template>

<script setup lang="ts">
import type { BeheerdeBedrijvenzone } from '~/types/bedrijventerrein'
import { useSeoHead } from '~/composables/useSEO'

const showToaster = ref(false)

const route = useRoute()
const slug = computed(() => {
  const params = route.params.slug
  return Array.isArray(params) ? params.join('/') : params
})

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

const { data } = await useAsyncData<BeheerdeBedrijvenzone | null>(
  `beheerdebedrijvenzone-${slug.value}`,
  async () => {
    try {
      return await $fetch(`/doc/api/beheerdebedrijvenzone/${slug.value}`)
    } catch (err) {
      console.error('Error loading beheerdebedrijvenzone:', err)
      return null
    }
  },
)

if (!data?.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Beheerde bedrijvenzone niet gevonden',
  })
}

useSeoHead({
  title: data.value?.name
    ? `Beheerde bedrijventerrein: ${data.value.name}`
    : `Beheerde bedrijvenzone: ${slug.value}`,
  description: `Beheerde bedrijvenzone ${data.value?.name ?? slug.value}`,
})
</script>
