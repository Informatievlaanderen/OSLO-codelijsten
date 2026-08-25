<template>
  <content-header
    title="Onderneming"
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
        <!-- Header Section - always visible -->
        <vl-column width="12">
          <div class="h1-sublink">
            <vl-title mod-no-space-bottom tag-name="h1">
              {{ `Onderneming: ${slug}` }}
            </vl-title>
            <vl-link
              @click="
                copyToClipboard(
                  data?.uri ??
                    `https://data.vlaanderen.be/id/onderneming/${slug}`,
                )
              "
            >
              {{
                data?.uri ?? `https://data.vlaanderen.be/id/onderneming/${slug}`
              }}
              <vl-icon icon="file-copy"></vl-icon>
            </vl-link>
          </div>
        </vl-column>

        <!-- Action Buttons -->
        <vl-column width="6">
          <action-buttons :source="data?.source ?? ''" />
        </vl-column>

        <!-- Content -->
        <template v-if="data">
          <!-- Basic Information -->
          <vl-column width="12">
            <vl-data-table>
              <tbody>
                <tr v-if="data?.organisatieType">
                  <td>
                    <vl-link :href="data.fieldUris.type" external>
                      Type
                    </vl-link>
                  </td>
                  <td>
                    <vl-link :href="data.organisatieType.uri">{{
                      data.organisatieType.label
                    }}</vl-link>
                  </td>
                </tr>
                <tr v-if="data?.organisatieStatus">
                  <td>
                    <vl-link :href="data.fieldUris.status" external>
                      Status
                    </vl-link>
                  </td>
                  <td>
                    <vl-link :href="data.organisatieStatus.uri">{{
                      data.organisatieStatus.label
                    }}</vl-link>
                  </td>
                </tr>
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
                <tr v-if="data?.personeelsklasse">
                  <td>
                    <vl-link :href="data.fieldUris.omvang" external>
                      Omvang
                    </vl-link>
                  </td>
                  <td>
                    <vl-link :href="data.personeelsklasse.uri" external>
                      {{
                        data.personeelsklasse.label ?? data.personeelsklasse.uri
                      }}
                    </vl-link>
                  </td>
                </tr>
              </tbody>
            </vl-data-table>
          </vl-column>

          <!-- Identificator -->
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

          <!-- Financieel Rapport -->
          <template v-if="data?.rapportReferentie">
            <vl-column width="12">
              <div class="h1-sublink">
                <vl-title tag-name="h2" mod-no-space-bottom
                  >Financieel Rapport</vl-title
                >
                <div class="uri-copy">
                  <vl-link :href="data.rapportReferentie">
                    {{ data.rapportReferentie }}
                  </vl-link>
                  <vl-icon
                    class="uri-copy"
                    @click="copyToClipboard(data.rapportReferentie)"
                    icon="file-copy"
                  ></vl-icon>
                </div>
              </div>
            </vl-column>
            <vl-column width="12">
              <vl-data-table>
                <tbody>
                  <tr>
                    <td>
                      <vl-link :href="data.fieldUris.type" external>
                        Type
                      </vl-link>
                    </td>
                    <td v-if="data?.rapportType">
                      <vl-link :href="data.rapportType.uri" external>
                        {{ data.rapportType.label ?? data.rapportType.uri }}
                      </vl-link>
                    </td>
                  </tr>
                </tbody>
              </vl-data-table>
            </vl-column>
          </template>

          <!-- Oprichting & Stopzetting -->
          <template v-if="data?.oprichting || data?.stopzetting">
            <vl-column width="12">
              <vl-title tag-name="h2" mod-h2
                >Veranderingsgebeurtenissen</vl-title
              >
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

          <!-- Activiteiten -->
          <template
            v-if="data?.doorhaling"
            v-for="doorhaling in data?.doorhaling"
          >
            <vl-column width="12">
              <vl-title tag-name="h2" mod-h2>Activiteiten</vl-title>
            </vl-column>
            <vl-column width="12">
              <vl-data-table>
                <tbody>
                  <tr>
                    <th>
                      <vl-title tag-name="h4" mod-h4>Doorhaling</vl-title>
                    </th>
                  </tr>
                  <tr v-if="doorhaling.type">
                    <td>
                      <vl-link :href="data.fieldUris.typeDoorhaling" external>
                        Type
                      </vl-link>
                    </td>
                    <td>
                      <vl-link :href="doorhaling.type.uri" external>
                        {{ doorhaling.type.label ?? doorhaling.type.uri }}
                      </vl-link>
                    </td>
                  </tr>
                  <tr v-if="doorhaling.reden">
                    <td>
                      <vl-link :href="data.fieldUris.redenDoorhaling" external>
                        Reden
                      </vl-link>
                    </td>
                    <td>
                      <vl-link :href="doorhaling.reden.uri" external>
                        {{ doorhaling.reden.label ?? doorhaling.reden.uri }}
                      </vl-link>
                    </td>
                  </tr>
                  <tr v-if="doorhaling.tijd?.van">
                    <td>
                      <vl-link :href="data.fieldUris.doorhalingTijd" external>
                        Tijd
                      </vl-link>
                    </td>
                    <td>
                      {{ doorhaling.tijd.van }} -
                      <template v-if="doorhaling.tijd.tot">{{
                        doorhaling.tijd.tot
                      }}</template>
                      <template v-else>heden</template>
                    </td>
                  </tr>
                </tbody>
              </vl-data-table>
            </vl-column>
          </template>

          <!-- Vestigingen -->
          <template v-if="data?.vestigingen?.length">
            <vl-column width="12">
              <vl-title tag-name="h2" mod-h2>Vestigingen</vl-title>
            </vl-column>
            <vl-column width="12">
              <vl-data-table>
                <thead>
                  <tr>
                    <th>Vestigingsnummer</th>
                    <th>Naam</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-if="pagedVestigingen().length"
                    v-for="v in pagedVestigingen()"
                    :key="v.id"
                  >
                    <td>
                      <vl-link :href="`/doc/vestiging/${v.id}`">
                        {{ v.id }}
                      </vl-link>
                    </td>
                    <td>{{ v.naam ?? '-' }}</td>
                    <td>
                      <vl-link v-if="v.status" :href="v.status.uri" external>
                        {{ v.status.label }}
                      </vl-link>
                      <span v-else>-</span>
                    </td>
                  </tr>
                  <tr v-else>
                    <td colspan="4" class="vl-u-align-center">
                      Geen vestigingen gevonden
                    </td>
                  </tr>
                </tbody>
              </vl-data-table>

              <vl-pager v-if="vestigingTotal" mod-align="center">
                <vl-pager-bounds
                  :from="vestigingPaginationFrom?.toString()"
                  :to="vestigingPaginationTo?.toString()"
                  :total="vestigingTotal.toString()"
                  prefix="van"
                />
                <vl-pager-item
                  v-if="vestigingPaginationIndex > 1"
                  a11y-label="previous"
                  label="vorige"
                  type="previous"
                  @click="vestigingSetPreviousPage"
                />
                <vl-pager-item
                  v-if="vestigingHasNextPage"
                  a11y-label="next"
                  type="next"
                  label="volgende"
                  @click="vestigingSetNextPage"
                />
              </vl-pager>
            </vl-column>
          </template>

          <!-- Contact Points -->
          <template v-if="data?.contactPoints?.length">
            <vl-column width="12">
              <vl-title tag-name="h2" mod-h2>Contactinfo</vl-title>
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
import type { KboOrganizationData } from '~/types/KBO'
import { ITEMS_PER_PAGE } from '~/constants/constants'
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

