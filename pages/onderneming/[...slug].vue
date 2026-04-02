<template>
  <content-header
    title="Onderneming"
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
              {{
                data?.wettelijkeNaam
                  ? data.wettelijkeNaam
                  : `Onderneming: ${slug}`
              }}
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
              @click="() => openSource(data?.source ?? '')"
              mod-secondary
              mod-small
            >
              <vl-icon icon="download-harddisk" mod-before></vl-icon>
              Bekijk brondata
            </vl-button>
          </vl-action-group>
        </vl-column>

        <!-- Basic Information -->
        <vl-column width="12">
          <vl-title tag-name="h2" mod-h3>Informatie</vl-title>
        </vl-column>
        <vl-column width="12">
          <vl-data-table>
            <tbody>
              <tr v-if="data?.types?.length">
                <td><strong>Type</strong></td>
                <td>{{ data.types.join(', ') }}</td>
              </tr>
              <tr v-if="data?.wettelijkeNaam">
                <td><strong>Wettelijke naam</strong></td>
                <td>{{ data.wettelijkeNaam }}</td>
              </tr>
              <tr v-if="data?.voorkeursnaam">
                <td><strong>Voorkeursnaam</strong></td>
                <td>{{ data.voorkeursnaam }}</td>
              </tr>
              <tr v-if="data?.alternatieveNaam?.length">
                <td><strong>Alternatieve naam</strong></td>
                <td>
                  <div v-for="name in data.alternatieveNaam" :key="name">
                    {{ name }}
                  </div>
                </td>
              </tr>
              <tr v-if="data?.organisatieType">
                <td><strong>Type entiteit</strong></td>
                <td>{{ data.organisatieType }}</td>
              </tr>
              <tr v-if="data?.rechtstoestand">
                <td><strong>Rechtstoestand</strong></td>
                <td>{{ data.rechtstoestand }}</td>
              </tr>
              <tr v-if="data?.rechtsvorm">
                <td><strong>Rechtsvorm</strong></td>
                <td>{{ data.rechtsvorm }}</td>
              </tr>
            </tbody>
          </vl-data-table>
        </vl-column>

        <!-- Identificator -->
        <template v-if="data?.identificator">
          <vl-column width="12">
            <vl-title tag-name="h2" mod-h3>Identificator</vl-title>
          </vl-column>
          <vl-column width="12">
            <vl-data-table>
              <tbody>
                <tr>
                  <td><strong>Identificator</strong></td>
                  <td>{{ data.identificator.identificator }}</td>
                </tr>
                <tr v-if="data.identificator.toegekendOp">
                  <td><strong>Toegekend op</strong></td>
                  <td>{{ data.identificator.toegekendOp }}</td>
                </tr>
              </tbody>
            </vl-data-table>
          </vl-column>
        </template>

        <!-- Oprichting & Stopzetting -->
        <template v-if="data?.oprichting || data?.stopzetting">
          <vl-column width="12">
            <vl-title tag-name="h2" mod-h3>Veranderingsgebeurtenissen</vl-title>
          </vl-column>
          <vl-column width="12">
            <vl-data-table>
              <tbody>
                <tr v-if="data?.oprichting">
                  <td><strong>Oprichting</strong></td>
                  <td>{{ data.oprichting.datum }}</td>
                </tr>
                <tr v-if="data?.stopzetting">
                  <td><strong>Stopzetting</strong></td>
                  <td>
                    {{ data.stopzetting.datum }}
                    <span v-if="data.stopzetting.redenStopzetting">
                      — {{ data.stopzetting.redenStopzetting }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </vl-data-table>
          </vl-column>
        </template>

        <!-- Activiteit -->
        <template v-if="data?.activiteit">
          <vl-column width="12">
            <vl-title tag-name="h2" mod-h3>Activiteit</vl-title>
          </vl-column>
          <vl-column width="12">
            <vl-data-table>
              <tbody>
                <tr>
                  <td><strong>NACE</strong></td>
                  <td>
                    <vl-link :href="data.activiteit.uri" external>
                      {{ data.activiteit.label ?? data.activiteit.uri }}
                    </vl-link>
                  </td>
                </tr>
              </tbody>
            </vl-data-table>
          </vl-column>
        </template>

        <!-- Contact Points -->
        <template v-if="data?.contactPoints?.length">
          <vl-column width="12">
            <vl-title tag-name="h2" mod-h3>Contactgegevens</vl-title>
          </vl-column>
          <vl-column
            v-for="contact in data.contactPoints"
            :key="contact.id"
            width="6"
            width-s="12"
          >
            <vl-info-tile>
              <vl-title tag-name="h4" slot="title">Contactpunt</vl-title>
              <div slot="content">
                <p v-if="contact.email">
                  <vl-icon icon="email" mod-before></vl-icon>
                  <vl-link :href="`mailto:${contact.email}`">
                    {{ contact.email }}
                  </vl-link>
                </p>
                <p v-if="contact.telephone">
                  <vl-icon icon="phone" mod-before></vl-icon>
                  <vl-link :href="`tel:${contact.telephone}`">
                    {{ contact.telephone }}
                  </vl-link>
                </p>
                <address v-if="contact.address">
                  <vl-icon icon="location-map" mod-before></vl-icon>
                  {{ contact.address.thoroughfare }}
                  {{ contact.address.postCode }}
                  {{ contact.address.municipality }}
                  {{ contact.address.country }}
                </address>
              </div>
            </vl-info-tile>
          </vl-column>
        </template>

      </vl-grid>
    </vl-region>
  </vl-layout>

  <content-footer />
</template>

<script setup lang="ts">
import type { KboOrganizationData } from '~/types/KBO'
import { openSource } from '~/utils/utils'
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

const { data } = await useAsyncData<KboOrganizationData | null>(
  `enterprise-${slug.value}`,
  async () => {
    try {
      return await $fetch(`/doc/api/enterprise/${slug.value}`)
    } catch (err) {
      console.error('Error loading enterprise:', err)
      return null
    }
  },
)

// Redirect to 404 if no data
if (!data?.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Onderneming niet gevonden',
  })
}

useSeoHead({
  title: data.value?.wettelijkeNaam ?? `enterprise: ${slug.value}`,
})
</script>
