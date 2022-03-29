<template>
  <teleport to="#modals">
    <div
      class="
        fixed
        top-0
        left-0
        w-full
        h-full
        flex
        justify-center
        items-center
        bg-transparent
        z-50
      "
    >
      <div
        class="absolute top-0 left-0 w-full h-full bg-bg-dark opacity-30"
      ></div>

      <section v-bind="$attrs" class="p-12 rounded-xl relative bg-bg-dark">
        <button
          v-if="closeable"
          class="
            absolute
            top-3
            right-3
            w-7
            h-7
            text-bg-light
            hover:text-primary-500
            transition-colors
            duration-300
            focus:text-primary-800 focus:outline-none
          "
          @click="$emit('close')"
        >
          <Icon class="w-full h-full" :icon="icons.close" />
        </button>

        <slot></slot>
      </section>
    </div>
  </teleport>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import { Icon } from "@iconify/vue";
import closeIcon from "@iconify-icons/feather/x";

export default defineComponent({
  name: "CModal",
  inheritAttrs: false,
  components: {
    Icon,
  },
  props: {
    closeable: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    return {
      icons: {
        close: closeIcon,
      },
    };
  },
});
</script>

<style lang="scss" scoped>
</style>