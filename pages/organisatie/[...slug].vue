<template>
  <content-header
    title="Organisatie"
    href="https://www.vlaanderen.be/digitaal-vlaanderen"
  />

  <vl-layout>
    <vl-region>
      <vl-grid mod-v-center mod-stacked>
        <vl-column width="12">
          <vl-title mod-no-space-bottom tag-name="h1">{{
            organizationData?.name ?? 'Organisatie'
          }}</vl-title>
        </vl-column>

        <organization-info
          v-if="organizationData"
          :organization="organizationData"
          :fallback-id="slug"
        />
        <actions
          :organization-id="slug"
          :organization-name="organizationData?.name"
        />
        <organization-contact
          :contact-points="organizationData?.contactPoints"
        />
        <organization-dataset :datasets="organizationData?.datasets" />
      </vl-grid>
    </vl-region>
  </vl-layout>

  <content-footer />
</template>

<script setup lang="ts">
import type { OrganizationData } from '~/types/organisation'

// Get the slug from the route
const route = useRoute()
const slug = computed(() => route.params.slug as string)

// Load organization data (this would typically come from an API or content query)
const { data: organizationData } = await useAsyncData<OrganizationData>(
  'organization',
  async () => {
    // This is mock data - replace with actual API call or content query
    return {
      id: slug.value,
      name: 'Informatie Vlaanderen',
      alternativeName: 'AIV',
      type: 'Overheidsorganisatie',
      status: 'Actief',
      foundingDate: '2006-07-01',
      website: 'https://www.vlaanderen.be/digitaal-vlaanderen',
      contactPoints: [
        {
          id: 'contact-1',
          type: 'Algemeen contact',
          name: 'Informatie Vlaanderen',
          email: 'informatie.vlaanderen@vlaanderen.be',
          telephone: '+32 2 553 80 90',
          address: {
            street: 'Koning Albert II-laan',
            number: '35',
            postalCode: '1030',
            municipality: 'Brussel',
          },
        },
      ],
      datasets: [
        {
          id: 'dataset-1',
          title: 'OSLO Vocabularia',
          description:
            'Collectie van semantische vocabularia voor datastandaardisatie',
          landingPage: 'https://data.vlaanderen.be/ns',
        },
      ],
    }
  },
)
</script>

<style scoped lang="scss" src="./style.scss" />
