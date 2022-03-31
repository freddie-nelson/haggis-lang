<script lang="ts">
import { defineComponent, nextTick, ref } from "vue";

import CButtonText from "@/components/shared/Button/CButtonText.vue";
import Haggis from "@interpreter/Haggis";

export default defineComponent({
  name: "HEditorTerminal",
  components: { CButtonText },
  setup() {
    const output = ref("");
    const input = ref("");
    const showInput = ref(false);

    let readlineResolver: (s: string | PromiseLike<string>) => void;
    const submitInput = () => {
      readlineResolver(input.value);
      showInput.value = false;
      input.value = "";
    };

    Haggis.addLogListener((msg) => {
      output.value += msg;
    });

    Haggis.addErrorListener((token, msg) => {
      output.value += `<span class="text-rose-700 whitespace-normal">[line ${token.line}] Error: ${msg}</span><br><br>`;
    });

    Haggis.reader = {
      readline: () => {
        showInput.value = true;
        nextTick(() => document.getElementById("terminalInput").focus());

        return new Promise<string>((resolve) => {
          readlineResolver = resolve;
        });
      },
    };

    return {
      output,
      input,
      showInput,
      submitInput,
    };
  },
});
</script>

<template>
  <div class="bg-bg-dark relative overflow-scroll output">
    <div class="pr-3 pl-4">
      <div class="w-full h-10 py-2.5 px-1.5 flex justify-end">
        <c-button-text class="h-full" @click="output = ''">Clear</c-button-text>
      </div>

      <!-- output -->
      <pre
        class="py-3 px-1 w-full whitespace-pre text-bg-light block"
        v-html="output"
      ></pre>

      <form v-if="showInput" @submit.prevent="submitInput">
        <input
          id="terminalInput"
          v-model="input"
          type="text"
          class="
            bg-b-dark
            p-1
            px-1.5
            rounded-sm
            outline-none
            w-full
            text-bg-light
            max-h-40
            min-h-[2rem]
          "
          autocomplete="false"
          spellcheck="false"
        />

        <c-button-text type="submit" class="float-right">Send</c-button-text>
      </form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.output::-webkit-scrollbar {
  display: none;
}
</style>