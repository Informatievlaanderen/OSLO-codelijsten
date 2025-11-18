<template>
  <content-header
    title="Concept"
    href="https://www.vlaanderen.be/digitaal-vlaanderen"
  />

  <vl-layout>
    <vl-region>
      <vl-grid mod-v-center mod-stacked>
        <vl-column width="12">
          <div class="h1-sublink">
            <vl-title mod-no-space-bottom tag-name="h1">
              {{ data?.label ?? `Concept: ${slug}` }}
            </vl-title>
            <vl-link :href="data?.uri ?? fullUri" external class="uri-link">
              <vl-icon icon="external" mod-before></vl-icon>
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
import { useConceptSchemeService } from '~/services/comunica.service'
import { openSource } from '~/utils/utils'
import { useSeoHead } from '~/composables/useSEO'

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

const conceptService = useConceptSchemeService()

const { data } = await useAsyncData<Concept | null>('concept', async () => {
  const concept = await conceptService.getConcept(slug?.value?.toString())

  return concept ?? null
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
