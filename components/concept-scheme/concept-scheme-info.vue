<template>
  <vl-column width="12">
    <vl-title tag-name="h2" mod-h3>Gegevens</vl-title>
    <vl-properties mod-bordered>
      <vl-properties-column>
        <vl-properties-list>
          <vl-properties-label>
            <vl-link
              href="https://www.w3.org/2009/08/skos-reference/skos.html#prefLabel"
              external
            >
              label
            </vl-link>
          </vl-properties-label>
          <vl-properties-data>
            {{ conceptScheme?.label ?? 'Niet beschikbaar' }}
          </vl-properties-data>

          <vl-properties-label>
            <vl-link
              href="https://www.w3.org/2009/08/skos-reference/skos.html#definition"
              external
            >
              definition
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
            <vl-link href="https://www.w3.org/ns/adms#status" external>
              status
            </vl-link>
          </vl-properties-label>
          <vl-properties-data>
            <vl-link v-if="conceptScheme?.status">
              {{ conceptScheme.status }}
            </vl-link>
            <span v-else>Niet beschikbaar</span>
          </vl-properties-data>

          <vl-properties-label>dataset</vl-properties-label>
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
