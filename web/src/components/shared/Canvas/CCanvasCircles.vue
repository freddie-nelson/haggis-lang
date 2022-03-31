<template>
  <canvas ref="canvas"></canvas>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref, reactive } from "vue";
import { useMouse, Mouse } from "@/utils/useMouse";

export default defineComponent({
  name: "CCanvasCircles",
  components: {},
  props: {
    fadeOut: {
      type: Boolean,
      default: false,
    },
    useWindow: {
      type: Boolean,
      default: false,
    },
    brushColor: {
      type: String,
      default: "red",
    },
    brushSize: {
      type: Number,
      default: 20,
    },
    bgFill: {
      type: String,
      default: "rgba(255,255,255,0.17)",
    },
  },
  setup(props, { emit }) {
    const canvas = ref(document.createElement("canvas"));
    let ctx: CanvasRenderingContext2D | null = null;

    const drawCircle = (e?: MouseEvent) => {
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, props.brushSize, 0, 2 * Math.PI, false);
      ctx.fillStyle = props.brushColor;
      ctx.fill();

      emit("paint");
    };

    let mouse = reactive<Mouse>({
      pressed: false,
      x: -100,
      y: -100,
      lastX: 0,
      lastY: 0,
      onMouseDown: () => drawCircle(),
      onMouseMove: (e?: MouseEvent) => {
        if (mouse.pressed) drawCircle(e);
      },
    });

    let stopMouse = () => {
      return;
    };

    const setupCanvas = () => {
      canvas.value.width = canvas.value.clientWidth;
      canvas.value.height = canvas.value.clientHeight;

      ctx = canvas.value.getContext("2d");
      if (!ctx) return;

      const element = props.useWindow ? document.body : canvas.value;

      const temp = useMouse(element, mouse);
      stopMouse = temp.stopMouse;
    };

    const fadeOut = () => {
      ctx.fillStyle = props.bgFill;
      ctx.fillRect(0, 0, canvas.value?.width, canvas.value?.height);

      if (canvas.value) setTimeout(fadeOut, 100); // 24 times per second
    };

    const resizeObserver = new ResizeObserver(() => {
      canvas.value.width = canvas.value.clientWidth;
      canvas.value.height = canvas.value.clientHeight;
    });

    onMounted(() => {
      setupCanvas();

      if (props.fadeOut) {
        fadeOut();
      }

      resizeObserver.observe(canvas.value);
    });

    onUnmounted(() => {
      resizeObserver.disconnect();

      if (props.useWindow) {
        stopMouse();
      }
    });

    return { canvas };
  },
});
</script>

<style lang="scss" scoped></style>
