<template>
  <button
    class="
      text-primary-500
      font-medium
      text-base
      underline
      transition-colors
      duration-300
      hover:text-accent-500
      focus:text-accent-500
      focus:outline-none
    "
  >
    <slot></slot>
  </button>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "CButtonText",
  components: {},
});
</script>

<style lang="scss" scoped>
</style>