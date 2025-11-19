<template>
  <content-header
    title="Concept"
    href="https://www.vlaanderen.be/digitaal-vlaanderen"
  />

  <vl-toaster v-if="showToaster" mod-top-right fade-out>
    <vl-alert
      mod-small
      icon="cross"
      mod-success
      mod-fade-out
      title="URI gekopiëerd"
    />
  </vl-toaster>

  <vl-layout>
    <vl-region>
      <vl-grid mod-v-center mod-stacked>
        <vl-column width="12">
          <div class="h1-sublink">
            <vl-title mod-no-space-bottom tag-name="h1">
              {{ data?.label ?? `Concept: ${slug}` }}
            </vl-title>
            <vl-link
              @click="copyToClipboard(data?.uri ?? fullUri)"
              class="uri-link"
            >
              <vl-icon
                icon="file-copy"
                mod-before
                @click="copyToClipboard(data?.uri ?? fullUri)"
              ></vl-icon>
              {{ data?.uri ?? fullUri }}
            </vl-link>
          </div>
        </vl-column>
        <vl-column width="12">
          <vl-button
            @click="
              () => openSource(data?.source ?? 'https://data.vlaanderen.be')
            "
            mod-secondary
            mod-small
          >
            <vl-icon icon="download-harddisk" mod-before></vl-icon>
            Bekijk brondata
          </vl-button>
        </vl-column>
        <concept-info v-if="data" :concept="data" />

        <concept-relations
          v-if="data?.narrower || data?.broader"
          :narrower="data?.narrower"
          :broader="data?.broader"
        />
      </vl-grid>
    </vl-region>
  </vl-layout>

  <content-footer />
</template>

<script setup lang="ts">
import type { Concept } from '~/types/concept'
import { openSource } from '~/utils/utils'
import { useSeoHead } from '~/composables/useSEO'

const showToaster = ref(false)

const route = useRoute()
const slug = computed(() => {
  const slugArray = Array.isArray(route.params.slug)
    ? route.params.slug
    : [route.params.slug]
  return slugArray.join('/')
})

const fullUri = computed(
  () => `https://data.vlaanderen.be/id/concept/${slug.value}`,
)

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

const { data } = await useAsyncData<Concept | null>('concept', async () => {
  try {
    return await $fetch(`/doc/api/concept/${slug?.value?.toString()}`)
  } catch (err) {
    console.error('Error loading concept schemes:', err)
    return null
  }
})

// Redirect to 404 in case of no data
if (!data?.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Concept niet gevonden',
  })
}

useSeoHead({
  title: data.value?.label ?? `Concept: ${slug.value}`,
})
</script>
