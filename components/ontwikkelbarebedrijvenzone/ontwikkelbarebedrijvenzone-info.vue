<template>
  <vl-column width="12">
    <vl-title tag-name="h2" mod-h3>Gegevens</vl-title>
    <vl-data-table>
      <tbody>
        <tr v-if="zone?.name">
          <td>
            <vl-link
              href="http://www.w3.org/2004/02/skos/core#prefLabel"
              external
            >
              naam
            </vl-link>
          </td>
          <td>{{ zone.name }}</td>
        </tr>
        <tr v-if="zone?.homepage">
          <td>
            <vl-link href="http://xmlns.com/foaf/0.1/homepage" external>
              homepage
            </vl-link>
          </td>
          <td>
            <vl-link :href="zone.homepage" external>
              {{ zone.homepage }}
            </vl-link>
          </td>
        </tr>
        <tr v-if="zone?.voorzieneUitgifte">
          <td>
            <vl-link
              href="https://data.vlaanderen.be/ns/bedrijventerrein#voorzieneUitgifte"
              external
            >
              voorziene uitgifte
            </vl-link>
          </td>
          <td>{{ zone.voorzieneUitgifte }}</td>
        </tr>
        <tr v-if="zone?.statusOntwikkeling">
          <td>
            <vl-link
              href="https://data.vlaanderen.be/ns/bedrijventerrein#statusOntwikkeling"
              external
            >
              status
            </vl-link>
          </td>
          <td>
            <vl-link :href="zone.statusOntwikkeling">
              {{ zone.statusOntwikkelingLabel ?? zone.statusOntwikkeling }}
            </vl-link>
          </td>
        </tr>
        <tr v-if="zone?.ontwikkelaar">
          <td>
            <vl-link
              href="https://data.vlaanderen.be/ns/bedrijventerrein#ontwikkelaar"
              external
            >
              ontwikkelaar
            </vl-link>
          </td>
          <td>
            <vl-link :href="zone.ontwikkelaar">
              {{ zone.ontwikkelaarLabel ?? zone.ontwikkelaar }}
            </vl-link>
          </td>
        </tr>
        <tr v-if="zone?.geldigheidsperiode">
          <td>
            <vl-link
              href="https://data.vlaanderen.be/ns/perceel#geldigheidsperiode"
              external
            >
              geldigheidsperiode
            </vl-link>
          </td>
          <td>
            <vl-link :href="zone.geldigheidsperiode">
              {{ zone.geldigheidsperiode }}
            </vl-link>
          </td>
        </tr>
        <tr v-if="zone?.identificator">
          <td>
            <vl-link href="http://www.w3.org/ns/adms#identifier" external>
              identificator
            </vl-link>
          </td>
          <td>
            <vl-link :href="zone.identificator">
              {{ zone.identificator }}
            </vl-link>
          </td>
        </tr>
        <tr v-if="zone?.bedrijventerrein">
          <td>
            <vl-link href="http://purl.org/dc/terms/isPartOf" external>
              bedrijventerrein
            </vl-link>
          </td>
          <td>
            <vl-link :href="zone.bedrijventerrein">
              {{ zone.bedrijventerreinLabel ?? zone.bedrijventerrein }}
            </vl-link>
          </td>
        </tr>
        <tr v-if="zone?.type">
          <td>
            <vl-link
              href="https://data.vlaanderen.be/ns/perceel#RuimtelijkeEenheid.type"
              external
            >
              type
            </vl-link>
          </td>
          <td>
            <vl-link :href="zone.type" external>
              {{ zone.type }}
            </vl-link>
          </td>
        </tr>
        <tr v-if="zone?.geometrie">
          <td>
            <vl-link
              href="https://data.vlaanderen.be/ns/perceel/#RuimtelijkeEenheidGeometrie"
              external
            >
              geometrie
            </vl-link>
          </td>
          <td>
            <vl-link :href="zone.geometrie">
              {{ zone.geometrie }}
            </vl-link>
          </td>
        </tr>
        <tr v-if="zone?.oppervlakte">
          <td>
            <vl-link
              href="https://data.vlaanderen.be/ns/perceel#RuimtelijkeEenheidOppervlakte"
              external
            >
              oppervlakte
            </vl-link>
          </td>
          <td>
            <vl-link :href="zone.oppervlakte">
              {{ zone.oppervlakte }}
            </vl-link>
          </td>
        </tr>
        <tr v-if="zone?.percelen?.length">
          <td>
            <vl-link href="http://purl.org/dc/terms/hasPart" external>
              percelen
            </vl-link>
          </td>
          <td>
            <ul>
              <li v-for="perceel in zone.percelen" :key="perceel.uri">
                <vl-link :href="`/doc/${perceel.id}`">
                  {{ perceel.label ?? perceel.id }}
                </vl-link>
              </li>
            </ul>
          </td>
        </tr>
      </tbody>
    </vl-data-table>
  </vl-column>
</template>

<script setup lang="ts" name="ontwikkelbareBedrijvenzoneInfo">
import type { OntwikkelbareBedrijvenzone } from '~/types/bedrijventerrein'

defineProps<{
  zone?: OntwikkelbareBedrijvenzone
}>()
</script>
