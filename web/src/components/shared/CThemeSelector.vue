<template>
  <button
    class="
      fixed
      bottom-5
      right-5
      text-t-main
      h-6
      flex
      items-center
      transform
      scale-110
      opacity-40
      hover:opacity-75
      transition-opacity
      duration-300
      outline-none
    "
    @click="showModal = true"
  >
    <p class="mr-2 text-sm font-mono font-medium">{{ chosenTheme }}</p>
    <Icon class="w-6 h-6" :icon="icons.theme" />
  </button>

  <c-modal
    v-if="showModal"
    closeable
    @close="showModal = false"
    class="max-w-2xl w-10/12 h-5/6"
  >
    <div
      class="flex flex-col overflow-y-scroll h-full scroll pr-2 text-bg-light"
    >
      <button
        v-for="theme in themes"
        :key="theme"
        class="
          flex
          py-1.5
          px-2
          my-1
          rounded-sm
          text-sm
          font-mono font-medium
          opacity-70
          hover:opacity-100 hover:text-bg-dark hover:bg-input-blur-dark
          transition-all
          duration-300
          outline-none
        "
        :class="chosenTheme === theme ? 'opacity-100 text-primary-600' : ''"
        @click="changeTheme(theme)"
      >
        {{ theme }}
      </button>
    </div>
  </c-modal>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from "vue";
import { useStore } from "@/store";
import themes from "@/utils/themes";

import CModal from "./Modal/CModal.vue";

import { Icon } from "@iconify/vue";
import themeIcon from "@iconify-icons/feather/layout";

export default defineComponent({
  name: "CThemeSelector",
  components: {
    CModal,
    Icon,
  },
  setup() {
    const store = useStore();

    const showModal = ref(false);

    const chosenTheme = computed(() => store.theme);

    const changeTheme = (theme: string) => {
      if (!themes.includes(theme)) return;

      const html = document.querySelector("html");
      if (html) {
        html.classList.remove(store.theme);
        html.classList.add(theme);

        store.setTheme(theme);
      }
    };

    return {
      showModal,

      themes,
      chosenTheme,
      changeTheme,

      icons: {
        theme: themeIcon,
      },
    };
  },
});
</script>

<style lang="scss">
.scroll {
  &::-webkit-scrollbar {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--bg-light);
    border-radius: 2rem;
    opacity: 0.6;
  }
}

body {
  color: var(--t-main);
}

:root.light {
  --primary-100: theme("colors.primaryColor.100");
  --primary-200: theme("colors.primaryColor.200");
  --primary-300: theme("colors.primaryColor.300");
  --primary-400: theme("colors.primaryColor.400");
  --primary-500: theme("colors.primaryColor.500");
  --primary-600: theme("colors.primaryColor.600");
  --primary-700: theme("colors.primaryColor.700");
  --primary-800: theme("colors.primaryColor.800");
  --primary-900: theme("colors.primaryColor.900");
  --accent-100: theme("colors.accentColor.100");
  --accent-200: theme("colors.accentColor.200");
  --accent-300: theme("colors.accentColor.300");
  --accent-400: theme("colors.accentColor.400");
  --accent-500: theme("colors.accentColor.500");
  --accent-600: theme("colors.accentColor.600");
  --accent-700: theme("colors.accentColor.700");
  --accent-800: theme("colors.accentColor.800");
  --accent-900: theme("colors.accentColor.900");
  --bg-dark: theme("colors.coolGray.800");
  --bg-light: theme("colors.coolGray.50");
  --t-main: theme("colors.coolGray.900");
  --t-sub: theme("colors.coolGray.400");
  --b-light: theme("colors.coolGray.400");
  --b-dark: theme("colors.coolGray.600");
  --b-highlight: var(--primary-400);
  --b-light-dark: theme("colors.coolGray.500");
  --b-dark-dark: theme("colors.coolGray.700");
  --b-highlight-dark: var(--primary-500);
  --input-focus: theme("colors.coolGray.700");
  --input-blur: theme("colors.coolGray.500");
  --input-light: theme("colors.coolGray.300");
  --input-focus-dark: theme("colors.coolGray.200");
  --input-blur-dark: theme("colors.coolGray.400");
  --input-light-dark: theme("colors.coolGray.600");
}

