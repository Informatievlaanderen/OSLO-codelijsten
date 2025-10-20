# Contributor

This component is a reusable contributor component. It's a custom component that shows a contributor's name, email and workplace. It is used within all the application profiles and vocabularies of the Flemish Government.

## How to use

```js
<template>
    <contributor
        firstName="John"
        lastName="Doe"
        email="john.doe@vlaanderen.be"
        :workplace="{
            "name": "Vlaamse overheid",
            "href": "https://overheid.vlaanderen.be"
        }"
    />
</template>
```
