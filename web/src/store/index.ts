import { defineStore } from "pinia";
import { ref, watch } from "vue";

export interface Toast {
  text: string;
  duration?: number;
}

export const useStore = defineStore("main", () => {
  const toastQueue = ref<Toast[]>([]);
  const addToast = (toast: Toast) => {
    toastQueue.value.push(toast);
  };
  const removeToast = () => {
    toastQueue.value.shift();
  };

  const theme = ref("");
  const setTheme = (t: string) => {
    theme.value = t;
    localStorage.setItem("theme", t);
  };

  return {
    toastQueue,
    addToast,
    removeToast,

    theme,
    setTheme,
  };
});
