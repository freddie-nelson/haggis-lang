import { onMounted, onUnmounted } from "vue";

export default function (
  element: HTMLElement,
  event: keyof HTMLElementEventMap,
  callback: (e: Event) => void,
  opts: any = {}
) {
  onMounted(() => {
    element.addEventListener(event, callback, opts);
  });

  onUnmounted(() => {
    element.removeEventListener(event, callback, opts);
  });
}
