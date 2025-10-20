<template>
  <content-header />
  <vl-layout>
    <vl-region>
      <vl-grid mod-v-center mod-center mod-stacked>
        <vl-column width="12">
          <vl-title mod-no-space-bottom tag-name="h1">Organisaties</vl-title>
        </vl-column>
        <vl-column class="vl-u-table-overflow">
          <vl-data-table>
            <thead>
              <tr>
                <th>URI</th>
                <th>Identificator</th>
                <th>Voorkeursnaam</th>
                <th>Beschrijving</th>
                <th>Zie</th>
                <th>Status</th>
                <th class="vl-u-display-flex">Homepagina</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Club Brugge</td>
                <td>32</td>
                <td>24</td>
                <td>6</td>
                <td>6</td>
                <td>6</td>
                <td>2</td>
              </tr>
            </tbody>
          </vl-data-table>
          <vl-pager mod-align="center">
            <vl-pager-bounds
              :from="paginationIndex.toString()"
              prefix="of"
              :to="maxTo().toString()"
            />
            <vl-pager-item
              a11yLabel="previous"
              label="previous"
              type="previous"
              @click="setPreviousIndex"
            />
            <vl-pager-item
              a11yLabel="next"
              type="next"
              label="next"
              @click="setNextIndex"
            />
          </vl-pager>
        </vl-column>
      </vl-grid>
    </vl-region>
  </vl-layout>
</template>

<script setup lang="ts" name="conceptSchemes">
import { ITEMS_PER_PAGE } from '~/constants/constants'
const paginationIndex = ref(1)

const setPreviousIndex = () => {
  const value = paginationIndex.value - ITEMS_PER_PAGE
  if (value > 0) {
    paginationIndex.value = value
  }
}

const setNextIndex = () => {
  const value = paginationIndex.value + ITEMS_PER_PAGE
  paginationIndex.value = value
}

const maxTo = () => {
  const value = paginationIndex.value + ITEMS_PER_PAGE - 1
  return value
}
</script>
