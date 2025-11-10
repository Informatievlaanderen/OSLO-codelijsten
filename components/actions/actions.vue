<template>
  <vl-column width="12">
    <vl-title tag-name="h2" mod-h3>Downloads</vl-title>
    <vl-grid mod-stacked>
      <vl-column
        v-for="(download, index) in downloads"
        :key="index"
        width="4"
        width-m="6"
        width-s="12"
      >
        <vl-info-tile>
          <vl-title tag-name="h4" slot="title">
            <vl-icon slot="icon" icon="document-small" mod-light></vl-icon>

            {{ getFormatLabel(download) }}</vl-title
          >
          <div slot="content">
            <p>
              Bekijk {{ name ?? 'het conceptschema' }} als
              {{ getFormatLabel(download) }}.
            </p>
            <vl-link :href="download" external download>
              Bekijk {{ getFormatExtension(download).toUpperCase() }}
            </vl-link>
          </div>
        </vl-info-tile>
      </vl-column>
    </vl-grid>
  </vl-column>
</template>

<script setup lang="ts" name="conceptSchemeDownloads">
import { getFormatLabel, getFormatExtension } from '~/utils/format.utils'

interface Props {
  downloads: string[]
  name?: string
}

const props = defineProps<Props>()
</script>
