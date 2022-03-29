<template>
  <div class="flex flex-col">
    <c-input-text
      :name="name"
      :label="label"
      :placeholder="placeholder"
      :censor="censor"
      :dark="dark"
      :error="error"
      :modelValue="modelValue"
      @update:modelValue="$emit('update:modelValue', $event)"
    />
    <c-button-text class="self-end" type="button" @click="censor = !censor">
      {{ censor ? "show characters" : "hide characters" }}
    </c-button-text>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import CButtonText from "../Button/CButtonText.vue";

import CInputText from "./CInputText.vue";

export default defineComponent({
  name: "CInputPassword",
  components: {
    CInputText,
    CButtonText,
  },
  props: {
    modelValue: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      default: "",
    },
    placeholder: {
      type: String,
      default: "",
    },
    dark: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: "",
    },
  },
  setup() {
    const censor = ref(true);

    return {
      censor,
    };
  },
});
</script>

<style lang="scss" scoped>
</style>