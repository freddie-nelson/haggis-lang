<script lang="ts">
import { IconifyIcon } from "@iconify/vue";
import { defineComponent } from "vue";

import { Icon } from "@iconify/vue";

import CButton from "./CButton.vue";

export default defineComponent({
  name: "CButtonIcon",
  components: {
    CButton,
    Icon,
  },
  props: {
    icon: {
      type: Object as () => IconifyIcon,
      required: true,
    },
  },
});
</script>

<template>
  <c-button class="flex gap-2">
    <Icon :icon="icon" />
    <slot></slot>
  </c-button>
</template>

<style lang="scss" scoped></style>