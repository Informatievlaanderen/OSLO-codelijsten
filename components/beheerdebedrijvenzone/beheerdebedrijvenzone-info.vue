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
        <tr v-if="zone?.subsidie">
          <td>
            <vl-link
              href="https://data.vlaanderen.be/ns/bedrijventerrein#subsidie"
              external
            >
              subsidie
            </vl-link>
          </td>
          <td>{{ zone.subsidie }}</td>
        </tr>
        <tr v-if="zone?.aanspreekpunt !== undefined">
          <td>
            <vl-link
              href="https://data.vlaanderen.be/ns/bedrijventerrein#aanspreekpunt"
              external
            >
              Aanspreekpunt
            </vl-link>
          </td>
          <td>
            <vl-link :href="zone.aanspreekpunt">
              {{ zone.aanspreekpunt }}
            </vl-link>
          </td>
        </tr>
        <tr v-if="zone?.digitaleBeheerder !== undefined">
          <td>
            <vl-link
              href="https://data.vlaanderen.be/ns/bedrijventerrein#digitalebeheerder"
              external
            >
              Digitale beheerder
            </vl-link>
          </td>
          <td>
            <vl-link :href="zone.digitaleBeheerder">
              {{ zone.digitaleBeheerder }}
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
              Identificator
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
              Bedrijventerrein
            </vl-link>
          </td>
          <td>
            <vl-link :href="zone.bedrijventerrein">
              {{ zone.bedrijventerreinLabel ?? zone.bedrijventerrein }}
            </vl-link>
          </td>
        </tr>
        <tr v-if="zone?.juridischeHandhaver !== undefined">
          <td>
            <vl-link
              href="https://data.vlaanderen.be/ns/bedrijventerrein#juridischeHandhaver"
              external
            >
              JuridischeHandhaver
            </vl-link>
          </td>
          <td>
            <vl-link :href="zone.juridischeHandhaver">
              {{ zone.juridischeHandhaver }}
            </vl-link>
          </td>
        </tr>
        <tr v-if="zone?.type">
          <td>
            <vl-link
              href="https://data.vlaanderen.be/ns/perceel#RuimtelijkeEenheid.type"
              external
            >
              Type
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
        <tr v-if="zone?.percelen?.length">
          <td>
            <vl-link href="http://purl.org/dc/terms/relation" external>
              Bedrijventerreinperceel
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
        <tr v-if="zone?.oppervlakte">
          <td>
            <vl-link
              href="https://data.vlaanderen.be/ns/perceel#RuimtelijkeEenheidOppervlakte"
              external
            >
              RuimtelijkeEenheidOppervlakte
            </vl-link>
          </td>
          <td>
            <vl-link :href="zone.oppervlakte">
              {{ zone.oppervlakte }}
            </vl-link>
          </td>
        </tr>
      </tbody>
    </vl-data-table>
  </vl-column>
</template>

<script setup lang="ts" name="beheerdeBedrijvenzoneInfo">
import type { BeheerdeBedrijvenzone } from '~/types/bedrijventerrein'

defineProps<{
  zone?: BeheerdeBedrijvenzone
}>()
</script>
