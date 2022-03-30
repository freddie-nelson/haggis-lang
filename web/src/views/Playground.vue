<script lang="ts">
import { computed, defineComponent, onMounted, ref, watch } from "vue";
import { useResizeObserver, useScroll } from "@vueuse/core";

import runIcon from "@iconify-icons/feather/play";

import CButtonIcon from "@/components/shared/Button/CButtonIcon.vue";
import CGradientHeading from "@/components/shared/Heading/CGradientHeading.vue";

export default defineComponent({
  name: "Playground",
  components: { CButtonIcon, CGradientHeading },
  setup() {
    const code = ref("");

    const lines = computed(() => {
      const split = code.value.split("\n");
      const nums: number[] = [];

      for (let i = 1; i <= split.length; i++) {
        nums.push(i);
      }

      return nums;
    });

    const container = ref<HTMLDivElement>();
    const textarea = ref<HTMLTextAreaElement>();

    const height = ref(0);
    onMounted(() => {
      height.value = container.value.getBoundingClientRect().height;
    });

    useResizeObserver(document.body, (entries) => {
      container.value.style.height = `${height.value}px`;
    });

    const scroll = useScroll(textarea);

    const marginTop = computed(() => {
      return `-${scroll.y.value}px`;
    });

    return {
      code,
      lines,

      container,
      textarea,
      marginTop,

      icons: {
        run: runIcon,
      },
    };
  },
});
</script>

<template>
  <main class="flex flex-col p-8 h-screen">
    <div class="flex items-center justify-between h-16">
      <c-gradient-heading :size="6">Haggis Playground</c-gradient-heading>
      <c-button-icon class="h-full" :icon="icons.run">Run</c-button-icon>
    </div>

    <div class="flex flex-col mt-5 flex-grow">
      <div class="flex-grow relative overflow-hidden">
        <div
          class="
            h-full
            w-full
            flex
            overflow-hidden
            bg-bg-light
            border-2 border-b-light
            rounded-lg
            font-mono
            focus-within:border-b-highlight
            transition-all
            relative
          "
          ref="container"
        >
          <div
            class="
              max-w-14
              bg-primary-100
              text-primary-500
              py-3
              flex flex-col
              items-center
            "
            :style="{ marginTop }"
          >
            <div v-for="i in lines" :key="i" class="px-3">{{ i }}</div>
          </div>

          <textarea
            class="
              code-container
              overflow-scroll
              outline-none
              bg-transparent
              resize-none
              text-t-main
              p-3
              flex-grow
            "
            ref="textarea"
            v-model="code"
            name="code"
          ></textarea>
        </div>
      </div>
    </div>
  </main>
</template>

<style lang="scss" scoped>
.code-container::-webkit-scrollbar {
  display: none;
}
</style>
