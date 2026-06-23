# Content header

This component is a reusable header component that should be included in most pages

## How to use

```js
<template>
  <content-header />
</template>
```

## Polyfill

In this component we import the generic header component from the Burgerprofiel-application.

```js
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
```

This component requires a polyfill to be present inside the project. For more information, please refer to the [documentation on Confluence](https://vlaamseoverheid.atlassian.net/wiki/spaces/IKPubliek/pages/5930059380/Ondersteunde+browers+en+browser+polyfills).

We include the polyfill inside this project inside the [configuration file](/nuxt.config.ts)
