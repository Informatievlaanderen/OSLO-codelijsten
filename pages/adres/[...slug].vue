<template>
  <content-header
    title="Adres"
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
              {{ data?.volledigAdres ?? `Adres: ${slug}` }}
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
              <tr v-if="data?.volledigAdres">
                <td>
                  <vl-link :href="data.fieldUris.volledigAdres" external>
                    Volledig adres
                  </vl-link>
                </td>
                <td>{{ data.volledigAdres }}</td>
              </tr>
              <tr v-if="data?.straatnaam">
                <td>
                  <vl-link :href="data.fieldUris.straatnaam" external>
                    Straatnaam
                  </vl-link>
                </td>
                <td>
                  <vl-link
                    v-if="data.straatnaam.uri"
                    :href="`/doc/straatnaam/${extractId(data.straatnaam.uri)}`"
                  >
                    {{ data.straatnaam.label ?? data.straatnaam.uri }}
                  </vl-link>
                  <template v-else>{{ data.straatnaam.label }}</template>
                </td>
              </tr>
              <tr v-if="data?.huisnummer">
                <td>
                  <vl-link :href="data.fieldUris.huisnummer" external>
                    Huisnummer
                  </vl-link>
                </td>
                <td>{{ data.huisnummer }}</td>
              </tr>
              <tr v-if="data?.postinfo">
                <td>
                  <vl-link :href="data.fieldUris.postinfo" external>
                    Postinfo
                  </vl-link>
                </td>
                <td>
                  <vl-link
                    v-if="data.postinfo.uri"
                    :href="`/doc/postinfo/${extractId(data.postinfo.uri)}`"
                  >
                    {{ extractId(data.postinfo.uri) }}
                  </vl-link>
                </td>
              </tr>
              <tr v-if="data?.gemeentenaam">
                <td>
                  <vl-link :href="data.fieldUris.gemeentenaam" external>
                    Gemeentenaam
                  </vl-link>
                </td>
                <td>
                  <vl-link
                    v-if="data.gemeentenaam.uri"
                    :href="`/doc/gemeente/${extractId(data.gemeentenaam.uri)}`"
                  >
                    {{ data.gemeentenaam.label ?? data.gemeentenaam.uri }}
                  </vl-link>
                  <template v-else>{{ data.gemeentenaam.label }}</template>
                </td>
              </tr>
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
              <tr v-if="data?.officieelToegekend !== undefined">
                <td>
                  <vl-link :href="data.fieldUris.officieelToegekend" external>
                    Officieel toegekend
                  </vl-link>
                </td>
                <td>{{ data.officieelToegekend ? 'Ja' : 'Nee' }}</td>
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

        <template v-if="data?.positie">
          <vl-column width="12">
            <vl-title tag-name="h2" mod-h2>Positie</vl-title>
          </vl-column>
          <vl-column width="12">
            <vl-data-table>
              <tbody>
                <tr v-if="data.positie.methode">
                  <td>
                    <vl-link :href="data.fieldUris.methode" external>
                      Geometriemethode
                    </vl-link>
                  </td>
                  <td>
                    <vl-link :href="data.positie.methode.uri">
                      {{ data.positie.methode.label }}
                    </vl-link>
                  </td>
                </tr>
                <tr v-if="data.positie.specificatie">
                  <td>
                    <vl-link :href="data.fieldUris.specificatie" external>
                      Geometriespecificatie
                    </vl-link>
                  </td>
                  <td>
                    <vl-link :href="data.positie.specificatie.uri">
                      {{ data.positie.specificatie.label }}
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
import type { AdresData } from '~/types/adres'
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

const { data } = await useAsyncData<AdresData | null>(
  `adres-${slug.value}`,
  async () => {
    try {
      return await $fetch(`/doc/api/adres/${slug.value}`)
    } catch (err) {
      console.error('Error loading adres:', err)
      return null
    }
  },
)

if (!data?.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Adres niet gevonden',
  })
}

useSeoHead({
  title: data.value?.volledigAdres ?? `Adres: ${slug.value}`,
  description: `Adres ${data.value?.volledigAdres ?? slug.value}`,
})
</script>
