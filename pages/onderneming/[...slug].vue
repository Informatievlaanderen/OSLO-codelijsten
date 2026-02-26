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
                data?.legalName?.length
                  ? data.legalName[0]
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
              <tr v-if="data?.legalName?.length">
                <td><strong>Juridische naam</strong></td>
                <td>
                  <div v-for="name in data.legalName" :key="name">
                    {{ name }}
                  </div>
                </td>
              </tr>
              <tr v-if="data?.rechtspersoonlijkheid">
                <td><strong>Rechtspersoonlijkheid</strong></td>
                <td>
                  <vl-link :href="data.rechtspersoonlijkheid" external>
                    {{ data.rechtspersoonlijkheid }}
                  </vl-link>
                </td>
              </tr>
              <tr v-if="data?.rechtstoestand">
                <td><strong>Rechtstoestand</strong></td>
                <td>
                  <vl-link :href="data.rechtstoestand" external>
                    {{ data.rechtstoestand }}
                  </vl-link>
                </td>
              </tr>
              <tr v-if="data?.rechtsvorm">
                <td><strong>Rechtsvorm</strong></td>
                <td>
                  <vl-link :href="data.rechtsvorm" external>
                    {{ data.rechtsvorm }}
                  </vl-link>
                </td>
              </tr>
              <tr v-if="data?.created">
                <td><strong>Aangemaakt</strong></td>
                <td>{{ data.created }}</td>
              </tr>
            </tbody>
          </vl-data-table>
        </vl-column>

        <!-- Registration -->
        <template v-if="data?.registration">
          <vl-column width="12">
            <vl-title tag-name="h2" mod-h3>Registratie</vl-title>
          </vl-column>
          <vl-column width="12">
            <vl-data-table>
              <tbody>
                <tr v-if="data.registration.notation">
                  <td><strong>Identificator</strong></td>
                  <td>{{ data.registration.notation }}</td>
                </tr>
                <tr v-if="data.registration.creator">
                  <td><strong>Bron</strong></td>
                  <td>
                    <vl-link :href="data.registration.creator" external>
                      {{ data.registration.creator }}
                    </vl-link>
                  </td>
                </tr>
                <tr v-if="data.registration.schemaAgency">
                  <td><strong>Toegekend door</strong></td>
                  <td>{{ data.registration.schemaAgency }}</td>
                </tr>
                <tr v-if="data.registration.issued">
                  <td><strong>Toegekend Op</strong></td>
                  <td>{{ data.registration.issued }}</td>
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
                <p v-if="contact.type?.length">
                  <strong>Type: </strong>
                  <span v-for="(t, i) in contact.type" :key="t">
                    <vl-link :href="t" external>{{ t }}</vl-link>
                    <span v-if="i < contact.type.length - 1">, </span>
                  </span>
                </p>
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

        <!-- Registered Sites -->
        <template v-if="data?.registeredSites?.length">
          <vl-column width="12">
            <vl-title tag-name="h2" mod-h3>Vestigingen</vl-title>
          </vl-column>
          <vl-column width="12">
            <vl-data-table>
              <thead>
                <tr>
                  <th>URI</th>
                  <th>Aangemaakt op</th>
                  <th>Notatie</th>
                  <th>Toegekend door</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="site in data.registeredSites" :key="site.uri">
                  <td>
                    <vl-link :href="site.uri" external>
                      {{ site.uri }}
                    </vl-link>
                  </td>
                  <td>{{ site.created ?? '-' }}</td>
                  <td>{{ site.registration?.notation ?? '-' }}</td>
                  <td>{{ site.registration?.schemaAgency ?? '-' }}</td>
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
import type { KboData } from '~/types/KBO'
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

const { data } = await useAsyncData<KboData | null>(
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
  title: data.value?.legalName?.[0] ?? `enterprise: ${slug.value}`,
})
</script>
