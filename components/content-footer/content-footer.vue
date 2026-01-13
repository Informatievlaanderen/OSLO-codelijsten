<template>
  <div id="footer-container"></div>
</template>

<script setup lang="ts" name="contentFooter">
onMounted(() => {
  const footerScript = document.createElement('script')
  const runtimeConfig = useRuntimeConfig()
  switch (runtimeConfig.public.ENVIRONMENT) {
    case 'Test':
      footerScript.src =
        'https://tni.widgets.burgerprofiel.dev-vlaanderen.be/api/v1/widget/c0df3610-36b9-4113-a487-05dfed92c317/embed'
      break
    case 'Production':
      footerScript.src =
        'https://prod.widgets.burgerprofiel.vlaanderen.be/api/v1/widget/f1d7f80f-ad17-4f25-92b4-027a99785068/embed'
      break
    default:
      footerScript.src =
        'https://tni.widgets.burgerprofiel.dev-vlaanderen.be/api/v1/widget/c0df3610-36b9-4113-a487-05dfed92c317/embed'
  }

  document.getElementById('footer-container')?.appendChild(footerScript)
})
</script>
