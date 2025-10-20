<template>
  <content-header />
  <vl-layout>
    <vl-region>
      <vl-grid mod-v-center mod-center mod-stacked>
        <vl-column width="12">
          <vl-title mod-no-space-bottom tag-name="h1">
            Concept schema's</vl-title
          >
        </vl-column>
        <vl-column class="vl-u-table-overflow">
          <vl-data-table>
            <thead>
              <tr>
                <th>URI</th>
                <th>Label</th>
                <th>Definitie</th>
                <th>Status</th>
                <th class="vl-u-display-flex">
                  Is top concept in schema
                  <vl-badge
                    class="vl-u-spacer-left--xsmall"
                    v-vl-tooltip="'Meer informatie over deze kolom'"
                    icon="info"
                    tag-name="button"
                    hidden-label="Gelijk"
                    mod-xsmall
                    mod-action
                    mod-inline
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Club Brugge</td>
                <td>32</td>
                <td>24</td>
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
