<template>
  <content-header
    title="Organisatie"
    href="https://www.vlaanderen.be/digitaal-vlaanderen"
  />

  <vl-toaster v-if="showToaster" mod-top-right fade-out>
    <vl-alert
      mod-small
      icon="cross"
      mod-success
      mod-fade-out
      title="URI gekopiëerd"
    />
  </vl-toaster>

  <vl-layout>
    <vl-region>
      <vl-grid mod-v-center mod-stacked>
        <!-- Header Section -->
        <vl-column width="12">
          <div class="h1-sublink">
            <vl-title mod-no-space-bottom tag-name="h1">
              Vlaamse Overheid
            </vl-title>
            <vl-link
              @click="
                copyToClipboard(
                  'https://data.vlaanderen.be/doc/organisatie/OVO002949',
                )
              "
              class="uri-link"
            >
              <vl-icon
                icon="file-copy"
                mod-before
                @click="
                  copyToClipboard(
                    'https://data.vlaanderen.be/doc/organisatie/OVO002949',
                  )
                "
              ></vl-icon>
              https://data.vlaanderen.be/doc/organisatie/OVO002949
            </vl-link>
          </div>
        </vl-column>

        <!-- Action Buttons -->
        <vl-column width="12">
          <vl-action-group mod-collapse-s>
            <a href="/doc/organisatie"
              ><vl-button type="button">Terug naar overzicht</vl-button></a
            >
            <vl-button mod-secondary mod-small>
              <vl-icon icon="download-harddisk" mod-before></vl-icon>
              Bekijk brondata
            </vl-button>
          </vl-action-group>
        </vl-column>

        <!-- Basic Information -->
        <vl-column width="12">
          <vl-title tag-name="h2" mod-h3>Basisgegevens</vl-title>
          <vl-data-table>
            <thead>
              <tr>
                <th>Eigenschap</th>
                <th>Waarde</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Identificator</strong></td>
                <td>OVO002949</td>
              </tr>
              <tr>
                <td><strong>Voorkeursnaam</strong></td>
                <td>Vlaamse Overheid</td>
              </tr>
              <tr>
                <td><strong>Zie ook</strong></td>
                <td>Dummy</td>
              </tr>
              <tr>
                <td><strong>Beschrijving</strong></td>
                <td>
                  De Vlaamse Overheid is de uitvoerende macht van de Vlaamse
                  Gemeenschap in België.
                </td>
              </tr>
              <tr>
                <td><strong>Status</strong></td>
                <td>
                  <vl-pill type="success">Actief</vl-pill>
                </td>
              </tr>
              <tr>
                <td><strong>Oprichtingsdatum</strong></td>
                <td><time datetime="1995-01-01">1 januari 1995</time></td>
              </tr>
              <tr>
                <td><strong>Website</strong></td>
                <td>
                  <vl-link href="https://www.vlaanderen.be" external>
                    https://www.vlaanderen.be
                  </vl-link>
                </td>
              </tr>
            </tbody>
          </vl-data-table>
        </vl-column>

        <!-- Contact Information -->
        <vl-column width="12">
          <vl-title tag-name="h2" mod-h3>Contactinformatie</vl-title>
          <vl-data-table>
            <thead>
              <tr>
                <th>Contactpunt</th>
                <th>Waarde</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>E-mailadres</strong></td>
                <td>
                  <vl-link href="mailto:info@vlaanderen.be">
                    info@vlaanderen.be
                  </vl-link>
                </td>
              </tr>
              <tr>
                <td><strong>Telefoonnummer</strong></td>
                <td>
                  <vl-link href="tel:+3214567890"> +32 1 45 67 890 </vl-link>
                </td>
              </tr>
              <tr>
                <td><strong>Website</strong></td>
                <td>
                  <vl-link href="https://www.vlaanderen.be" external>
                    https://www.vlaanderen.be
                  </vl-link>
                </td>
              </tr>
              <tr>
                <td><strong>Adres</strong></td>
                <td>
                  Kouter 21<br />
                  9000 Gent<br />
                  België
                </td>
              </tr>
            </tbody>
          </vl-data-table>
        </vl-column>
      </vl-grid>
    </vl-region>
  </vl-layout>

  <content-footer />
</template>

<script setup lang="ts">
const showToaster = ref(false)

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    showToaster.value = true
    setTimeout(() => {
      showToaster.value = false
    }, 3000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}
</script>
