<template>
  <span v-if="lastName">{{ lastName }}&comma;&nbsp;</span>
  <span v-if="firstName">{{ firstName }}</span>
  &#45;
  <a v-if="workplace" :href="workplace?.href">{{ workplace?.name }}</a>
  &#45;
  <a v-if="email" :href="'mailto:' + email">{{ email }}</a>
</template>

<script setup lang="ts" name="contributor">
import type { Contributor } from '~/types/contributor'
defineProps<Contributor>()
</script>
