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

          1.16.2

          - Fix for root conceptscheme showing the information of a child conceptscheme

            1.16.3

          - Fix for links to concept or conceptschemes

            1.16.4

          feat: Use VKBO instead of KBO directly for enterprises

    1.16.5
    feat: add content-negotiation for enterprises

    1.16.6
    feat: add link to conceptscheme for JuridicalSituation, JuridicalForm and EnterpriseType
    fix: split up concepts for vestiging and enterprise
    fix: readded parentOrganisatie at vestiging
    fix: remove attempt at lazyloading on vestiging page
    fix: add types for geometry to TypeScript interfaces
    fix: readded types for .ttl representation of enterprises and vestigingen

    1.16.7
    fix: add missing /id in uri to onderneming on vestiging page

    1.16.8
    feat: Add a OSM map to the vestiging page and onderneming page

    1.16.9

    fix: fixes to the .ttl of onderneming

    1.16.10
    fix: fixes to the .ttl of onderneming

    1.16.11
    fix: use `toISODateString()` instead of `toLocaleDateString()` for the .ttl representation of enterprises and vestigingen to avoid locale issues

    1.16.12
    fix: add missing `@type` to .ttl representation of vestiging
    fix: add missing `@type` to .ttl representation of enterprise
    fix: Don't use miliseconds in the ISO date format for the .ttl/jsonld representation of enterprises and vestigingen

    1.16.13
    fix: Added language to the .jsonld representation of enterprises and vestigingen

    1.16.14
    feat: added a link to the .ttl and .jsonld sections of each enterprise / branch
    fix: added https://www.w3.org/ns/regorg#orgType to the .ttl representation of enterprise / branch
    feat: add dereferencable uris to the labels of the enterprise / branch view
    fix: follow https://data.test-vlaanderen.be/doc/implementatiemodel/organisatie/ontwerpdocument/VKBO/ completely for the visual representation of the data
