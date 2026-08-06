<template>
  <div id="header-container"></div>
  <vl-content-header
    mod-large
    mod-show-mobile
    :mod-context="context"
    :background="{
      src: 'https://assets.vlaanderen.be/image/upload/v1590772805/AIV_OVE_computer-2_jhgsfq.jpg',
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
const HEADER_URLS: Record<string, Record<string, string>> = {
  Development: {
    DEFAULT:
      'https://tni.widgets.burgerprofiel.dev-vlaanderen.be/api/v1/widget/99790a73-9a6b-4927-94ad-5df8ae9adf78/embed',
    WG: 'https://widgets.tni-vlaanderen.be/api/v1/widget/f13dfcd7-430e-41ea-b77f-bddf4b6ca0b8/embed',
  },
  Production: {
    DEFAULT:
      'https://prod.widgets.burgerprofiel.vlaanderen.be/api/v1/widget/b0dae312-e7a6-4612-978a-f0e3b2d975bf/embed',
    WG: 'https://widgets.vlaanderen.be/api/v1/widget/4595cc7f-4bbd-488b-9116-c4d4e3d9feaa/embed',
  },
}

const getHeaderUrl = (environment?: string, table?: string) => {
  const env = environment || 'Development'
  const scheme = (table || 'DEFAULT').toUpperCase()
  return (
    HEADER_URLS[env]?.[scheme] ||
    HEADER_URLS[env]?.DEFAULT ||
    HEADER_URLS.Development.DEFAULT
  )
}

onMounted(() => {
  const runtimeConfig = useRuntimeConfig()
  const headerScript = document.createElement('script')
  headerScript.src = getHeaderUrl(
    runtimeConfig.public.ENVIRONMENT,
    runtimeConfig.public.DEPARTMENT,
  )
  document.getElementById('header-container')?.appendChild(headerScript)
})
defineProps<Header>()
</script>
