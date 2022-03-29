<template>
  <button
    class="
      inline-flex
      justify-center
      items-center
      px-7
      text-lg
      font-semibold
      text-bg-light
      bg-primary-600
      rounded-lg
      focus:outline-none
      hover:bg-accent-600
      focus:bg-accent-900
      transition-colors
      ease-in-out
      duration-200
    "
  >
    <slot></slot>
  </button>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "CButton",
  components: {},
});
</script>

<style lang="scss" scoped>
</style>