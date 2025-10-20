<template>
  <vl-person-info :image-src="image?.src">
    <vl-title tagName="h2">{{ title }}</vl-title>
    <vl-typography>
      <div class="description" v-html="description" />
    </vl-typography>
  </vl-person-info>
</template>

<script setup lang="ts" name="person">
import type { Person } from '~/types/person'
defineProps<Person>()
</script>

<style scoped lang="scss" src="./style.scss" />
