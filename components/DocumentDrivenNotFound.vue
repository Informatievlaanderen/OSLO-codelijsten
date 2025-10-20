<template>
  <vl-page
    class="vl-u-flex vl-u-flex-align-center vl-u-flex-v-center"
    style="min-height: 90vh"
  >
    <vl-main>
      <vl-region>
        <vl-layout>
          <vl-grid mod-stacked>
            <vl-column>
              <vl-grid mod-v-center mod-center mod-stacked>
                <vl-column
                  width="6"
                  width-m="8"
                  width-s="12"
                  class="vl-u-hidden vl-u-visible--s"
                >
                  <div
                    class="vl-u-flex vl-u-flex-align-center vl-u-flex-v-center"
                  >
                    <img
                      alt="Pagina niet gevonden illustratie"
                      role="img"
                      src="~/assets/media/page-not-found.svg"
                    />
                  </div>
                </vl-column>
                <vl-column
                  width="6"
                  width-m="8"
                  width-s="12"
                  class="vl-u-align-center--s"
                >
                  <vl-grid mod-stacked>
                    <vl-column>
                      <div class="vl-u-spacer--large vl-u-visible--s"></div>
                      <vl-title
                        tag-name="h1"
                        tag-style="h2"
                        mod-no-space-bottom
                      >
                        Oeps, die pagina vonden we niet terug
                      </vl-title>
                    </vl-column>
                    <vl-column>
                      <vl-typography>
                        <p>De pagina die u zoekt, vonden we niet terug.</p>
                      </vl-typography>
                    </vl-column>
                    <vl-column>
                      <vl-link to="/">Terug naar de startpagina</vl-link>
                    </vl-column>
                  </vl-grid>
                </vl-column>
                <vl-column
                  width="6"
                  width-m="4"
                  width-s="12"
                  class="vl-u-hidden--s"
                >
                  <div
                    class="vl-u-flex vl-u-flex-align-center vl-u-flex-v-center"
                  >
                    <img
                      alt="Pagina niet gevonden illustratie"
                      role="img"
                      src="~/assets/media/page-not-found.svg"
                    />
                  </div>
                </vl-column>
              </vl-grid>
            </vl-column>
          </vl-grid>
        </vl-layout>
      </vl-region>
    </vl-main>
  </vl-page>
</template>
