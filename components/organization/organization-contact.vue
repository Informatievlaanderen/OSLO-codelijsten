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
        <vl-title tag-name="h4" slot="title">{{
          contact.type ?? 'Contactpunt'
        }}</vl-title>
        <div slot="content">
          <p v-if="contact.name">
            <strong>{{ contact.name }}</strong>
          </p>
          <p v-if="contact.email">
            <vl-icon icon="envelope" mod-before></vl-icon>
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
          <div v-if="contact.address">
            <vl-icon icon="location" mod-before></vl-icon>
            <address>
              {{ contact.address.street }} {{ contact.address.number }}<br />
              {{ contact.address.postalCode }}
              {{ contact.address.municipality }}
            </address>
          </div>
        </div>
      </vl-info-tile>
    </vl-column>
  </template>
</template>

<script setup lang="ts" name="organizationContactPoints">
interface ContactPoint {
  id: string
  type?: string
  name?: string
  email?: string
  telephone?: string
  address?: {
    street: string
    number: string
    postalCode: string
    municipality: string
  }
}

interface Props {
  contactPoints?: ContactPoint[]
}

defineProps<Props>()
</script>

<style scoped lang="scss">
address {
  font-style: normal;
  line-height: 1.4;
}
</style>
