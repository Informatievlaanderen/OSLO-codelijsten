<template>
  <vl-column width="12">
    <vl-title tag-name="h2" mod-h3>Concepteigenschappen</vl-title>
    <vl-data-table>
      <tbody>
        <tr>
          <td>
            <vl-link
              href="https://www.w3.org/2009/08/skos-reference/skos.html#prefLabel"
              external
            >
              Label
            </vl-link>
          </td>
          <td>{{ concept?.label ?? 'Niet beschikbaar' }}</td>
        </tr>
        <tr>
          <td>
            <vl-link
              href="https://www.w3.org/2009/08/skos-reference/skos.html#definition"
              external
            >
              Definitie
            </vl-link>
          </td>
          <td>{{ concept?.definition ?? 'Niet beschikbaar' }}</td>
        </tr>
        <tr>
          <td>
            <vl-link
              href="https://www.w3.org/2009/08/skos-reference/skos.html#note"
              external
            >
              Aanvullende informatie
            </vl-link>
          </td>
          <td>{{ concept?.additionalInfo ?? 'Niet beschikbaar' }}</td>
        </tr>
        <tr>
          <td>
            <vl-link
              href="https://www.w3.org/2009/08/skos-reference/skos.html#notation"
              external
            >
              Notatie
            </vl-link>
          </td>
          <td>{{ concept?.notation ?? 'Niet beschikbaar' }}</td>
        </tr>
        <tr>
          <td>
            <vl-link href="https://www.w3.org/ns/adms#status" external>
              Status
            </vl-link>
          </td>
          <td>
            <vl-link v-if="concept?.status" :href="concept.status" external>
              <span
                v-if="getStatusLabel(concept.status, concept.statusLabel)"
                :class="['status-pill', getStatusClass(concept.status)]"
              >
                {{ getStatusLabel(concept.status, concept.statusLabel) }}
              </span>
            </vl-link>
            <span v-else>Niet beschikbaar</span>
          </td>
        </tr>
        <tr>
          <td>
            <vl-link
              href="https://www.w3.org/2009/08/skos-reference/skos.html#topConceptOf"
              external
            >
              Concept in schema
            </vl-link>
          </td>
          <td>
            <template v-if="concept?.topConceptOf?.length">
              <ul>
                <li v-for="scheme in concept.topConceptOf" :key="scheme.id">
                  <vl-link :href="scheme.uri" external>
                    {{ scheme.label }}
                  </vl-link>
                </li>
              </ul>
            </template>
            <span v-else>Niet beschikbaar</span>
          </td>
        </tr>
        <tr>
          <td>
            <vl-link
              href="https://www.w3.org/2009/08/skos-reference/skos.html#inScheme"
              external
            >
              Onderdeel van schema
            </vl-link>
          </td>
          <td>
            <template v-if="concept?.inScheme?.length">
              <ul>
                <li v-for="scheme in concept.inScheme" :key="scheme.id">
                  <vl-link :href="scheme.uri" external>
                    {{ scheme.label }}
                  </vl-link>
                </li>
              </ul>
            </template>
            <span v-else>Niet beschikbaar</span>
          </td>
        </tr>
        <tr>
          <td>
            <vl-link
              href="https://www.w3.org/2009/08/skos-reference/skos.html#narrower"
              external
            >
              Heeft beperktere betekenis
            </vl-link>
          </td>
          <td>
            <template v-if="concept?.narrower?.length">
              <ul>
                <li v-for="narrower in concept.narrower" :key="narrower.id">
                  <vl-link :href="narrower.uri" external>
                    {{ narrower.label }}
                  </vl-link>
                </li>
              </ul>
            </template>
            <span v-else>Niet beschikbaar</span>
          </td>
        </tr>
        <tr>
          <td>
            <vl-link
              href="https://www.w3.org/2009/08/skos-reference/skos.html#broader"
              external
            >
              Heeft breder concept
            </vl-link>
          </td>
          <td>
            <template v-if="concept?.broader?.length">
              <ul>
                <li v-for="broader in concept.broader" :key="broader.id">
                  <vl-link :href="broader.uri" external>
                    {{ broader.label }}
                  </vl-link>
                </li>
              </ul>
            </template>
            <span v-else>Niet beschikbaar</span>
          </td>
        </tr>
        <tr>
          <td>
            <vl-link
              href="http://www.w3.org/ns/dcat#dataset"
              external
            >
              Dataset
            </vl-link>
          </td>
          <td>
            <vl-link v-if="concept?.dataset" :href="concept.dataset" external>
              {{ concept.dataset }}
            </vl-link>
            <span v-else>Niet beschikbaar</span>
          </td>
        </tr>
      </tbody>
    </vl-data-table>
  </vl-column>
</template>

<script setup lang="ts" name="conceptInfo">
import type { Concept } from '~/types/concept'

interface Props {
  concept?: Concept
}

defineProps<Props>()
</script>
