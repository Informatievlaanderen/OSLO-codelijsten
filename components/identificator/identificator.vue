<template>
  <template v-if="identificator">
    <vl-column width="12">
      <vl-title tag-name="h2" mod-h2>Identificator</vl-title>
      <vl-title tag-name="h3" mod-h3>GestructureerdeIdentificator</vl-title>
    </vl-column>
    <vl-column width="12">
      <vl-data-table>
        <tbody>
          <tr>
            <td>
              <vl-link :href="fieldUris?.lokaleIdentificator ?? ''" external>
                lokaleIdentificator
              </vl-link>
            </td>
            <td>{{ identificator.lokaleIdentificator ?? slug }}</td>
          </tr>
          <tr v-if="identificator.naamruimte">
            <td>
              <vl-link :href="fieldUris?.lokaleIdentificator ?? ''" external>
                naamruimte
              </vl-link>
            </td>
            <td>{{ identificator.naamruimte }}</td>
          </tr>
          <tr v-if="identificator.versieIdentificator">
            <td>
              <vl-link :href="fieldUris?.lokaleIdentificator ?? ''" external>
                versieIdentificator
              </vl-link>
            </td>
            <td>{{ formatVersieIdentificator(identificator.versieIdentificator) }}</td>
          </tr>
        </tbody>
      </vl-data-table>
    </vl-column>
  </template>
</template>

<script setup lang="ts">
export interface IdentificatorData {
  lokaleIdentificator?: string
  naamruimte?: string
  versieIdentificator?: string
}

export interface IdentificatorFieldUris {
  lokaleIdentificator: string
}

defineProps<{
  identificator?: IdentificatorData | null
  fieldUris?: any
  slug: string
}>()

const formatVersieIdentificator = (value?: string): string => {
  if (!value) return ''
  // versieIdentificator is typically an ISO datetime like "2023-11-01T14:53:09+01:00"
  // Extract just the date part (YYYY-MM-DD)
  return value.split('T')[0] ?? value
}
</script>
