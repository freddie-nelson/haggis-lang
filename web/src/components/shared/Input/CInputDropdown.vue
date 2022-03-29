<template>
  <div ref="dropdown" class="relative text-bg-dark inline-block">
    <label v-if="label" class="block text-t-sub font-medium">{{ label }}</label>

    <button
      class="
        flex
        justify-between
        items-center
        bg-t-sub
        rounded-lg
        font-semibold
        text-lg
        px-4
        py-3
        focus:outline-none
        w-full
      "
      type="button"
      @click="isOpen = !isOpen"
    >
      <p
        class="text-left transition-all duration-300"
        :style="{
          marginRight: isOpen
            ? `calc(${maxOptionWidth} - ${visibleOptionWidth})`
            : '0',
        }"
      >
        {{ modelValue }}
      </p>

      <Icon
        class="ml-1 -mr-1 w-6 h-6 transform transition-transform duration-300"
        :class="{ 'rotate-180': isOpen }"
        :icon="icons.chevronDown"
      />
    </button>

    <transition name="dropdown-open">
      <div
        v-if="isOpen"
        class="
          dropdown
          absolute
          rounded-b-lg
          bg-t-sub
          w-full
          py-3
          pt-1
          left-0
          top-full
          -mt-2
          z-10
          duration-300
          transition-all
          overflow-y-scroll
        "
        style="max-height: calc(2.5rem * 6)"
        :style="{ height: `calc(2.5rem * ${options.length - 1} + 1rem)` }"
      >
        <button
          v-for="(option, i) in options.filter((o) => o !== modelValue)"
          :key="i"
          class="
            px-4
            font-semibold
            text-lg
            py-1.5
            w-full
            text-left
            focus:outline-none
            transition-colors
            duration-300
            hover:text-accent-500
          "
          type="button"
          @click="
            $emit('update:modelValue', option);
            isOpen = false;
          "
        >
          {{ option }}
        </button>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from "vue";
import useComponentEvent from "@/utils/useComponentEvent";

import { Icon } from "@iconify/vue";
import chevronDownIcon from "@iconify-icons/feather/chevron-down";

export default defineComponent({
  name: "CInputDropdown",
  components: {
    Icon,
  },
  props: {
    modelValue: {
      type: String,
      required: true,
    },
    options: {
      type: Array as () => string[],
      required: true,
    },
    label: {
      type: String,
      default: "",
    },
  },
  setup(props) {
    const dropdown = ref(document.createElement("div"));
    const isOpen = ref(false);

    useComponentEvent(document.body, "click", (e) => {
      if (
        isOpen.value &&
        e.target &&
        e.target !== dropdown.value &&
        !(
          dropdown.value.compareDocumentPosition(e.target as Node) &
          Node.DOCUMENT_POSITION_CONTAINED_BY
        )
      ) {
        isOpen.value = false;
      }
    });

    const roundLength = (l: number) =>
      Math.round((l + Number.EPSILON) * 100) / 100;

    const maxOptionWidth = computed(() => {
      const max = Math.max(...props.options.map((o) => o.length));
      const correction = Math.sqrt(max) / 3;

      return `${max > 4 ? roundLength(max - correction) : max}ch`;
    });

    const visibleOptionWidth = computed(
      () =>
        `${
          props.modelValue.length > 4
            ? roundLength(
                props.modelValue.length - Math.sqrt(props.modelValue.length) / 2
              )
            : props.modelValue.length
        }ch`
    );

    return {
      dropdown,
      isOpen,

      maxOptionWidth,
      visibleOptionWidth,

      icons: {
        chevronDown: chevronDownIcon,
      },
    };
  },
});
</script>

<style lang="scss" scoped>
.dropdown {
  &::-webkit-scrollbar {
    display: none;
  }
}

.dropdown-open-enter-from,
.dropdown-open-leave-to {
  height: 0 !important;
  padding: 0;
}
</style>