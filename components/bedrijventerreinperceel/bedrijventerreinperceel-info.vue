<template>
  <vl-column width="12">
    <vl-title tag-name="h2" mod-h3>Gegevens</vl-title>
    <vl-data-table>
      <tbody>
        <tr v-if="perceel?.homepageAanbieding">
          <td>
            <vl-link
              href="https://data.vlaanderen.be/ns/bedrijventerrein#homepageAanbieding"
              external
            >
              homepage aanbieding
            </vl-link>
          </td>
          <td>{{ perceel.homepageAanbieding }}</td>
        </tr>
        <tr v-if="perceel?.bebouwing">
          <td>
            <vl-link
              href="https://data.vlaanderen.be/ns/bedrijventerrein#bebouwing"
              external
            >
              bebouwing
            </vl-link>
          </td>
          <td>{{ perceel.bebouwing }}</td>
        </tr>
        <tr v-if="perceel?.beschikbaarheid">
          <td>
            <vl-link
              href="https://data.vlaanderen.be/ns/bedrijventerrein#beschikbaarheid"
              external
            >
              beschikbaarheid
            </vl-link>
          </td>
          <td>
            <vl-link :href="perceel.beschikbaarheid">
              {{ perceel.beschikbaarheidLabel ?? perceel.beschikbaarheid }}
            </vl-link>
          </td>
        </tr>
        <tr v-if="perceel?.geldigheidsperiode">
          <td>
            <vl-link
              href="https://data.vlaanderen.be/ns/perceel#geldigheidsperiode"
              external
            >
              periode
            </vl-link>
          </td>
          <td>
            <vl-link :href="perceel.geldigheidsperiode">
              {{ perceel.geldigheidsperiode }}
            </vl-link>
          </td>
        </tr>
        <tr v-if="perceel?.identificator">
          <td>
            <vl-link href="http://www.w3.org/ns/adms#identifier" external>
              identificator
            </vl-link>
          </td>
          <td>
            <vl-link :href="perceel.identificator">
              {{ perceel.identificator }}
            </vl-link>
          </td>
        </tr>
        <tr v-if="perceel?.inGebruik">
          <td>
            <vl-link
              href="https://data.vlaanderen.be/ns/bedrijventerrein#inGebruik"
              external
            >
              in gebruik
            </vl-link>
          </td>
          <td>
            <vl-link :href="perceel.inGebruik">
              {{ perceel.inGebruikLabel ?? perceel.inGebruik }}
            </vl-link>
          </td>
        </tr>
        <tr v-if="perceel?.isDeelVan">
          <td>
            <vl-link href="http://purl.org/dc/terms/isPartOf" external>
              is deel van
            </vl-link>
          </td>
          <td>
            <vl-link :href="perceel.isDeelVan">
              {{ perceel.isDeelVanLabel ?? perceel.isDeelVan }}
            </vl-link>
          </td>
        </tr>
        <tr v-if="perceel?.type">
          <td>
            <vl-link
              href="https://data.vlaanderen.be/ns/perceel#RuimtelijkeEenheid.type"
              external
            >
              type
            </vl-link>
          </td>
          <td>
            <vl-link :href="perceel.type" external>
              {{ perceel.type }}
            </vl-link>
          </td>
        </tr>
        <tr v-if="perceel?.aanbieder">
          <td>
            <vl-link
              href="https://data.vlaanderen.be/ns/bedrijventerrein#aanbieder"
              external
            >
              aanbieder
            </vl-link>
          </td>
          <td>{{ perceel.aanbieder }}</td>
        </tr>
        <tr v-if="perceel?.beperking?.length">
          <td>
            <vl-link
              href="https://data.vlaanderen.be/ns/bedrijventerrein#beperking"
              external
            >
              beperking
            </vl-link>
          </td>
          <td>
            <ul>
              <li
                v-for="(beperkingUri, i) in perceel.beperking"
                :key="beperkingUri"
              >
                <vl-link :href="beperkingUri">
                  {{ beperkingUri }}
                </vl-link>
              </li>
            </ul>
          </td>
        </tr>
        <tr v-if="perceel?.functie">
          <td>
            <vl-link
              href="https://data.vlaanderen.be/ns/bedrijventerrein#functie"
              external
            >
              functie
            </vl-link>
          </td>
          <td>{{ perceel.functie }}</td>
        </tr>
        <tr v-if="perceel?.geometrie">
          <td>
            <vl-link
              href="https://data.vlaanderen.be/ns/perceel/#RuimtelijkeEenheidGeometrie"
              external
            >
              geometrie
            </vl-link>
          </td>
          <td>
            <vl-link :href="perceel.geometrie">
              {{ perceel.geometrie }}
            </vl-link>
          </td>
        </tr>
        <tr v-if="perceel?.oppervlakte">
          <td>
            <vl-link
              href="https://data.vlaanderen.be/ns/perceel/#RuimtelijkeEenheidOppervlakte"
              external
            >
              oppervlakte
            </vl-link>
          </td>
          <td>
            <vl-link :href="perceel.oppervlakte">
              {{ perceel.oppervlakte }}
            </vl-link>
          </td>
        </tr>
        <tr v-if="perceel?.beheerdeBedrijvenzones?.length">
          <td>
            <vl-link
              href="https://data.vlaanderen.be/ns/bedrijventerrein#BeheerdeBedrijvenzone"
              external
            >
              beheerde bedrijvenzones
            </vl-link>
          </td>
          <td>
            <ul>
              <li
                v-for="zone in perceel.beheerdeBedrijvenzones"
                :key="zone.uri"
              >
                <vl-link :href="`/doc/${zone.id}`">
                  {{ zone.label ?? zone.id }}
                </vl-link>
              </li>
            </ul>
          </td>
        </tr>
        <tr v-if="perceel?.ontwikkelbareBedrijvenzones?.length">
          <td>
            <vl-link
              href="https://data.vlaanderen.be/ns/bedrijventerrein#ontwikkelbareBedrijvenzones"
              external
            >
              ontwikkelbare bedrijvenzones
            </vl-link>
          </td>
          <td>
            <ul>
              <li
                v-for="zone in perceel.ontwikkelbareBedrijvenzones"
                :key="zone.uri"
              >
                <vl-link :href="`/doc/${zone.id}`">
                  {{ zone.label ?? zone.id }}
                </vl-link>
              </li>
            </ul>
          </td>
        </tr>
      </tbody>
    </vl-data-table>
  </vl-column>
</template>

<script setup lang="ts" name="bedrijventerreinperceelInfo">
import type { Bedrijventerreinperceel } from '~/types/bedrijventerrein'

defineProps<{
  perceel?: Bedrijventerreinperceel
}>()
</script>
