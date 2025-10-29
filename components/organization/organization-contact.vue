<template>
  <template v-if="contactPoints?.length">
    <vl-column width="12">
      <vl-title tag-name="h2" mod-h3>Contactgegevens</vl-title>
    </vl-column>
    <vl-column
      v-for="contact in contactPoints"
      :key="contact.id"
      width="6"
      width-s="12"
    >
      <vl-info-tile>
        <vl-title tag-name="h4" slot="title">{{ 'Contactpunt' }}</vl-title>
        <div slot="content">
          <p v-if="contact.name">
            <strong>{{ contact.name }}</strong>
          </p>
          <p v-if="contact.email">
            <vl-icon icon="email" mod-before></vl-icon>
            <vl-link :href="`mailto:${contact.email}`">{{
              contact.email
            }}</vl-link>
          </p>
          <p v-if="contact.telephone">
            <vl-icon icon="phone" mod-before></vl-icon>
            <vl-link :href="`tel:${contact.telephone}`">{{
              contact.telephone
            }}</vl-link>
          </p>
          <p v-if="contact.fax">
            <vl-icon icon="phone" mod-before></vl-icon>
            <span>Fax: {{ contact.fax }}</span>
          </p>
          <p v-if="contact.website">
            <vl-icon icon="external" mod-before></vl-icon>
            <vl-link :href="contact.website" external>{{
              contact.website
            }}</vl-link>
          </p>
          <address v-if="contact.address">
            <vl-icon icon="location-map" mod-before></vl-icon>
            {{ contact.address.street }} {{ contact.address.number }}
            {{ contact.address.postalCode }} {{ contact.address.municipality }}
          </address>
        </div>
      </vl-info-tile>
    </vl-column>
  </template>
</template>

<script setup lang="ts" name="organizationContact">
import type { ContactPoint } from '~/types/organization'

interface Props {
  contactPoints?: ContactPoint[]
}

defineProps<Props>()
</script>
