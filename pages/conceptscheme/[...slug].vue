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

        <concept-scheme-info v-if="data" :concept-scheme="data" />
        <concept-scheme-concepts :top-concepts="data?.topConcepts" />
        <actions :downloads="data?.downloads ?? []" name="conceptschema" />
      </vl-grid>
    </vl-region>
  </vl-layout>

  <content-footer />
</template>

<script setup lang="ts">
import { useConceptSchemeService } from '~/services/comunica.service'
import actions from '~/components/actions/actions.vue'
import type { ConceptScheme } from '~/types/conceptScheme'

const route = useRoute()
const slug = computed(() => route.params.slug as string)

const { data } = await useAsyncData<ConceptScheme | null>(
  'conceptscheme',
  async () => {
    const conceptSchemeService = useConceptSchemeService()

    const data = await conceptSchemeService.getConceptScheme(
      slug?.value?.toString(),
    )

    return data
  },
)

// Redirect to 404 in case of no data
if (!data?.value?.label) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page not found',
  })
}
</script>
