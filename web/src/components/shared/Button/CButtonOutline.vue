<template>
  <button
    class="
      inline-flex
      justify-center
      items-center
      px-7
      text-lg
      font-semibold
      focus:outline-none
      bg-transparent
      rounded-lg
      border-solid border-4 border-primary-600
      text-primary-600
      hover:border-accent-600
      hover:text-bg-light
      hover:bg-accent-600
      focus:bg-accent-900
      focus:border-accent-900
      focus:text-bg-light
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
  name: "CButtonOutline",
  components: {},
});
</script>

<style lang="scss" scoped>
</style>