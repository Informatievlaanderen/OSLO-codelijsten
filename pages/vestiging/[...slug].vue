<template>
  <content-header
    title="Vestiging"
    href="https://www.vlaanderen.be/digitaal-vlaanderen"
  />

  <vl-toaster v-if="showToaster" mod-top-right fade-out>
    <vl-alert mod-small mod-success icon="check-circle" mod-fade-out title="URI gekopiëerd" />
  </vl-toaster>

  <vl-layout>
    <vl-region>
      <!-- Content -->
      <vl-grid mod-stacked>
        <!-- Header Section - always visible -->
        <vl-column width="12">
          <div class="h1-sublink">
            <vl-title mod-no-space-bottom tag-name="h1">
              {{
                data?.wettelijkeNaam
                  ? data.wettelijkeNaam.value
                  : `Vestiging: ${slug}`
              }}
            </vl-title>
            <vl-link @click="copyToClipboard(data?.uri ?? `https://data.vlaanderen.be/id/vestiging/${slug}`)">
              {{ data?.uri ?? `https://data.vlaanderen.be/id/vestiging/${slug}` }}
              <vl-icon icon="file-copy"></vl-icon>
            </vl-link>
          </div>
        </vl-column>

        <!-- Action Buttons -->
        <vl-column width="12">
          <action-buttons :source="data?.source ?? ''" />
        </vl-column>

        <!-- Content -->
        <template v-if="data">

        <!-- Basic Information -->
        <vl-column width="12">
          <vl-data-table>
            <tbody>
              <tr v-if="data?.wettelijkeNaam">
                <td>
                  <vl-link :href="data.fieldUris.wettelijkeNaam" external>
                    Wettelijke naam
                  </vl-link>
                </td>
                <td>{{ data.wettelijkeNaam.value }}</td>
              </tr>
              <tr v-if="data?.voorkeursnaam">
                <td>
                  <vl-link :href="data.fieldUris.voorkeursnaam" external>
                    Voorkeursnaam
                  </vl-link>
                </td>
                <td>{{ data.voorkeursnaam.value }}</td>
              </tr>
              <tr v-if="data?.alternatieveNaam?.length">
                <td>
                  <vl-link :href="data.fieldUris.alternatieveNaam" external>
                    Alternatieve naam
                  </vl-link>
                </td>
                <td>
                  <div v-for="name in data.alternatieveNaam" :key="name.value">
                    {{ name.value }}
                  </div>
                </td>
              </tr>
              <tr v-if="data?.rechtstoestand">
                <td>
                  <vl-link :href="data.fieldUris.rechtstoestand" external>
                    Rechtstoestand
                  </vl-link>
                </td>
                <td>
                  <vl-link :href="data.rechtstoestand.uri">{{
                    data.rechtstoestand.label
                  }}</vl-link>
                </td>
              </tr>
              <tr v-if="data?.rechtsvorm">
                <td>
                  <vl-link :href="data.fieldUris.rechtsvorm" external>
                    Rechtsvorm
                  </vl-link>
                </td>
                <td>
                  <vl-link :href="data.rechtsvorm.uri">{{
                    data.rechtsvorm.label
                  }}</vl-link>
                </td>
              </tr>
              <tr v-if="data?.parentOrganisatie">
                <td>
                  <vl-link :href="data.fieldUris.parentOrganisatie" external>
                    Onderneming
                  </vl-link>
                </td>
                <td>
                  <vl-link :href="`/doc/onderneming/${data.parentOrganisatie}`">
                    {{ data.parentOrganisatie }}
                  </vl-link>
                </td>
              </tr>
              <tr v-if="data?.activiteiten?.length">
                <td>
                  <vl-link :href="data.fieldUris.activiteit" external>
                    Activiteit
                  </vl-link>
                </td>
                <td>
                  <div v-for="activiteit in data.activiteiten" :key="activiteit.uri">
                    <vl-link :href="activiteit.uri" external>
                      {{ activiteit.label ?? activiteit.uri }}
                    </vl-link>
                  </div>
                </td>
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
                  <td>
                    <vl-link :href="data.fieldUris.identificator" external>
                      Identificator
                    </vl-link>
                  </td>
                  <td>{{ data.identificator.identificator }}</td>
                </tr>
                <tr v-if="data.identificator.toegekendOp">
                  <td>
                    <vl-link :href="data.fieldUris.toegekendOp" external>
                      Toegekend op
                    </vl-link>
                  </td>
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
                <th v-if="data?.oprichting">
                  <vl-title tag-name="h4" mod-h4>Oprichting</vl-title>
                </th>
                <tr v-if="data?.oprichting">
                  <td>
                    <vl-link :href="data.fieldUris.oprichting" external>
                      Datum
                    </vl-link>
                  </td>
                  <td>{{ data.oprichting.datum }}</td>
                </tr>
                <th v-if="data?.stopzetting">
                  <vl-title tag-name="h4" mod-h4>Stopzetting</vl-title>
                </th>
                <tr v-if="data?.stopzetting">
                  <td>
                    <vl-link :href="data.fieldUris.stopzetting" external>
                      Datum
                    </vl-link>
                  </td>
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
        <!-- Contact Points -->
        <template v-if="data?.contactPoints?.length">
          <vl-column width="12">
            <vl-title tag-name="h2" mod-h3>Contactinfo</vl-title>
          </vl-column>
          <template v-for="contact in data.contactPoints" :key="contact.id">
            <!-- if keys are less than 0, it means that there is a contact point with just an ID. That can be ignored -->
            <vl-column
              v-if="Object.keys(contact).length > 1"
              width="6"
              width-s="12"
            >
              <vl-info-tile>
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
                  <p v-if="contact.gsm">
                    <vl-icon icon="phone" mod-before></vl-icon>
                    <vl-link :href="`tel:${contact.gsm}`">
                      {{ contact.gsm }}
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
        </template>
      </template>
      </vl-grid>
    </vl-region>
  </vl-layout>

  <content-footer />
</template>

<script setup lang="ts">
import type { KBOBranchData } from '~/types/KBO'
import { useSeoHead } from '~/composables/useSEO'

const showToaster = ref(false)

const route = useRoute()
const slug = computed(() => {
  const params = route.params.slug
  return Array.isArray(params) ? params.join('/') : params
})

const { data } = await useAsyncData<KBOBranchData | null>(
  `branch-${slug.value}`,
  async () => {
    try {
      return await $fetch(`/doc/api/branch/${slug.value}`)
    } catch (err) {
      console.error('Error loading branch:', err)
      return null
    }
  },
)

// Redirect to 404 if no data
if (!data.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Vestiging niet gevonden',
  })
}

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

useSeoHead({
  title: data.value?.wettelijkeNaam?.value ?? `Vestiging: ${slug.value}`,
})
</script>
