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
      bg-danger-600
      rounded-lg
      focus:outline-none
      hover:bg-danger-700
      focus:bg-danger-900
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
  name: "CButtonDanger",
  components: {},
});
</script>

<style lang="scss" scoped>
</style>