<template>
  <div ref="container" class="relative">
    <button
      v-bind="attribute"
      class="
        dropdownbutton-show-btn
        flex
        items-center
        focus:outline-none
        cursor-pointer
      "
      @click="toggleMenu"
    >
      <slot></slot>
    </button>

    <div
      v-show="showMenu"
      v-bind="attribute"
      ui-element
      :style="{
        right: `${menuRight + 3}px`,
        [flip ? 'bottom' : 'top']: `${(flip ? menuBottom : menuTop) + 3}px`,
      }"
      class="absolute bg-t-main px-4 py-2.5 rounded-md"
      :class="menuClasses"
    >
      <slot name="menu"></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from "vue";
import useComponentEvent from "@/utils/useComponentEvent";

export default defineComponent({
  name: "CButtonDropdown",
  components: {},
  props: {
    tag: {
      type: String,
      required: true,
    },
    forceClose: {
      type: Boolean,
      default: false,
    },
    flip: {
      type: Boolean,
      default: false,
    },
    menuClasses: {
      type: String,
      default: "",
    },
  },
  setup(props, { emit }) {
    const container = ref(document.createElement("div"));

    const showMenu = ref(false);
    watch(showMenu, () => emit("updateShow", showMenu.value));
    watch(
      computed(() => props.forceClose),
      () => (showMenu.value = false)
    );

    const menuRight = ref(0);
    const menuTop = ref(0);
    const menuBottom = ref(0);

    const toggleMenu = (e: MouseEvent) => {
      showMenu.value = !showMenu.value;

      const box = container.value.getBoundingClientRect();

      const mouseX = e.x || box.left + box.width;
      const mouseY = e.y || box.top + box.height / 2;

      const right =
        window.innerWidth - mouseX - (window.innerWidth - box.right);
      const top = mouseY - box.top;
      const bottom = box.bottom - mouseY;

      menuRight.value = right;
      menuTop.value = top;
      menuBottom.value = bottom;
    };

    useComponentEvent(document.body, "click", (e) => {
      if (!(e.target as Element).hasAttribute(props.tag))
        showMenu.value = false;
    });

    const attribute = {
      [props.tag]: "",
    };

    return {
      container,

      showMenu,
      menuRight,
      menuTop,
      menuBottom,
      toggleMenu,

      attribute,
    };
  },
});
</script>

<style lang="scss">
.dropdownbutton-show-btn * {
  pointer-events: none;
}
</style>