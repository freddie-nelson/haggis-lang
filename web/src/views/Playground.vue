<script lang="ts">
import { defineComponent, onMounted, ref, watch } from "vue";

import runIcon from "@iconify-icons/feather/play";

import Haggis from "Haggis";
import examplesMap from "@/examples";

import CButtonIcon from "@/components/shared/Button/CButtonIcon.vue";
import CGradientHeading from "@/components/shared/Heading/CGradientHeading.vue";
import CInputDropdown from "@/components/shared/Input/CInputDropdown.vue";
import HHaggisEditor from "@/components/app/Editor/HHaggisEditor.vue";

export default defineComponent({
  name: "Playground",
  components: { CButtonIcon, CGradientHeading, HHaggisEditor, CInputDropdown },
  setup() {
    const code = ref("");
    const runCode = () => {
      Haggis.run(code.value);
    };

    const selectedExample = ref("");
    const examples = ref(Object.keys(examplesMap));

    watch(selectedExample, () => {
      const textarea = document.getElementById(
        "playgroundCode"
      ) as HTMLTextAreaElement;
      textarea.value = examplesMap[selectedExample.value];
      textarea.dispatchEvent(new Event("input")); // force text to update
    });

    onMounted(() => {
      selectedExample.value = "Hello World";
    });

    return {
      code,
      runCode,

      selectedExample,
      examples,

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

      <div class="h-full flex gap-5">
        <c-input-dropdown
          class="h-full"
          v-model="selectedExample"
          :options="examples"
        />

        <c-button-icon class="h-full" :icon="icons.run" @click="runCode">
          Run
        </c-button-icon>
      </div>
    </div>

    <h-haggis-editor @code="code = $event" />
  </main>
</template>

<style lang="scss" scoped></style>
