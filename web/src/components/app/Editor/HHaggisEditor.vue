<script lang="ts">
import {
  computed,
  defineComponent,
  nextTick,
  onMounted,
  ref,
  watch,
  watchEffect,
} from "vue";
import { useResizeObserver, useScroll } from "@vueuse/core";

import { Icon } from "@iconify/vue";
import openIcon from "@iconify-icons/feather/chevron-left";

import syntaxHighlighting from "./highlighting";
import HEditorTerminal from "./HEditorTerminal.vue";
import { useMouse } from "@/utils/useMouse";
import useComponentEvent from "@/utils/useComponentEvent";

export default defineComponent({
  name: "HHaggisEditor",
  components: { HEditorTerminal, Icon },
  setup(props, { emit }) {
    const code = ref("");
    const highlightedCode = ref("");

    const lines = computed(() => {
      return code.value.split("\n");
    });

    // live highlighting and analysis
    watch(code, (code) => {
      emit("code", code);

      highlightedCode.value = syntaxHighlighting(code);
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
      let cursor = textarea.value.selectionStart + 1;

      if (e.code === "Tab") {
        code.value =
          code.value.slice(0, textarea.value.selectionStart) +
          "\t" +
          code.value.slice(textarea.value.selectionStart);
      } else if (e.code === "Enter") {
        let tabs = 0;

        // find line cursor is on
        let line = 0;
        let col = 0;

        for (let i = 0; i <= textarea.value.selectionStart; i++) {
          const char = code.value[i];
          col++;

          if (char === "\n") {
            line++;
            col = 0;
          }
        }

        // count tabs on line before cursor
        for (let i = 0; i < lines.value[line].length; i++) {
          if (i === col - 1) break;

          const char = lines.value[line][i];
          if (char !== "\t") break;

          tabs++;
        }

        cursor += tabs;

        // add tabs to new line
        code.value =
          code.value.slice(0, textarea.value.selectionStart) +
          "\n" +
          "\t".repeat(tabs) +
          code.value.slice(textarea.value.selectionStart);
      }

      if (e.code === "Tab" || e.code === "Enter") {
        e.preventDefault();

        requestAnimationFrame(() => {
          textarea.value.selectionStart = cursor;
          textarea.value.selectionEnd = cursor;
        });
      }
    };

    const terminal = ref<InstanceType<typeof HEditorTerminal>>();

    const editorWidth = ref(67);
    const terminalWidth = ref(33);

    const setEditorWidth = (width: number) => {
      editorWidth.value = width;
      terminalWidth.value = 100 - width;
    };

    const setTerminalWidth = (width: number) => {
      terminalWidth.value = width;
      editorWidth.value = 100 - width;
    };

    const { mouse } = useMouse(document.body);
    const holdingSeparator = ref(false);

    watchEffect(() => {
      if (!holdingSeparator.value) return;

      const editorRect = textarea.value.getBoundingClientRect();
      const terminalRect = terminal.value.$el.getBoundingClientRect();
      const x = mouse.x - editorRect.x;

      let percentage = (x / (editorRect.width + terminalRect.width)) * 100;
      percentage = Math.min(75, Math.max(0, 100 - percentage));

      setTerminalWidth(percentage);
    });

    useComponentEvent(document.body, "mouseup", () => {
      holdingSeparator.value = false;
    });

    const insertChar = (char: string) => {
      const cursor = textarea.value.selectionStart + 1;

      code.value =
        code.value.substring(0, textarea.value.selectionStart) +
        char +
        code.value.substring(textarea.value.selectionStart);

      textarea.value.focus();

      requestAnimationFrame(() => {
        textarea.value.selectionStart = cursor;
        textarea.value.selectionEnd = cursor;
      });
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

      terminal,
      editorWidth,
      terminalWidth,
      setEditorWidth,
      setTerminalWidth,

      holdingSeparator,

      insertChar,

      icons: {
        open: openIcon,
      },
    };
  },
});
</script>

<template>
  <div class="flex flex-col flex-grow gap-3">
    <div class="flex h-14">
      <div
        class="
          flex
          h-full
          w-52
          rounded-lg
          bg-input-light
          text-t-main
          font-bold font-mono
          text-lg
          gap-4
          p-2
        "
      >
        <button
          class="
            h-full
            flex-grow
            hover:bg-input-blur-dark
            rounded-md
            transition-colors
            duration-300
          "
          @click="insertChar('≠')"
        >
          ≠
        </button>
        <button
          class="
            h-full
            flex-grow
            hover:bg-input-blur-dark
            rounded-md
            transition-colors
            duration-300
          "
          @click="insertChar('≤')"
        >
          ≤
        </button>
        <button
          class="
            h-full
            flex-grow
            hover:bg-input-blur-dark
            rounded-md
            transition-colors
            duration-300
          "
          @click="insertChar('≥')"
        >
          ≥
        </button>
      </div>
    </div>

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
          :style="{ marginTop: `${-scroll.y.value}px` }"
        >
          <div v-for="(l, i) in lines" :key="i" class="px-3">{{ i + 1 }}</div>
        </div>

        <div
          class="relative flex-grow"
          :style="{ maxWidth: `${editorWidth}%` }"
        >
          <!-- editor -->
          <textarea
            id="playgroundCode"
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
              whitespace-pre
              overflow-scroll
              text-t-main
              block
            "
            v-html="highlightedCode"
          ></pre>
        </div>

        <!-- separator -->
        <div
          class="
            absolute
            z-20
            top-0
            h-full
            w-1.5
            cursor-col-resize
            bg-b-dark
            flex
            items-center
            transition-all
            duration-300
          "
          :class="{ 'transition-none': holdingSeparator }"
          :style="{ left: `${editorWidth}%` }"
          @mousedown.self="holdingSeparator = true"
        >
          <button
            class="
              absolute
              right-full
              -mr-1
              w-7
              h-14
              bg-b-dark
              rounded-l-lg
              text-bg-light
              cursor-pointer
            "
            @click="
              terminalWidth > 3 ? setTerminalWidth(0) : setTerminalWidth(33)
            "
          >
            <Icon
              class="w-full h-full transform transition-transform duration-300"
              :class="{ 'rotate-180': terminalWidth > 3 }"
              :icon="icons.open"
            />
          </button>
        </div>

        <!-- terminal -->
        <h-editor-terminal
          ref="terminal"
          class="h-full w-full transition-all duration-300 ml-auto"
          :class="{ 'transition-none': holdingSeparator }"
          :style="{ maxWidth: `${terminalWidth}%` }"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.code-container::-webkit-scrollbar {
  display: none;
}
</style>