:root.dark {
  --primary-100: theme("colors.primaryColorDark.100");
  --primary-200: theme("colors.primaryColorDark.200");
  --primary-300: theme("colors.primaryColorDark.300");
  --primary-400: theme("colors.primaryColorDark.400");
  --primary-500: theme("colors.primaryColorDark.500");
  --primary-600: theme("colors.primaryColorDark.600");
  --primary-700: theme("colors.primaryColorDark.700");
  --primary-800: theme("colors.primaryColorDark.800");
  --primary-900: theme("colors.primaryColorDark.900");
  --accent-100: theme("colors.accentColorDark.100");
  --accent-200: theme("colors.accentColorDark.200");
  --accent-300: theme("colors.accentColorDark.300");
  --accent-400: theme("colors.accentColorDark.400");
  --accent-500: theme("colors.accentColorDark.500");
  --accent-600: theme("colors.accentColorDark.600");
  --accent-700: theme("colors.accentColorDark.700");
  --accent-800: theme("colors.accentColorDark.800");
  --accent-900: theme("colors.accentColorDark.900");
  --bg-dark: theme("colors.gray.50");
  --bg-light: theme("colors.gray.900");
  --t-main: theme("colors.gray.200");
  --t-sub: theme("colors.gray.500");
  --b-light: theme("colors.gray.500");
  --b-dark: theme("colors.gray.300");
  --b-highlight: var(--primary-500);
  --b-light-dark: theme("colors.gray.400");
  --b-dark-dark: theme("colors.gray.600");
  --b-highlight-dark: var(--primary-400);
  --input-focus: theme("colors.gray.200");
  --input-blur: theme("colors.gray.400");
  --input-light: theme("colors.gray.800");
  --input-focus-dark: theme("colors.gray.700");
  --input-blur-dark: theme("colors.gray.500");
  --input-light-dark: theme("colors.gray.100");
}

:root.solarized {
  --primary-100: theme("colors.primaryColorSolarized.100");
  --primary-200: theme("colors.primaryColorSolarized.200");
  --primary-300: theme("colors.primaryColorSolarized.300");
  --primary-400: theme("colors.primaryColorSolarized.400");
  --primary-500: theme("colors.primaryColorSolarized.500");
  --primary-600: theme("colors.primaryColorSolarized.600");
  --primary-700: theme("colors.primaryColorSolarized.700");
  --primary-800: theme("colors.primaryColorSolarized.800");
  --primary-900: theme("colors.primaryColorSolarized.900");
  --accent-100: theme("colors.accentColorSolarized.100");
  --accent-200: theme("colors.accentColorSolarized.200");
  --accent-300: theme("colors.accentColorSolarized.300");
  --accent-400: theme("colors.accentColorSolarized.400");
  --accent-500: theme("colors.accentColorSolarized.500");
  --accent-600: theme("colors.accentColorSolarized.600");
  --accent-700: theme("colors.accentColorSolarized.700");
  --accent-800: theme("colors.accentColorSolarized.800");
  --accent-900: theme("colors.accentColorSolarized.900");
  --bg-dark: theme("colors.warmGray.50");
  --bg-light: theme("colors.warmGray.900");
  --t-main: theme("colors.warmGray.200");
  --t-sub: theme("colors.warmGray.500");
  --b-light: theme("colors.warmGray.500");
  --b-dark: theme("colors.warmGray.300");
  --b-highlight: var(--primary-500);
  --b-light-dark: theme("colors.warmGray.400");
  --b-dark-dark: theme("colors.warmGray.600");
  --b-highlight-dark: var(--primary-400);
  --input-focus: theme("colors.warmGray.200");
  --input-blur: theme("colors.warmGray.400");
  --input-light: theme("colors.warmGray.800");
  --input-focus-dark: theme("colors.warmGray.700");
  --input-blur-dark: theme("colors.warmGray.500");
  --input-light-dark: theme("colors.warmGray.100");
}

