<template>
  <vl-data-table>
    <thead>
      <tr>
        <th v-for="header in headers">{{ header }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in rows">
        <td v-for="item in row">
          {{ item }}
        </td>
      </tr>
    </tbody>
    <tfoot v-if="footer?.length" class="footer">
      <tr>
        <td v-for="row in footer">
          {{ row }}
        </td>
      </tr>
    </tfoot>
  </vl-data-table>
</template>

<script setup lang="ts" name="dataTable">
import type { DataTable } from '~/types/dataTable'
defineProps<DataTable>()
</script>

<style scoped lang="scss" src="./style.scss" />
