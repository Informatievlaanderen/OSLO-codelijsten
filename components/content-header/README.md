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
const headerScript = document.createElement('script')
switch (import.meta.env.VITE_ENVIRONMENT) {
  case 'Test':
    headerScript.setAttribute(
      'src',
      'https://tni.widgets.burgerprofiel.dev-vlaanderen.be/api/v1/widget/99790a73-9a6b-4927-94ad-5df8ae9adf78/embed',
    )
  case 'Production':
    headerScript.setAttribute(
      'src',
      'https://prod.widgets.burgerprofiel.vlaanderen.be/api/v1/widget/b0dae312-e7a6-4612-978a-f0e3b2d975bf/embed',
    )
  default:
    headerScript.setAttribute(
      'src',
      'https://tni.widgets.burgerprofiel.dev-vlaanderen.be/api/v1/widget/99790a73-9a6b-4927-94ad-5df8ae9adf78/embed',
    )
}
document.head.appendChild(headerScript)
```

This component requires a polyfill to be present inside the project. For more information, please refer to the [documentation on Confluence](https://vlaamseoverheid.atlassian.net/wiki/spaces/IKPubliek/pages/5930059380/Ondersteunde+browers+en+browser+polyfills).

We include the polyfill inside this project inside the [configuration file](/nuxt.config.ts)
