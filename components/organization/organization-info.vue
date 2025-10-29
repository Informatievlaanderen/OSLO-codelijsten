<template>
  <vl-column width="12">
    <vl-title tag-name="h2" mod-h3>Basisgegevens</vl-title>
    <vl-data-table>
      <thead>
        <tr>
          <th>Eigenschap</th>
          <th>Waarde</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Identificator</strong></td>
          <td>{{ organization?.id ?? fallbackId }}</td>
        </tr>
        <tr>
          <td><strong>Naam</strong></td>
          <td>{{ organization?.name ?? 'Niet beschikbaar' }}</td>
        </tr>
        <tr v-if="organization?.alternativeName">
          <td><strong>Alternatieve naam</strong></td>
          <td>{{ organization.alternativeName }}</td>
        </tr>
        <tr v-if="organization?.description">
          <td><strong>Beschrijving</strong></td>
          <td>{{ organization.description }}</td>
        </tr>
        <tr v-if="organization?.seeAlso?.length">
          <td><strong>Zie ook</strong></td>
          <td>
            <div v-for="link in organization.seeAlso" :key="link">
              <vl-link :href="link" external>{{ link }}</vl-link>
            </div>
          </td>
        </tr>
        <tr>
          <td><strong>Status</strong></td>
          <td>
            <vl-pill :type="getStatusPillType(organization?.status)">
              {{ organization?.status ?? 'Actief' }}
            </vl-pill>
          </td>
        </tr>
        <tr>
          <td><strong>Oprichtingsdatum</strong></td>
          <td>
            <time
              v-if="organization?.foundingDate"
              :datetime="organization.foundingDate"
            >
              {{ formatDate(organization.foundingDate) }}
            </time>
            <span v-else>Niet beschikbaar</span>
          </td>
        </tr>
        <tr>
          <td><strong>Website</strong></td>
          <td>
            <vl-link
              v-if="organization?.website"
              :href="organization.website"
              external
            >
              {{ organization.website }}
            </vl-link>
            <span v-else>Niet beschikbaar</span>
          </td>
        </tr>
      </tbody>
    </vl-data-table>
  </vl-column>
</template>

<script setup lang="ts" name="organizationBasicInfo">
import type { OrganizationData } from '~/types/organization'
import { formatDate } from '~/utils/utils'

interface Props {
  organization?: OrganizationData
  fallbackId?: string
}

defineProps<Props>()

const getStatusPillType = (status: string | undefined) => {
  switch (status?.toLowerCase()) {
    case 'actief':
    case 'active':
      return 'success'
    case 'inactief':
    case 'inactive':
      return 'error'
    case 'opgeschort':
    case 'suspended':
      return 'warning'
    default:
      return 'neutral'
  }
}
</script>
