<template>
  <content-header
    title="Perceel"
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
      <vl-grid mod-stacked>
        <vl-column width="12">
          <div class="h1-sublink">
            <vl-title mod-no-space-bottom tag-name="h1">
              {{ data ? `Perceel: ${slug}` : `Perceel: ${slug}` }}
            </vl-title>
            <vl-link @click="copyToClipboard(data?.uri ?? '')">
              {{ data?.uri ?? '' }}
              <vl-icon icon="file-copy"></vl-icon>
            </vl-link>
          </div>
        </vl-column>

        <vl-column width="12">
          <action-buttons :source="data?.source ?? ''" />
        </vl-column>

        <vl-column width="12">
          <vl-data-table>
            <tbody>
              <tr v-if="data?.status">
                <td>
                  <vl-link :href="data.fieldUris.status" external>
                    Status
                  </vl-link>
                </td>
                <td>
                  <vl-link :href="data.status.uri">
                    {{ data.status.label }}
                  </vl-link>
                </td>
              </tr>
            </tbody>
          </vl-data-table>
        </vl-column>

        <template v-if="data?.identificator">
          <vl-column width="12">
            <vl-title tag-name="h2" mod-h2>Identificator</vl-title>
          </vl-column>
          <vl-column width="12">
            <vl-data-table>
              <tbody>
                <tr>
                  <td>
                    <vl-link :href="data.fieldUris.identificator" external>
                      Identificator
                    </vl-link>
                  </td>
                  <td>{{ data.identificator.lokaleIdentificator ?? slug }}</td>
                </tr>
              </tbody>
            </vl-data-table>
          </vl-column>
        </template>

        <template v-if="data?.adressen && data.adressen.length > 0">
          <vl-column width="12">
            <vl-title tag-name="h2" mod-h2>Adressen</vl-title>
          </vl-column>
          <vl-column width="12">
            <vl-data-table>
              <tbody>
                <tr v-for="(item, index) in data.adressen" :key="index">
                  <td>
                    <vl-link :href="data.fieldUris.adressen" external>
                      Adres
                    </vl-link>
                  </td>
                  <td>
                    <vl-link
                      :href="`/doc/adres/${extractId(item.uri)}`"
                    >
                      {{ extractId(item.uri) }}
                    </vl-link>
                  </td>
                </tr>
              </tbody>
            </vl-data-table>
          </vl-column>
        </template>
      </vl-grid>
    </vl-region>
  </vl-layout>
  <content-footer />
</template>

<script setup lang="ts">
import type { PerceelData } from '~/types/perceel'
import { useSeoHead } from '~/composables/useSEO'

const showToaster = ref(false)

const route = useRoute()
const slug = computed(() => {
  const params = route.params.slug
  return Array.isArray(params) ? params.join('/') : params
})

const extractId = (uri: string) => uri.split('/').pop() ?? uri

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

const { data } = await useAsyncData<PerceelData | null>(
  `perceel-${slug.value}`,
  async () => {
    try {
      return await $fetch(`/doc/api/perceel/${slug.value}`)
    } catch (err) {
      console.error('Error loading perceel:', err)
      return null
    }
  },
)

if (!data?.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Perceel niet gevonden',
  })
}

useSeoHead({
  title: `Perceel: ${slug.value}`,
  description: `Perceel ${slug.value}`,
})
</script>
