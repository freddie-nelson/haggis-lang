<template>
  <!-- <v-slider :height="height * uiScale" v-bind="$attrs" /> -->
  <v-slider :height="height" v-bind="$attrs" />
</template>

<script lang="ts">
import { defineComponent } from "vue";

import Vue3Slider from "vue3-slider";

// TODO setup proper ui scale binding

export default defineComponent({
  name: "CInputRange",
  inheritAttrs: false,
  components: {
    "v-slider": Vue3Slider,
  },
  props: {
    height: {
      type: Number,
      default: 14,
    },
  },
});
</script>

<style lang="scss" scoped>
</style>