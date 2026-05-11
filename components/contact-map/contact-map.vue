<template>
  <vl-ol-map
    mod-boxed
    :zoom="zoom"
    :center="center"
    map-zoomable
    map-expandable
    expand-a11y-label="Expand"
    zoom-in-a11y-label="Zoom in"
    zoom-out-a11y-label="Zoom out"
  >
    <vl-ol-map-tile-layer>
      <vl-ol-map-tile-wmts-source
        :layers="['grb_bsk']"
        url="https://geo.api.vlaanderen.be/GRB/wmts"
        projection="EPSG:31370"
      />
      <vl-ol-map-osm-source></vl-ol-map-osm-source>
    </vl-ol-map-tile-layer>
    <vl-ol-map-vector-layer zoom-to-extent>
      <vl-ol-map-vector-source
        :url="url"
        projection="EPSG:4326"
      ></vl-ol-map-vector-source>
      <vl-ol-map-icon-style></vl-ol-map-icon-style>
    </vl-ol-map-vector-layer>
    <template v-slot:info>
      <vl-ol-map-info>
        <vl-ol-map-info-item label="© OpenStreetMaps" />
        <vl-link
          mod-icon-before
          icon="external"
          href="https://www.vlaanderen.be/digitaal-vlaanderen/onze-diensten-en-platformen/basiskaart-vlaanderen-grb"
          >GRB</vl-link
        >
      </vl-ol-map-info>
    </template>
  </vl-ol-map>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    url: string
    center?: number[]
    zoom?: number
  }>(),
  {
    center: () => [4.3113025, 51.0238049],
    zoom: 14,
  },
)
</script>
