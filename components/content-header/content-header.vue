<template>
  <div id="header-container"></div>
  <vl-content-header
    mod-large
    mod-show-mobile
    :mod-context="context"
    :background="{
      src: '//www.vlaanderen.be/sites/default/files/ip_acm/page_banner_narrow/header.jpg',
      alt: 'Content Header',
    }"
  >
    <div v-if="title" class="vl-content-header__logo-wrapper">
      <vl-content-header-entity :title="title" />
    </div>
    <vl-content-header-title
      v-if="subtitle"
      :title="subtitle"
      tag-name="h1"
      :href="href"
      :context="context"
    />
  </vl-content-header>
</template>

<script setup lang="ts" name="contentHeader">
import type { Header } from '~/types/header'
onMounted(() => {
  const headerScript = document.createElement('script')
  const runtimeConfig = useRuntimeConfig()
  switch (runtimeConfig.public.ENVIRONMENT) {
    case 'Test':
      headerScript.src =
        'https://tni.widgets.burgerprofiel.dev-vlaanderen.be/api/v1/widget/99790a73-9a6b-4927-94ad-5df8ae9adf78/embed'
      break
    case 'Production':
      headerScript.src =
        'https://prod.widgets.burgerprofiel.vlaanderen.be/api/v1/widget/b0dae312-e7a6-4612-978a-f0e3b2d975bf/embed'
      break
    default:
      headerScript.src =
        'https://tni.widgets.burgerprofiel.dev-vlaanderen.be/api/v1/widget/99790a73-9a6b-4927-94ad-5df8ae9adf78/embed'
  }

  document.getElementById('header-container')?.appendChild(headerScript)
})
defineProps<Header>()
</script>
