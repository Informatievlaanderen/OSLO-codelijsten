<template>
  <content-header
    title="Organisatie"
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
        <!-- Header Section -->
        <vl-column width="12">
          <div class="h1-sublink">
            <vl-title mod-no-space-bottom tag-name="h1">
              {{ data?.name ?? slug }}
            </vl-title>
            <vl-link @click="copyToClipboard(data?.uri ?? '')" class="uri-link">
              <vl-icon icon="file-copy" mod-before></vl-icon>
              {{ data?.uri ?? '' }}
            </vl-link>
          </div>
        </vl-column>

        <!-- Action Buttons -->
        <vl-column width="12">
          <vl-action-group mod-collapse-s>
            <vl-button
              v-if="data?.uri"
              @click="() => window.open(`${data.uri}.ttl`, '_blank')"
              mod-secondary
              mod-small
            >
              <vl-icon icon="download-harddisk" mod-before></vl-icon>
              Bekijk brondata
            </vl-button>
          </vl-action-group>
        </vl-column>

        <!-- Basic Information -->
        <organization-info :organization="data" :fallback-id="slug" />

        <!-- Contact Information -->
        <organization-contact :contact-points="data?.contactPoints" />
      </vl-grid>
    </vl-region>
  </vl-layout>

  <content-footer />
</template>

<script setup lang="ts">
import type { OrganizationData } from '~/types/organization'
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

const { data } = await useAsyncData<OrganizationData | null>(
  `organization-${slug.value}`,
  async () => {
    try {
      return await $fetch(`/doc/api/organization/${slug.value}`)
    } catch (err) {
      console.error('Error loading organization:', err)
      return null
    }
  },
)

// Redirect to 404 if no data
if (!data?.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Organisatie niet gevonden',
  })
}

useSeoHead({
  title: data.value?.name ?? `Organisatie: ${slug.value}`,
  description: data.value?.description,
})
</script>
