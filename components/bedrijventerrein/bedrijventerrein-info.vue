<template>
  <vl-column width="12">
    <vl-title tag-name="h2" mod-h3>Gegevens</vl-title>
    <vl-data-table>
      <tbody>
        <tr v-if="bedrijventerrein?.name">
          <td>
            <vl-link
              href="http://www.w3.org/2004/02/skos/core#prefLabel"
              external
            >
              naam
            </vl-link>
          </td>
          <td>{{ bedrijventerrein.name }}</td>
        </tr>
        <tr v-if="bedrijventerrein?.alternativeName">
          <td>
            <vl-link
              href="http://www.w3.org/2004/02/skos/core#altLabel"
              external
            >
              alternatieve naam
            </vl-link>
          </td>
          <td>{{ bedrijventerrein.alternativeName }}</td>
        </tr>
        <tr v-if="bedrijventerrein?.beschikbareKavels !== undefined">
          <td>
            <vl-link
              href="https://data.vlaanderen.be/ns/bedrijventerrein#beschikbareKavels"
              external
            >
              beschikbare kavels
            </vl-link>
          </td>
          <td>{{ bedrijventerrein.beschikbareKavels ? 'true' : 'false' }}</td>
        </tr>
        <tr v-if="bedrijventerrein?.beschikbareOppervlakte">
          <td>
            <vl-link
              href="https://data.vlaanderen.be/ns/bedrijventerrein#beschikbareOppervlakte"
              external
            >
              beschikbare oppervlakte
            </vl-link>
          </td>
          <td>
            <vl-link :href="bedrijventerrein.beschikbareOppervlakte">
              {{ bedrijventerrein.beschikbareOppervlakte }}
            </vl-link>
          </td>
        </tr>
        <tr v-if="bedrijventerrein?.geldigheidsperiode">
          <td>
            <vl-link
              href="https://data.vlaanderen.be/ns/perceel#geldigheidsperiode"
              external
            >
              geldigheidsperiode
            </vl-link>
          </td>
          <td>
            <vl-link :href="bedrijventerrein.geldigheidsperiode">
              {{ bedrijventerrein.geldigheidsperiode }}
            </vl-link>
          </td>
        </tr>
        <tr v-if="bedrijventerrein?.geometrie">
          <td>
            <vl-link
              href="https://data.vlaanderen.be/ns/perceel/#RuimtelijkeEenheidGeometrie"
              external
            >
              geometrie
            </vl-link>
          </td>
          <td>
            <vl-link :href="bedrijventerrein.geometrie">
              {{ bedrijventerrein.geometrie }}
            </vl-link>
          </td>
        </tr>
        <tr v-if="bedrijventerrein?.identificator">
          <td>
            <vl-link href="http://www.w3.org/ns/adms#identifier" external>
              identificator
            </vl-link>
          </td>
          <td>
            <vl-link :href="bedrijventerrein.identificator">
              {{ bedrijventerrein.identificator }}
            </vl-link>
          </td>
        </tr>
        <tr v-if="bedrijventerrein?.oppervlakte">
          <td>
            <vl-link
              href="https://data.vlaanderen.be/ns/perceel/#RuimtelijkeEenheidOppervlakte"
              external
            >
              oppervlakte
            </vl-link>
          </td>
          <td>
            <vl-link :href="bedrijventerrein.oppervlakte">
              {{ bedrijventerrein.oppervlakte }}
            </vl-link>
          </td>
        </tr>
        <tr v-if="bedrijventerrein?.type">
          <td>
            <vl-link
              href="https://data.vlaanderen.be/ns/perceel#RuimtelijkeEenheid.type"
              external
            >
              type
            </vl-link>
          </td>
          <td>
            <vl-link :href="bedrijventerrein.type" external>{{
              bedrijventerrein.type
            }}</vl-link>
          </td>
        </tr>
        <tr v-if="bedrijventerrein?.percelen?.length">
          <td>
            <vl-link href="http://purl.org/dc/terms/hasPart" external>
              heeft als onderdeel
            </vl-link>
          </td>
          <td>
            <ul>
              <li
                v-for="perceel in bedrijventerrein.percelen"
                :key="perceel.uri"
              >
                <vl-link :href="`/doc/${perceel.id}`">
                  {{ perceel.id }}
                </vl-link>
              </li>
            </ul>
          </td>
        </tr>
      </tbody>
    </vl-data-table>
  </vl-column>
</template>

<script setup lang="ts" name="bedrijventerreinInfo">
import type { Bedrijventerrein } from '~/types/bedrijventerrein'

defineProps<{
  bedrijventerrein?: Bedrijventerrein
}>()
</script>