:root.joker {
  --primary-100: theme("colors.primaryColorJoker.100");
  --primary-200: theme("colors.primaryColorJoker.200");
  --primary-300: theme("colors.primaryColorJoker.300");
  --primary-400: theme("colors.primaryColorJoker.400");
  --primary-500: theme("colors.primaryColorJoker.500");
  --primary-600: theme("colors.primaryColorJoker.600");
  --primary-700: theme("colors.primaryColorJoker.700");
  --primary-800: theme("colors.primaryColorJoker.800");
  --primary-900: theme("colors.primaryColorJoker.900");
  --accent-100: theme("colors.accentColorJoker.100");
  --accent-200: theme("colors.accentColorJoker.200");
  --accent-300: theme("colors.accentColorJoker.300");
  --accent-400: theme("colors.accentColorJoker.400");
  --accent-500: theme("colors.accentColorJoker.500");
  --accent-600: theme("colors.accentColorJoker.600");
  --accent-700: theme("colors.accentColorJoker.700");
  --accent-800: theme("colors.accentColorJoker.800");
  --accent-900: theme("colors.accentColorJoker.900");
  --bg-dark: theme("colors.jokerPurple.50");
  --bg-light: theme("colors.jokerPurple.900");
  --t-main: theme("colors.jokerPurple.200");
  --t-sub: theme("colors.jokerPurple.500");
  --b-light: theme("colors.jokerPurple.500");
  --b-dark: theme("colors.jokerPurple.300");
  --b-highlight: var(--primary-500);
  --b-light-dark: theme("colors.jokerPurple.400");
  --b-dark-dark: theme("colors.jokerPurple.600");
  --b-highlight-dark: var(--primary-400);
  --input-focus: theme("colors.jokerPurple.200");
  --input-blur: theme("colors.jokerPurple.400");
  --input-light: theme("colors.jokerPurple.800");
  --input-focus-dark: theme("colors.jokerPurple.700");
  --input-blur-dark: theme("colors.jokerPurple.500");
  --input-light-dark: theme("colors.jokerPurple.100");
}

:root.matrix {
  --primary-100: theme("colors.primaryColorMatrix.100");
  --primary-200: theme("colors.primaryColorMatrix.200");
  --primary-300: theme("colors.primaryColorMatrix.300");
  --primary-400: theme("colors.primaryColorMatrix.400");
  --primary-500: theme("colors.primaryColorMatrix.500");
  --primary-600: theme("colors.primaryColorMatrix.600");
  --primary-700: theme("colors.primaryColorMatrix.700");
  --primary-800: theme("colors.primaryColorMatrix.800");
  --primary-900: theme("colors.primaryColorMatrix.900");
  --accent-100: theme("colors.accentColorMatrix.100");
  --accent-200: theme("colors.accentColorMatrix.200");
  --accent-300: theme("colors.accentColorMatrix.300");
  --accent-400: theme("colors.accentColorMatrix.400");
  --accent-500: theme("colors.accentColorMatrix.500");
  --accent-600: theme("colors.accentColorMatrix.600");
  --accent-700: theme("colors.accentColorMatrix.700");
  --accent-800: theme("colors.accentColorMatrix.800");
  --accent-900: theme("colors.accentColorMatrix.900");
  --bg-dark: theme("colors.black.50");
  --bg-light: theme("colors.black.900");
  --t-main: theme("colors.black.200");
  --t-sub: theme("colors.black.500");
  --b-light: theme("colors.black.500");
  --b-dark: theme("colors.black.300");
  --b-highlight: var(--primary-500);
  --b-light-dark: theme("colors.black.400");
  --b-dark-dark: theme("colors.black.600");
  --b-highlight-dark: var(--primary-400);
  --input-focus: theme("colors.black.200");
  --input-blur: theme("colors.black.400");
  --input-light: theme("colors.black.800");
  --input-focus-dark: theme("colors.black.700");
  --input-blur-dark: theme("colors.black.500");
  --input-light-dark: theme("colors.black.100");
}

:root.strawberry {
  --primary-100: theme("colors.primaryColorStrawberry.100");
  --primary-200: theme("colors.primaryColorStrawberry.200");
  --primary-300: theme("colors.primaryColorStrawberry.300");
  --primary-400: theme("colors.primaryColorStrawberry.400");
  --primary-500: theme("colors.primaryColorStrawberry.500");
  --primary-600: theme("colors.primaryColorStrawberry.600");
  --primary-700: theme("colors.primaryColorStrawberry.700");
  --primary-800: theme("colors.primaryColorStrawberry.800");
  --primary-900: theme("colors.primaryColorStrawberry.900");
  --accent-100: theme("colors.accentColorStrawberry.100");
  --accent-200: theme("colors.accentColorStrawberry.200");
  --accent-300: theme("colors.accentColorStrawberry.300");
  --accent-400: theme("colors.accentColorStrawberry.400");
  --accent-500: theme("colors.accentColorStrawberry.500");
  --accent-600: theme("colors.accentColorStrawberry.600");
  --accent-700: theme("colors.accentColorStrawberry.700");
  --accent-800: theme("colors.accentColorStrawberry.800");
  --accent-900: theme("colors.accentColorStrawberry.900");
  --bg-dark: theme("colors.strawberry.800");
  --bg-light: theme("colors.strawberry.50");
  --t-main: theme("colors.strawberry.900");
  --t-sub: theme("colors.strawberry.400");
  --b-light: theme("colors.strawberry.400");
  --b-dark: theme("colors.strawberry.600");
  --b-highlight: var(--primary-400);
  --b-light-dark: theme("colors.strawberry.500");
  --b-dark-dark: theme("colors.strawberry.700");
  --b-highlight-dark: var(--primary-500);
  --input-focus: theme("colors.strawberry.700");
  --input-blur: theme("colors.strawberry.500");
  --input-light: theme("colors.strawberry.300");
  --input-focus-dark: theme("colors.strawberry.200");
  --input-blur-dark: theme("colors.strawberry.400");
  --input-light-dark: theme("colors.strawberry.600");
}

