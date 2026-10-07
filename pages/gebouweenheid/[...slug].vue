<template>
  <content-header
    title="Gebouweenheid"
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
              {{ data ? `${slug}` : `Gebouweenheid: ${slug}` }}
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
          <vl-title tag-name="h2" mod-h2>Gebouweenheid</vl-title>
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
              <tr v-if="data?.functie">
                <td>
                  <vl-link :href="data.fieldUris.functie" external>
                    Functie
                  </vl-link>
                </td>
                <td>
                  <vl-link :href="data.functie.uri">
                    {{ data.functie.label }}
                  </vl-link>
                </td>
              </tr>
              <tr v-if="data?.isDeelVan">
                <td>
                  <vl-link :href="data.fieldUris.isDeelVan" external>
                    IsDeelVan
                  </vl-link>
                </td>
                <td>
                  <vl-link
                    :href="`/doc/gebouw/${extractId(data.isDeelVan.uri)}`"
                  >
                    {{ extractId(data.isDeelVan.uri) }}
                  </vl-link>
                </td>
              </tr>
              <tr v-if="data?.afwijkingVastgesteld !== undefined">
                <td>
                  <vl-link :href="data.fieldUris.afwijkingVastgesteld" external>
                    AfwijkingVastgesteld
                  </vl-link>
                </td>
                <td>{{ data.afwijkingVastgesteld ? 'Ja' : 'Nee' }}</td>
              </tr>
            </tbody>
          </vl-data-table>
        </vl-column>

        <identificator
          :identificator="data?.identificator"
          :fieldUris="data?.fieldUris"
          :slug="slug"
        />

        <template v-if="data?.positie">
          <vl-column width="12">
            <vl-title tag-name="h2" mod-h2>Positie</vl-title>
          </vl-column>

          <GeopuntLink
            :centroid="data?.centroid"
            :geopunt-url="data?.geopuntUrl"
            :field-uri="data?.fieldUris.positie ?? ''"
          >
            <tr v-if="data.positie.methode">
              <td>
                <vl-link :href="data.fieldUris.methode" external>
                  Methode
                </vl-link>
              </td>
              <td>
                <vl-link :href="data.positie.methode.uri">
                  {{ data.positie.methode.label }}
                </vl-link>
              </td>
            </tr>
          </GeopuntLink>

          <GeopuntEmbed :src="data?.geopuntEmbedUrl" />
        </template>

        <template v-if="data?.toegekendAdres && data.toegekendAdres.length > 0">
          <vl-column width="12">
            <vl-title tag-name="h2" mod-h2>Toegekend adres</vl-title>
          </vl-column>
          <vl-column width="12">
            <vl-data-table>
              <tbody>
                <tr v-for="(item, index) in data.toegekendAdres" :key="index">
                  <td>
                    <vl-link :href="data.fieldUris.toegekendAdres" external>
                      Adres
                    </vl-link>
                  </td>
                  <td>
                    <vl-link :href="`/doc/adres/${extractId(item.uri)}`">
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
import type { GebouweenheidData } from '~/types/gebouweenheid'
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

const { data } = await useAsyncData<GebouweenheidData | null>(
  `gebouweenheid-${slug.value}`,
  async () => {
    try {
      return await $fetch(`/doc/api/gebouweenheid/${slug.value}`)
    } catch (err) {
      console.error('Error loading gebouweenheid:', err)
      return null
    }
  },
)

if (!data?.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Gebouweenheid niet gevonden',
  })
}

useSeoHead({
  title: `Gebouweenheid: ${slug.value}`,
  description: `Gebouweenheid ${slug.value}`,
})
</script>
