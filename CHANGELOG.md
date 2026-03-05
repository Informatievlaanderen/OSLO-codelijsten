- 1.0.2

* Bumped packages `@govflanders/vl-ui-design-system-style` and `@govflanders/vl-ui-design-system-vue3`
* Added `compatibilityDate` to `nuxt.config.ts`

- 1.12.0

Finalised the migration to Nuxt 3 for codelists and added a catch-all path for basisregister urls

- 1.13.0

* Make codelist dataset.json variable come from docker compose env

- 1.13.4

* Fix environment variable on deployed version

- 1.13.5

* Allow content-negotiation for codelists

  1.14.0

* Add support for jsonld codelists

  1.15.0

ADD ALL KBO DATA

1.16.0

- Add support for nested codelists
  {
  "urlRef": "IT001/Dossierstatus",
  "sourceUrl": "https://github.com/Informatievlaanderen/codelijsten/raw/master/MAGDA/PersoonREST/IT001-Dossierstatus.ttl"
  },

  1.16.1

  - Add support for conceptschemes of conceptschemes
    {
    "urlRef": "IT141",
    "sourceUrl": "https://github.com/Informatievlaanderen/codelijsten/raw/master/MAGDA/PersoonREST/IT141.ttl"
    },
    {
    "urlRef": "IT141/Gezinsrelatie",
    "sourceUrl": "https://github.com/Informatievlaanderen/codelijsten/raw/master/MAGDA/PersoonREST/IT141-Gezinsrelatietype.ttl"
    },