:root.cupcake {
  --primary-100: theme("colors.primaryColorCupcake.100");
  --primary-200: theme("colors.primaryColorCupcake.200");
  --primary-300: theme("colors.primaryColorCupcake.300");
  --primary-400: theme("colors.primaryColorCupcake.400");
  --primary-500: theme("colors.primaryColorCupcake.500");
  --primary-600: theme("colors.primaryColorCupcake.600");
  --primary-700: theme("colors.primaryColorCupcake.700");
  --primary-800: theme("colors.primaryColorCupcake.800");
  --primary-900: theme("colors.primaryColorCupcake.900");
  --accent-100: theme("colors.accentColorCupcake.100");
  --accent-200: theme("colors.accentColorCupcake.200");
  --accent-300: theme("colors.accentColorCupcake.300");
  --accent-400: theme("colors.accentColorCupcake.400");
  --accent-500: theme("colors.accentColorCupcake.500");
  --accent-600: theme("colors.accentColorCupcake.600");
  --accent-700: theme("colors.accentColorCupcake.700");
  --accent-800: theme("colors.accentColorCupcake.800");
  --accent-900: theme("colors.accentColorCupcake.900");
  --bg-dark: theme("colors.black.800");
  --bg-light: theme("colors.black.50");
  --t-main: theme("colors.black.900");
  --t-sub: theme("colors.black.400");
  --b-light: theme("colors.black.400");
  --b-dark: theme("colors.black.600");
  --b-highlight: var(--primary-400);
  --b-light-dark: theme("colors.black.500");
  --b-dark-dark: theme("colors.black.700");
  --b-highlight-dark: var(--primary-500);
  --input-focus: theme("colors.black.700");
  --input-blur: theme("colors.black.500");
  --input-light: theme("colors.black.300");
  --input-focus-dark: theme("colors.black.200");
  --input-blur-dark: theme("colors.black.400");
  --input-light-dark: theme("colors.black.600");
}

:root.nord {
  --primary-100: theme("colors.primaryColorNord.100");
  --primary-200: theme("colors.primaryColorNord.200");
  --primary-300: theme("colors.primaryColorNord.300");
  --primary-400: theme("colors.primaryColorNord.400");
  --primary-500: theme("colors.primaryColorNord.500");
  --primary-600: theme("colors.primaryColorNord.600");
  --primary-700: theme("colors.primaryColorNord.700");
  --primary-800: theme("colors.primaryColorNord.800");
  --primary-900: theme("colors.primaryColorNord.900");
  --accent-100: theme("colors.accentColorNord.100");
  --accent-200: theme("colors.accentColorNord.200");
  --accent-300: theme("colors.accentColorNord.300");
  --accent-400: theme("colors.accentColorNord.400");
  --accent-500: theme("colors.accentColorNord.500");
  --accent-600: theme("colors.accentColorNord.600");
  --accent-700: theme("colors.accentColorNord.700");
  --accent-800: theme("colors.accentColorNord.800");
  --accent-900: theme("colors.accentColorNord.900");
  --bg-dark: theme("colors.nord.50");
  --bg-light: theme("colors.nord.900");
  --t-main: theme("colors.nord.200");
  --t-sub: theme("colors.nord.500");
  --b-light: theme("colors.nord.500");
  --b-dark: theme("colors.nord.300");
  --b-highlight: var(--primary-500);
  --b-light-dark: theme("colors.nord.400");
  --b-dark-dark: theme("colors.nord.600");
  --b-highlight-dark: var(--primary-400);
  --input-focus: theme("colors.nord.200");
  --input-blur: theme("colors.nord.400");
  --input-light: theme("colors.nord.800");
  --input-focus-dark: theme("colors.nord.700");
  --input-blur-dark: theme("colors.nord.500");
  --input-light-dark: theme("colors.nord.100");
}
</style>