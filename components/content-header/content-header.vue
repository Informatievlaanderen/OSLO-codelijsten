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
const HEADER_URLS: Record<string, Record<string, string>> = {
  Test: {
    DEFAULT:
      'https://tni.widgets.burgerprofiel.dev-vlaanderen.be/api/v1/widget/c0df3610-36b9-4113-a487-05dfed92c317/embed',
    WG: 'https://widgets.tni-vlaanderen.be/api/v1/widget/f13dfcd7-430e-41ea-b77f-bddf4b6ca0b8/embed',
  },
  Production: {
    DEFAULT:
      'https://prod.widgets.burgerprofiel.vlaanderen.be/api/v1/widget/f1d7f80f-ad17-4f25-92b4-027a99785068/embed',
    WG: 'https://widgets.vlaanderen.be/api/v1/widget/4595cc7f-4bbd-488b-9116-c4d4e3d9feaa/embed',
  },
}

const getHeaderUrl = (environment?: string, table?: string) => {
  const env = environment || 'Test'
  const scheme = (table || 'DEFAULT').toUpperCase()
  return (
    HEADER_URLS[env]?.[scheme] ||
    HEADER_URLS[env]?.DEFAULT ||
    HEADER_URLS.Test.DEFAULT
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
