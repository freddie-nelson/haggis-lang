<template>
  <canvas ref="canvas"></canvas>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref, reactive } from "vue";
import { useMouse, Mouse } from "@/utils/useMouse";

export default defineComponent({
  name: "CCanvasDraw",
  components: {},
  props: {
    brushColor: {
      type: String,
      default: "red",
    },
    brushSize: {
      type: Number,
      default: 20,
    },
  },
  setup(props, { emit }) {
    const canvas = ref(document.createElement("canvas"));
    let ctx: CanvasRenderingContext2D | null = null;

    const drawPath = (e?: MouseEvent) => {
      ctx.beginPath();
      ctx.moveTo(mouse.lastX, mouse.lastY);
      ctx.strokeStyle = props.brushColor;
      ctx.lineWidth = props.brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineTo(mouse.x, mouse.y);
      ctx.stroke();

      emit("paint");
    };

    let mouse = reactive<Mouse>({
      pressed: false,
      x: 0,
      y: 0,
      lastX: 0,
      lastY: 0,
      onMouseDown: drawPath,
      onMouseMove: (e?: MouseEvent) => {
        if (mouse.pressed) drawPath();
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

      const temp = useMouse(canvas.value, mouse);
      stopMouse = temp.stopMouse;
    };

    const resizeObserver = new ResizeObserver(() => {
      canvas.value.width = canvas.value.clientWidth;
      canvas.value.height = canvas.value.clientHeight;
    });

    onMounted(() => {
      setupCanvas();

      resizeObserver.observe(canvas.value);
    });

    onUnmounted(() => {
      resizeObserver.disconnect();
      stopMouse();
    });

    return { canvas };
  },
});
</script>

<style lang="scss" scoped></style>
