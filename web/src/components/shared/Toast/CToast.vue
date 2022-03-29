<template>
  <div
    ref="toast"
    class="
      toast
      fixed
      top-3
      right-0
      left-0
      z-40
      mx-auto
      bg-bg-dark
      max-w-3xl
      h-12
      rounded-lg
      flex
      items-center
      justify-center
      px-11
    "
    style="width: 95%"
    id="toast"
  >
    <p
      class="
        text-bg-light text-sm
        font-semibold
        opacity-90
        overflow-ellipsis overflow-hidden
        whitespace-nowrap
        font-mono
      "
    >
      {{ text }}
    </p>
    <button
      class="
        absolute
        w-7
        h-7
        text-bg-light
        my-auto
        right-3
        focus:outline-none
        focus:opacity-100
        opacity-50
        hover:opacity-100
        cursor-pointer
        transition-opacity
        duration-200
      "
      @click="hideToast"
      id="closeToastBtn"
    >
      <Icon :icon="icons.close" class="w-full h-full" />
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";

import { Icon } from "@iconify/vue";
import closeIcon from "@iconify-icons/feather/x";

export default defineComponent({
  name: "CToast",
  components: {
    Icon,
  },
  props: {
    text: {
      type: String,
      default: "This is some example text.",
    },
    duration: {
      type: Number,
      default: undefined,
    },
  },
  setup(props, { emit }) {
    const toast = ref(document.createElement("div"));

    const hideToast = () => {
      if (!toast.value || toast.value.classList.contains("exit")) return;

      toast.value.classList.add("exit");
      emit("close");
      setTimeout(() => emit("slide-out"), 600);
    };

    onMounted(() => {
      if (props.duration) {
        setTimeout(() => {
          hideToast();
        }, props.duration);
      }
    });

    return {
      toast,
      hideToast,
      icons: {
        close: closeIcon,
      },
    };
  },
});
</script>

<style lang="scss" scoped>
@keyframes slide-in {
  to {
    transform: translateY(7rem);
  }
}

@keyframes slide-out {
  from {
    transform: translateY(7rem);
  }

  to {
    transform: translateY(0rem);
  }
}

.toast {
  top: -6rem;
  animation: slide-in 0.6s ease;
  animation-fill-mode: forwards;

  &.exit {
    animation: slide-out 0.6s ease;
  }
}
</style>