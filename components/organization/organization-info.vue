<template>
  <vl-column width="12">
    <vl-title tag-name="h2" mod-h3>Informatie</vl-title>
  </vl-column>
  <vl-column width="12">
    <vl-data-table>
      <tbody>
        <tr v-if="organization?.name">
          <td><strong>Naam</strong></td>
          <td>{{ organization.name }}</td>
        </tr>
        <tr v-if="organization?.alternativeName">
          <td><strong>Alternatieve naam</strong></td>
          <td>{{ organization.alternativeName }}</td>
        </tr>
        <tr v-if="organization?.status">
          <td><strong>Status</strong></td>
          <td>
            <vl-link :href="organization.status">
              {{ organization.status }}
            </vl-link>
          </td>
        </tr>
        <tr v-if="organization?.description">
          <td><strong>Beschrijving</strong></td>
          <td>{{ organization.description }}</td>
        </tr>
        <tr v-if="organization?.website">
          <td><strong>Website</strong></td>
          <td>
            <vl-link :href="organization.website" external>
              {{ organization.website }}
            </vl-link>
          </td>
        </tr>
        <tr v-if="organization?.seeAlso">
          <td><strong>Zie ook</strong></td>
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