// --- Vestigingen pagination ---
const vestigingPaginationIndex = ref(1)

const vestigingTotal = computed(() => data.value?.vestigingen?.length ?? 0)

const vestigingHasNextPage = computed(() => {
  return vestigingPaginationIndex.value * ITEMS_PER_PAGE < vestigingTotal.value
})

const vestigingPaginationFrom = computed(() => {
  if (vestigingTotal.value === 0) return 0
  return (vestigingPaginationIndex.value - 1) * ITEMS_PER_PAGE + 1
})

const vestigingPaginationTo = computed(() => {
  const to = vestigingPaginationIndex.value * ITEMS_PER_PAGE
  return Math.min(to, vestigingTotal.value)
})

const pagedVestigingen = () => {
  const start = (vestigingPaginationIndex.value - 1) * ITEMS_PER_PAGE
  return (data.value?.vestigingen ?? []).slice(start, start + ITEMS_PER_PAGE)
}

const vestigingSetPreviousPage = () => {
  if (vestigingPaginationIndex.value > 1) vestigingPaginationIndex.value--
}

const vestigingSetNextPage = () => {
  if (vestigingHasNextPage.value) vestigingPaginationIndex.value++
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
if (!data.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Onderneming niet gevonden',
  })
}

useSeoHead({
  title: `Onderneming: ${slug.value}`,
})
</script>
