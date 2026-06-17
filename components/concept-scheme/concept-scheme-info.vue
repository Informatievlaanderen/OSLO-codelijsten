<template>
  <vl-column width="12">
    <vl-title tag-name="h2" mod-h3>Gegevens</vl-title>
    <vl-properties mod-bordered>
      <vl-properties-column>
        <vl-properties-list>
          <vl-properties-label>
            <vl-link
              href="http://www.w3.org/2004/02/skos/core#prefLabel"
              external
            >
              Label
            </vl-link>
          </vl-properties-label>
          <vl-properties-data>
            {{ conceptScheme?.label ?? 'Niet beschikbaar' }}
          </vl-properties-data>

          <vl-properties-label>
            <vl-link
              href="http://www.w3.org/2004/02/skos/core#definition"
              external
            >
              Definitie
            </vl-link>
          </vl-properties-label>
          <vl-properties-data>
            {{ conceptScheme?.definition ?? 'Niet beschikbaar' }}
          </vl-properties-data>
        </vl-properties-list>
      </vl-properties-column>
      <vl-properties-column>
        <vl-properties-list>
          <vl-properties-label>
            <vl-link href="http://www.w3.org/ns/adms#status" external>
              Status
            </vl-link>
          </vl-properties-label>
          <vl-properties-data>
            <vl-link
              v-if="conceptScheme?.status"
              :href="conceptScheme.status"
              external
            >
              <span
                v-if="
                  getStatusLabel(
                    conceptScheme.status,
                    conceptScheme.statusLabel,
                  )
                "
                :class="['status-pill', getStatusClass(conceptScheme.status)]"
              >
                {{
                  getStatusLabel(
                    conceptScheme.status,
                    conceptScheme.statusLabel,
                  )
                }}
              </span>
            </vl-link>
            <span v-else>Niet beschikbaar</span>
          </vl-properties-data>

          <vl-properties-label>Dataset</vl-properties-label>
          <vl-properties-data>
            <vl-link
              v-if="conceptScheme?.dataset"
              :href="conceptScheme.dataset"
              external
            >
              {{ conceptScheme.dataset }}
            </vl-link>
            <span v-else>Niet beschikbaar</span>
          </vl-properties-data>
        </vl-properties-list>
      </vl-properties-column>
    </vl-properties>
  </vl-column>
</template>

<script setup lang="ts" name="conceptSchemeInfo">
import type { ConceptScheme } from '~/types/conceptScheme'

interface Props {
  conceptScheme?: ConceptScheme
}

defineProps<Props>()
</script>
<style scoped lang="scss" src="./style.scss" />
