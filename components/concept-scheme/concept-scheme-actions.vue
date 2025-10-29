<template>
  <vl-column width="12">
    <vl-title tag-name="h2" mod-h3>Acties</vl-title>
  </vl-column>
  <vl-column width="6" width-s="12">
    <vl-info-tile>
      <vl-icon slot="icon" icon="download-harddisk" mod-light></vl-icon>
      <vl-title tag-name="h4" slot="title">Download gegevens</vl-title>
      <div slot="content">
        <p>Download het conceptschema in verschillende formaten.</p>
        <vl-link :href="`${conceptSchemeUri}.ttl`" external>
          Download als RDF/Turtle
        </vl-link>
      </div>
    </vl-info-tile>
  </vl-column>
</template>

<script setup lang="ts" name="conceptSchemeActions">
interface Props {
  conceptSchemeUri: string
  conceptSchemeName?: string
}

defineProps<Props>()
</script>
