<template>
  <vl-column width="12">
    <vl-title tag-name="h2" mod-h3>Licentie Informatie</vl-title>
    <vl-properties mod-bordered>
      <vl-properties-column>
        <vl-properties-list>
          <vl-properties-label>
            <vl-link href="http://purl.org/dc/terms/title" external>
              Titel
            </vl-link>
          </vl-properties-label>
          <vl-properties-data>
            {{ license?.title ?? 'Niet beschikbaar' }}
          </vl-properties-data>

          <vl-properties-label>
            <vl-link href="http://purl.org/dc/terms/description" external>
              Beschrijving
            </vl-link>
          </vl-properties-label>
          <vl-properties-data>
            {{ license?.description ?? 'Niet beschikbaar' }}
          </vl-properties-data>

          <vl-properties-label>
            <vl-link href="http://www.w3.org/2002/07/owl#versionInfo" external>
              Versie
            </vl-link>
          </vl-properties-label>
          <vl-properties-data>
            {{ license?.versionInfo ?? 'Niet beschikbaar' }}
          </vl-properties-data>
        </vl-properties-list>
      </vl-properties-column>

      <vl-properties-column>
        <vl-properties-list>
          <template v-if="license?.type?.length">
            <vl-properties-label>
              <vl-link href="http://purl.org/dc/terms/type" external>
                Licentietype
              </vl-link>
            </vl-properties-label>
            <vl-properties-data>
              <div v-for="type in license.type" :key="type">
                <vl-link :href="type" external>
                  {{ type }}
                </vl-link>
              </div>
            </vl-properties-data>
          </template>

          <template v-if="license?.requires?.length">
            <vl-properties-label>
              <vl-link href="https://creativecommons.org/ns#requires" external>
                Vereisten
              </vl-link>
            </vl-properties-label>
            <vl-properties-data>
              <vl-link :href="requirement" v-for="requirement in license.requires" :key="requirement">
                {{ requirement }}
              </vl-link>
            </vl-properties-data>
          </template>

          <template v-if="license?.sameAs">
            <vl-properties-label>
              <vl-link href="http://www.w3.org/2002/07/owl#sameAs" external>
                Equivalent
              </vl-link>
            </vl-properties-label>
            <vl-properties-data>
              <vl-link :href="license.sameAs" external>
                {{ license.sameAs }}
              </vl-link>
            </vl-properties-data>
          </template>
        </vl-properties-list>
      </vl-properties-column>
    </vl-properties>

    <!-- See Also / References Section -->
    <template v-if="license?.seeAlso?.length">
      <vl-properties mod-bordered mod-full-width>
        <vl-properties-title>Meer Informatie</vl-properties-title>
        <vl-properties-column>
          <vl-properties-list>
            <vl-properties-label>
              <vl-link
                href="http://www.w3.org/2000/01/rdf-schema#seeAlso"
                external
              >
                Verwijzingen
              </vl-link>
            </vl-properties-label>
            <vl-properties-data>
              <div v-for="link in license.seeAlso" :key="link">
                <vl-link :href="link" external class="vl-u-display-block">
                  {{ link }}
                </vl-link>
              </div>
            </vl-properties-data>
          </vl-properties-list>
        </vl-properties-column>
      </vl-properties>
    </template>
  </vl-column>
</template>

<script setup lang="ts" name="licenseInfo">
import type { License } from '~/types/license'

interface Props {
  license?: License
}

defineProps<Props>()
</script>
