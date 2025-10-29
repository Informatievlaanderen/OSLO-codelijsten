<template>
  <vl-column width="12">
    <vl-title tag-name="h2" mod-h3>Acties</vl-title>
    <vl-grid mod-stacked>
      <vl-column width="4" width-s="6" width-xs="12">
        <vl-link-button
          :href="`/organisatie/${organizationId}/rdf`"
          mod-secondary
          mod-block
        >
          <vl-icon icon="file-download" mod-before></vl-icon>
          Download RDF
        </vl-link-button>
      </vl-column>
      <vl-column width="4" width-s="6" width-xs="12">
        <vl-link-button
          :href="`/organisatie/${organizationId}/json`"
          mod-secondary
          mod-block
        >
          <vl-icon icon="file-download" mod-before></vl-icon>
          Download JSON-LD
        </vl-link-button>
      </vl-column>
    </vl-grid>
  </vl-column>
</template>

<script setup lang="ts" name="actions">
interface Props {
  organizationId: string
  organizationName?: string
}

const props = defineProps<Props>()
</script>
