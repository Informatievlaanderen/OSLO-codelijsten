<template>
  <vl-grid mod-v-center mod-center mod-stacked>
    <vl-column width="12">
      <vl-title mod-no-space-bottom tag-name="h1"
        >Gewijzigde ondersteuning</vl-title
      >
    </vl-column>
    <vl-column width="12">
      <vl-alert type="warning">
        U bent op deze pagina gekomen omdat u een basisregister URI gebruikt in
        uw systeem dat NIET de juiste identificator is. Waarschijnlijk is deze
        URI van de vorm https://data.vlaanderen.be/doc/. En correcte URI moet de
        prefix met id hebben: https://data.vlaanderen.be/id/.
      </vl-alert>
    </vl-column>
    <vl-column width="12">
      <div>
        <p>
          De ondersteuning van de basisregisters PURIs is gewijzigd als volgt.
          I.p.v. de default data.vlaanderen.be voorstelling is deze omgezet naar
          een meer technische aanpak. De http requests worden nu doorgestuurd
          naar de overeenkomstige basisregisters API. Meer info over de API is
          te vinden in de
          <a
          target="_blank"
            href="https://docs.basisregisters.vlaanderen.be/docs/api-documentation.html#tag/api-documentation.html"
            >basisregisters API documentatie</a
          >. De winst voor de data community door deze aanpassing is dat de
          verstrekte informatie up-to-date is. In de toekomst zal de html
          representatie en bijkomende contentnegotatie terug geactiveerd worden.
          Merk op dat de basisregister APIs een json-ld teruggeven. Een RDF
          representatie in een andere serialisatie kan dus bekomen worden door
          het antwoord zelf te converteren.
        </p>
      </div>
    </vl-column>
  </vl-grid>
</template>
