<template>
  <vl-steps mod-line mod-last-step-no-line v-if="steps?.length">
    <template v-for="(item, key) in steps">
      <vl-step
        :icon="(key + 1).toString()"
        :title="item?.title"
        :mod-accordion="key === 0 ? 'open' : 'closed'"
      >
        <div v-html="item?.description" />
      </vl-step>
    </template>
  </vl-steps>
</template>

<script setup lang="ts" name="steps">
import { Steps } from '~/types/steps'
defineProps<Steps>()
</script>
