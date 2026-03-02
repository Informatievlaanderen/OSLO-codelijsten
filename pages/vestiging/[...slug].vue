<template>
  <content-header
    title="Vestiging"
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
              {{ `Vestiging: ${slug}` }}
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
              <tr v-if="data?.uri">
                <td><strong>URI</strong></td>
                <td>
                  <vl-link :href="data.uri" external>
                    {{ data.uri }}
                  </vl-link>
                </td>
              </tr>
              <tr v-if="data?.type">
                <td><strong>Type</strong></td>
                <td>
                  <vl-link :href="data.type" external>
                    {{ data.type }}
                  </vl-link>
                </td>
              </tr>
              <tr v-if="data?.created">
                <td><strong>Aangemaakt op</strong></td>
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
                  <td><strong>Toegekend op</strong></td>
                  <td>{{ data.registration.issued }}</td>
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
import type { KBOBranchData } from '~/types/KBO'
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
if (!data?.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Vestiging niet gevonden',
  })
}

useSeoHead({
  title: `Vestiging: ${slug.value}`,
})
</script>
