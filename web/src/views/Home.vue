
<script lang="ts">
import { defineComponent } from "vue";

import { Icon } from "@iconify/vue";
import codeIcon from "@iconify-icons/feather/code";
import githubIcon from "@iconify-icons/feather/github";

import CButton from "@/components/shared/Button/CButton.vue";
import CButtonOutline from "@/components/shared/Button/CButtonOutline.vue";
import CCanvasCircles from "@/components/shared/Canvas/CCanvasCircles.vue";
import CGradientHeading from "@/components/shared/Heading/CGradientHeading.vue";

export default defineComponent({
  name: "Home",
  components: {
    CGradientHeading,
    CButton,
    CButtonOutline,
    CCanvasCircles,
    Icon,
  },
  setup() {
    const openSpec = () => {
      window.open(
        "https://www.sqa.org.uk/sqa/files_ccc/Reference-language-for-Computing-Science-Sep2016.pdf",
        "_blank"
      );
    };

    return {
      openSpec,

      bgFill:
        getComputedStyle(document.documentElement).getPropertyValue(
          "--bg-light"
        ) + "55",
      brushColor: getComputedStyle(document.documentElement).getPropertyValue(
        "--accent-300"
      ),

      icons: {
        code: codeIcon,
        github: githubIcon,
      },
    };
  },
});
</script>

<template>
  <main class="flex flex-col justify-center items-center p-12">
    <div class="absolute z-10 select-none">
      <div class="text-center flex flex-col justify-center items-center gap-5">
        <c-gradient-heading :size="9">Haggis Lang</c-gradient-heading>

        <!-- <p class="text-b-dark text-lg font-light">
          A reference language created by the brilliant minds at the
          <a
            class="text-primary-300 hover:underline"
            href="https://sqa.org.uk"
            target="_blank"
          >
            SQA </a
          >.
        </p> -->
      </div>

      <div class="w-full flex gap-4 items-center h-16 justify-center mt-7">
        <c-button-outline class="h-full" @click="openSpec">
          Language Spec
        </c-button-outline>
        <c-button class="h-full" @click="$router.push('/play')">
          Playground
        </c-button>
      </div>
    </div>

    <div
      class="
        absolute
        z-10
        left-0
        bottom-0
        w-full
        p-4
        flex
        font-medium
        select-none
        text-lg
        justify-between
        items-center
      "
    >
      <a
        class="
          flex
          items-center
          justify-center
          gap-2
          opacity-60
          transition-colors
          duration-300
          hover:text-accent-500 hover:opacity-80
        "
        href="https://freddienelson.co.uk"
      >
        Made by Freddie
      </a>

      <a
        class="
          flex
          items-center
          justify-center
          gap-2
          opacity-60
          transition-colors
          duration-300
          hover:text-accent-500 hover:opacity-80
        "
        href="https://github.com/freddie-nelson/haggis-lang"
      >
        <Icon class="w-8 h-8" :icon="icons.github" />
      </a>
    </div>

    <c-canvas-circles
      class="absolute top-0 left-0 w-full h-full"
      useWindow
      fadeOut
      :brushColor="brushColor"
      :brushSize="50"
      :bgFill="bgFill"
    />
  </main>
</template>

<style lang="scss" scoped></style>