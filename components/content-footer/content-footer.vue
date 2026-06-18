<template>
  <div id="footer-container"></div>
</template>

<script setup lang="ts" name="contentFooter">
const FOOTER_URLS: Record<string, Record<string, string>> = {
  Development: {
    DEFAULT:
      'https://tni.widgets.burgerprofiel.dev-vlaanderen.be/api/v1/widget/c0df3610-36b9-4113-a487-05dfed92c317/embed',
    WG: 'https://widgets.tni-vlaanderen.be/api/v1/widget/9b51d2dc-844e-4962-a214-1fb8691c0375/embed',
  },
  Production: {
    DEFAULT:
      'https://prod.widgets.burgerprofiel.vlaanderen.be/api/v1/widget/f1d7f80f-ad17-4f25-92b4-027a99785068/embed',
    WG: 'https://widgets.vlaanderen.be/api/v1/widget/56d41777-4250-4cab-b9e2-0d4b21084d43/embed',
  },
}

const getFooterUrl = (environment?: string, table?: string) => {
  const env = environment || 'Development'
  const scheme = (table || 'DEFAULT').toUpperCase()
  return (
    FOOTER_URLS[env]?.[scheme] ||
    FOOTER_URLS[env]?.DEFAULT ||
    FOOTER_URLS.Development.DEFAULT
  )
}

const runtimeConfig = useRuntimeConfig()
onMounted(() => {
  const footerScript = document.createElement('script')
  footerScript.src = getFooterUrl(
    runtimeConfig.public.ENVIRONMENT,
    runtimeConfig.public.DEPARTMENT,
  )
  document.getElementById('footer-container')?.appendChild(footerScript)
})
</script>
