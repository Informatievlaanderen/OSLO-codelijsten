<template>
  <vl-ol-map mod-boxed :zoom="zoom" :center="center">
    <vl-ol-map-tile-layer>
      <vl-ol-map-osm-source></vl-ol-map-osm-source>
    </vl-ol-map-tile-layer>
    <vl-ol-map-vector-layer zoom-to-extent>
      <vl-ol-map-vector-source
        :url="url"
        projection="EPSG:4326"
      ></vl-ol-map-vector-source>
      <vl-ol-map-icon-style></vl-ol-map-icon-style>
    </vl-ol-map-vector-layer>
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
