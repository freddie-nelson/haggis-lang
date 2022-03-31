<script lang="ts">
import { defineComponent } from "vue";

import runIcon from "@iconify-icons/feather/play";

import CButtonIcon from "@/components/shared/Button/CButtonIcon.vue";
import CGradientHeading from "@/components/shared/Heading/CGradientHeading.vue";
import HHaggisEditor from "@/components/app/Editor/HHaggisEditor.vue";
import HEditorTerminal from "@/components/app/Editor/HEditorTerminal.vue";

export default defineComponent({
  name: "Playground",
  components: { CButtonIcon, CGradientHeading, HHaggisEditor },
  setup() {
    return {
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

    <h-haggis-editor />
  </main>
</template>

<style lang="scss" scoped></style>
