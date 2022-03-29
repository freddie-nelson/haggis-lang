<template>
  <div :class="classes">
    <label v-if="label" class="block text-t-sub font-medium" :for="name">{{
      label
    }}</label>

    <div>
      <input
        class="
          w-full
          block
          p-3
          border-solid border-2
          rounded-lg
          border-b-light
          focus:outline-none
          focus:border-b-highlight
          transition-colors
          duration-300
        "
        v-bind="$attrs"
        :type="censor ? 'password' : 'text'"
        :name="name"
        :placeholder="placeholder"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        :class="
          dark
            ? 'bg-bg-dark text-input-blur-dark focus:text-input-focus-dark border-b-light-dark focus:border-b-highlight-dark'
            : 'bg-bg-light text-input-blur focus:text-input-focus'
        "
      />

      <div
        v-if="error"
        class="
          p-3
          rounded-lg
          w-full
          block
          border-solid border-2 border-danger-500
          bg-danger-500 bg-opacity-30
          text-danger-500
          font-medium
          mt-3
        "
      >
        <p>{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "CInputText",
  inheritAttrs: false,
  components: {},
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
    censor: {
      type: Boolean,
      default: false,
    },
    dark: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: "",
    },
    classes: {
      type: String,
      default: "",
    },
  },
});
</script>

<style lang="scss" scoped>
</style>