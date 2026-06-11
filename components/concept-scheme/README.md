# Concept scheme concepts

This folder contains the concept scheme table component, which is used to display the concept schemes in a table format. This component is used in the concept scheme slug page.

There is a specific variant for wegenenverkeer, which is used in the concept scheme slug page for wegenenverkeer. This variant is used to display the concept schemes in a table format with specific columns for wegenenverkeer.

## How to use

```js
<template>
  <concept-scheme-concepts v-if="data" :concepts="data.concepts" :conceptScheme="data.id" />
</template>

<template>
  <concept-scheme-concepts-wg v-if="data" :concepts="data.concepts" :conceptScheme="data.id" />
</template>
```

## Possible variations

- `concept-scheme-concepts` - The default variant, used in the concept scheme overview page.
- `concept-scheme-concepts-wg` - The variant for wegenenverkeer, used in the concept scheme overview page for wegenenverkeer. Triggered by the `CONCEPT_SCHEME_TABLE` env variable set to "WG".
