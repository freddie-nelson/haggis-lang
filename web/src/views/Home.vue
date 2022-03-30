<template>
  <main class="flex flex-col justify-center items-center p-12">
    <div class="absolute z-10 select-none">
      <c-gradient-heading :size="9">Haggis Lang</c-gradient-heading>

      <div class="w-full flex gap-4 items-center h-16 justify-center mt-7">
        <c-button-outline class="h-full" @click="openSpec">
          Language Spec
        </c-button-outline>
        <c-button class="h-full" @click="$router.push('/play')"
          >Playground</c-button
        >
      </div>
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

<script lang="ts">
import CButton from "@/components/shared/Button/CButton.vue";
import CButtonOutline from "@/components/shared/Button/CButtonOutline.vue";
import CCanvasCircles from "@/components/shared/Canvas/CCanvasCircles.vue";
import CGradientHeading from "@/components/shared/Heading/CGradientHeading.vue";
import { defineComponent } from "vue";

export default defineComponent({
  name: "Home",
  components: { CGradientHeading, CButton, CButtonOutline, CCanvasCircles },
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
    };
  },
});
</script>
