<template>
  <vl-region>
    <vl-accordion-list>
      <vl-grid mod-stacked-small>
        <vl-column width="6" width-m="12" v-for="item in items">
          <vl-accordion :title="item?.title" :id="item?.id" :modAltBg="true">
            <vl-grid>
              <div>
                {{ item?.content }}
              </div>
            </vl-grid>
          </vl-accordion>
        </vl-column>
      </vl-grid>
    </vl-accordion-list>
  </vl-region>
</template>

<script setup lang="ts">
import type { Accordions } from '~/types/accordion'
defineProps<Accordions>()
</script>
