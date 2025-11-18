<template>
  <vl-column width="12">
    <vl-title tag-name="h2" mod-h3>Gegevens</vl-title>
    <vl-properties mod-bordered>
      <vl-properties-title>Concepteigenschappen</vl-properties-title>
      <vl-properties-column>
        <vl-properties-list>
          <vl-properties-label>
            <vl-link
              href="https://www.w3.org/2009/08/skos-reference/skos.html#prefLabel"
              external
            >
              Label
            </vl-link>
          </vl-properties-label>
          <vl-properties-data>
            {{ concept?.label ?? 'Niet beschikbaar' }}
          </vl-properties-data>

          <vl-properties-label>
            <vl-link
              href="https://www.w3.org/2009/08/skos-reference/skos.html#definition"
              external
            >
              Definitie
            </vl-link>
          </vl-properties-label>
          <vl-properties-data>
            {{ concept?.definition ?? 'Niet beschikbaar' }}
          </vl-properties-data>

          <vl-properties-label>
            <vl-link
              href="https://www.w3.org/2009/08/skos-reference/skos.html#note"
              external
            >
              Aanvullende informatie
            </vl-link>
          </vl-properties-label>
          <vl-properties-data>
            {{ concept?.additionalInfo ?? 'Niet beschikbaar' }}
          </vl-properties-data>
          <vl-properties-label>
            <vl-link
              href="https://www.w3.org/2009/08/skos-reference/skos.html#topConceptOf"
              external
            >
              Concept in schema
            </vl-link>
          </vl-properties-label>
          <vl-properties-data>
            <template v-if="concept?.topConceptOf?.length">
              <vl-link
                v-for="scheme in concept.topConceptOf"
                :key="scheme.id"
                :href="scheme.uri"
                external
                class="link--icon--caret vl-u-display-block"
              >
                {{ scheme.label }}
              </vl-link>
            </template>
            <span v-else>Niet beschikbaar</span>
          </vl-properties-data>

          <vl-properties-label>
            <vl-link href="https://www.w3.org/ns/adms#status" external>
              Status
            </vl-link>
          </vl-properties-label>
          <vl-properties-data>
            <vl-link v-if="concept?.status">
              {{ concept.status }}
            </vl-link>
            <span v-else>Niet beschikbaar</span>
          </vl-properties-data>
        </vl-properties-list>
      </vl-properties-column>
      <vl-properties-column>
        <vl-properties-list>
          <vl-properties-label>
            <vl-link
              href="https://www.w3.org/2009/08/skos-reference/skos.html#notation"
              external
            >
              Notatie
            </vl-link>
          </vl-properties-label>
          <vl-properties-data>
            {{ concept?.notation ?? 'Niet beschikbaar' }}
          </vl-properties-data>

          <vl-properties-label>
            <vl-link
              href="https://www.w3.org/2009/08/skos-reference/skos.html#narrower"
              external
            >
              Beperktere betekenis
            </vl-link>
          </vl-properties-label>
          <vl-properties-data>
            <template v-if="concept?.narrower?.length">
              <vl-link
                v-for="narrower in concept.narrower"
                :key="narrower.id"
                :href="narrower.uri"
                external
                class="vl-u-display-block"
              >
                {{ narrower.label }}
              </vl-link>
            </template>
            <span v-else>Niet beschikbaar</span>
          </vl-properties-data>

          <vl-properties-label>
            <vl-link
              href="https://www.w3.org/2009/08/skos-reference/skos.html#broader"
              external
            >
              Bredere betekenis
            </vl-link>
          </vl-properties-label>
          <vl-properties-data>
            <template v-if="concept?.broader?.length">
              <vl-link
                v-for="broader in concept.broader"
                :key="broader.id"
                :href="broader.uri"
                external
                class="vl-u-display-block"
              >
                {{ broader.label }}
              </vl-link>
            </template>
            <span v-else>Niet beschikbaar</span>
          </vl-properties-data>
          <vl-properties-label>
            <vl-link
              href="https://www.w3.org/2009/08/skos-reference/skos.html#inScheme"
              external
            >
              Onderdeel van schema
            </vl-link>
          </vl-properties-label>
          <vl-properties-data>
            <template v-if="concept?.inScheme?.length">
              <vl-link
                v-for="scheme in concept.inScheme"
                :key="scheme.id"
                :href="scheme.uri"
                external
              >
                {{ scheme.label }}
              </vl-link>
            </template>
            <span v-else>Niet beschikbaar</span>
          </vl-properties-data>

          <vl-properties-label>dataset</vl-properties-label>
          <vl-properties-data>
            <vl-link v-if="concept?.dataset" :href="concept.dataset" external>
              {{ concept.dataset }}
            </vl-link>
            <span v-else>Niet beschikbaar</span>
          </vl-properties-data>
        </vl-properties-list>
      </vl-properties-column>
    </vl-properties>
  </vl-column>
</template>

<script setup lang="ts" name="conceptInfo">
import type { Concept } from '~/types/concept'

interface Props {
  concept?: Concept
}

defineProps<Props>()
</script>
