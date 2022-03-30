<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  ref,
  watch,
  watchEffect,
} from "vue";
import { useResizeObserver, useScroll } from "@vueuse/core";

import Scanner from "@interpreter/scanning/Scanner";
import { TokenType } from "@interpreter/scanning/TokenType";
import keywords from "@interpreter/scanning/keywords";

export default defineComponent({
  name: "HHaggisEditor",
  components: {},
  setup() {
    const code = ref("");
    const highlightedCode = ref("");

    const scanner = new Scanner("");

    watch(code, (code) => {
      highlightedCode.value = code;
      scanner.source = code;

      const tokens = scanner.scanTokens();

      for (let i = tokens.length - 1; i >= 0; i--) {
        const token = tokens[i];
        const next = tokens[i + 1];
        const tokenName = TokenType[token.type];

        const before = code.substring(0, token.index);
        const after = code.substring(token.index + token.lexeme.length);

        let klass = "";
        if (
          keywords[token.lexeme] &&
          token.lexeme.search(/MOD|DISPLAY|KEYBOARD|true|false/) === -1
        ) {
          klass = "text-primary-500";
        } else if (tokenName.search(/LITERAL|TRUE|FALSE/) !== -1) {
          klass = "text-pink-500";
        } else if (tokenName.includes("LEFT") || tokenName.includes("RIGHT")) {
          klass = "text-rose-700";
        } else if (
          tokenName.search(
            /MINUS|PLUS|SLASH|STAR|CARET|MOD|AMPERSAND|EQUAL|LESS|GREATER|MOD/
          ) !== -1
        ) {
          klass = "text-accent-500";
        } else if (
          (token.type === TokenType.IDENTIFIER &&
            next?.type === TokenType.LEFT_PAREN) ||
          tokenName.search(/DISPLAY|KEYBOARD/) !== -1
        ) {
          klass = "text-emerald-500";
        }

        code = `${before}<span class="${klass}">${token.lexeme}</span>${after}`;
      }

      highlightedCode.value = code;
    });

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
    const highlighted = ref<HTMLPreElement>();

    const height = ref(0);
    onMounted(() => {
      height.value = container.value.getBoundingClientRect().height;
    });

    useResizeObserver(document.body, () => {
      container.value.style.height = `${height.value}px`;
    });

    const scroll = useScroll(textarea);
    watchEffect(() => {
      if (!highlighted.value) return;

      highlighted.value.scrollTop = scroll.y.value;
      highlighted.value.scrollLeft = scroll.x.value;
    });

    const handleEditorKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Tab") {
        e.preventDefault();
        code.value += "\t";
      }
    };

    return {
      code,
      highlightedCode,
      lines,

      container,
      textarea,
      highlighted,
      scroll,

      handleEditorKeyDown,
    };
  },
});
</script>

<template>
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
        <!-- line numbers -->
        <div
          class="
            max-w-14
            bg-primary-100
            text-primary-500
            py-3
            flex flex-col
            items-center
          "
          :style="{ marginTop: `-${scroll.y.value}px` }"
        >
          <div v-for="i in lines" :key="i" class="px-3">{{ i }}</div>
        </div>

        <div class="relative flex-grow">
          <!-- editor -->
          <textarea
            class="
              code-container
              overflow-scroll
              outline-none
              bg-transparent
              resize-none
              text-transparent
              caret-t-main
              h-full
              w-full
              absolute
              top-0
              left-0
              z-10
              p-3
              whitespace-nowrap
            "
            ref="textarea"
            v-model="code"
            name="code"
            autocomplete="false"
            spellcheck="false"
            @keydown="handleEditorKeyDown"
          ></textarea>

          <!-- highlighted -->
          <pre
            ref="highlighted"
            class="
              code-container
              absolute
              top-0
              left-0
              p-3
              w-full
              h-full
              whitespace-nowrap
              overflow-scroll
              text-t-main
            "
            aria-hidden="true"
          >
              <code class="whitespace-pre-wrap" v-html="highlightedCode"></code>
            </pre>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.code-container::-webkit-scrollbar {
  display: none;
}
</style>