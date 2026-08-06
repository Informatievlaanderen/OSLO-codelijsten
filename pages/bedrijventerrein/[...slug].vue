<template>
  <content-header
    title="Bedrijventerrein"
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
              {{ data?.name ?? `Bedrijventerrein: ${slug}` }}
            </vl-title>
            <vl-link @click="copyToClipboard(data?.uri ?? '')">
              <vl-icon icon="file-copy" mod-before></vl-icon>
              {{ data?.uri ?? '' }}
            </vl-link>
          </div>
        </vl-column>

        <vl-column width="12">
          <action-buttons :source="data?.source ?? ''" :sparql-query="sparqlQuery">
            <a href="/doc/bedrijventerrein"
              ><vl-button type="button">Terug naar overzicht</vl-button></a
            >
          </action-buttons>
        </vl-column>

        <bedrijventerrein-info v-if="data" :bedrijventerrein="data" />
      </vl-grid>
    </vl-region>
  </vl-layout>

  <content-footer />
</template>

<script setup lang="ts">
import type { Bedrijventerrein } from '~/types/bedrijventerrein'
import { BEDRIJVENTERREIN_BY_ID_QUERY } from '~/constants/bedrijventerrein.constants'
import { useSeoHead } from '~/composables/useSEO'

const showToaster = ref(false)

const route = useRoute()
const slug = computed(() => {
  const params = route.params.slug
  return Array.isArray(params) ? params.join('/') : params
})

const sparqlQuery = computed(() => BEDRIJVENTERREIN_BY_ID_QUERY(slug.value))

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

const { data } = await useAsyncData<Bedrijventerrein | null>(
  `bedrijventerrein-${slug.value}`,
  async () => {
    try {
      return await $fetch(`/doc/api/bedrijventerrein/${slug.value}`)
    } catch (err) {
      console.error('Error loading bedrijventerrein:', err)
      return null
    }
  },
)

if (!data?.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Bedrijventerrein niet gevonden',
  })
}

useSeoHead({
  title: data.value?.name ?? `Bedrijventerrein: ${slug.value}`,
  description: `Bedrijventerrein ${data.value?.name ?? slug.value}`,
})
</script>
