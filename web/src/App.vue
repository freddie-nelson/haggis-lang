<script lang="ts">
import { defineComponent, onMounted } from "vue";
import { useStore } from "./store";
import themes from "@/utils/themes";

import CThemeSelector from "./components/shared/CThemeSelector.vue";
import CToastController from "./components/shared/Toast/CToastController.vue";

export default defineComponent({
  name: "App",
  components: { CToastController, CThemeSelector },
  setup() {
    const store = useStore();

    onMounted(() => {
      const html = document.querySelector("html");
      const theme = "light";
      html?.classList.add(theme);

      store.setTheme(theme);
    });
  },
});
</script>

<template>
  <c-toast-controller />

  <c-theme-selector class="hidden" />

  <router-view class="bg-bg-light w-full min-h-screen" />

  <div id="modals"></div>

  <!-- force tailwind to compile classes -->
  <span class=""></span>
</template>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body,
#app {
  width: 100%;
  min-height: 100vh;
}
</style>
