<template>
  <vl-column width="12">
    <vl-data-table>
      <tbody>
        <tr v-if="organization?.name">
          <td>
            <vl-link
              href="http://www.w3.org/2004/02/skos/core#prefLabel"
              external
            >
              Naam
            </vl-link>
          </td>
          <td>{{ organization.name }}</td>
        </tr>
        <tr v-if="organization?.alternativeName">
          <td>
            <vl-link
              href="http://www.w3.org/2004/02/skos/core#altLabel"
              external
            >
              Alternatieve naam</vl-link
            >
          </td>
          <td>{{ organization.alternativeName }}</td>
        </tr>
        <tr v-if="organization?.status">
          <td>
            <vl-link href="http://www.w3.org/ns/adms#status" external>
              Status</vl-link
            >
          </td>
          <td>
            <vl-link :href="organization.status">
              {{ organization.status }}
            </vl-link>
          </td>
        </tr>
        <tr v-if="organization?.description">
          <td>
            <vl-link href="http://purl.org/dc/terms/description"
              >Beschrijving</vl-link
            >
          </td>
          <td>{{ organization.description }}</td>
        </tr>
        <tr v-if="organization?.website">
          <td>
            <vl-link href="http://schema.org/contactType">Website</vl-link>
          </td>
          <td>
            <vl-link :href="organization.website" external>
              {{ organization.website }}
            </vl-link>
          </td>
        </tr>
        <tr v-if="organization?.seeAlso">
          <td>
            <vl-link
              href="http://www.w3.org/2000/01/rdf-schema#seeAlso"
              external
            >
              Zie ook</vl-link
            >
          </td>
          <td>
            <vl-link :href="organization.seeAlso" external>
              {{ organization.seeAlso }}
            </vl-link>
          </td>
        </tr>
      </tbody>
    </vl-data-table>
  </vl-column>
</template>

<script setup lang="ts" name="organizationInfo">
import type { OrganizationData } from '~/types/organization'

defineProps<{
  organization?: OrganizationData
  fallbackId?: string
}>()
</script>
