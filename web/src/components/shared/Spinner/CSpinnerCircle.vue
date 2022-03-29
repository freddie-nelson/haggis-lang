<template>
  <div>
    <svg
      class="overflow-visible"
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
    >
      <defs>
        <linearGradient
          id="spinner-circle-gradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stop-color="var(--primary-500)" />
          <stop offset="100%" stop-color="var(--accent-500)" />
        </linearGradient>
      </defs>

      <circle
        class="spinner origin-center transform"
        stroke="url(#spinner-circle-gradient)"
        vector-effect="non-scaling-stroke"
        fill="none"
        stroke-width="2.5rem"
        r="50%"
        cx="50"
        cy="50"
        stroke-dasharray="300 10000"
        stroke-linecap="round"
      ></circle>
    </svg>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "CSpinnerCircle",
  components: {},
});
</script>

<style lang="scss" scoped>
.spinner {
  animation: spin 1.5s linear infinite, rotate 2s ease-in-out infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@keyframes spin {
  from {
    stroke-dasharray: 300 10000;
    stroke-dashoffset: 300;
  }

  50% {
    stroke-dasharray: 500 10000;
  }

  to {
    stroke-dasharray: 300 10000;
    stroke-dashoffset: -1000;
  }
}
</style>