<template>
  <content-header
    title="Gemeentenaam"
    href="https://www.vlaanderen.be/digitaal-vlaanderen"
  />
  <vl-layout>
    <vl-region>
      <vl-grid mod-v-center mod-center mod-stacked>
        <vl-column width="12">
          <vl-title mod-no-space-bottom tag-name="h1">
            PURIs Gemeentenaam
          </vl-title>
        </vl-column>
        <vl-column width="12">
          <div>
            <p>
              Op deze pagina vind je de PURIs (Persistente URI) voor gemeentenamen zoals opgenomen in het Vlaamse adressenregister (GRAR).
              Elke gemeentenaam heeft een unieke en persistente identificator in de vorm van een PURI, conform de Vlaamse URI standaard.
              Deze PURIs zullen onderhouden worden zodat ze persistent, uniek, en beschikbaar blijven.
            </p>
            <p>
              Deze PURIs maken het mogelijk om gemeentenamen op een consistente manier te identificeren
              en te linken aan straatnamen, adressen en andere relevante datasets.
              Dit bevordert de kwaliteit, samenhang, interoperabiliteit, en herbruikbaarheid van de data in uiteenlopende toepassingen.
            </p>
          </div>
        </vl-column>
      </vl-grid>
    </vl-region>
  </vl-layout>

  <content-footer />
</template>
