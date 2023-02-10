<script lang="ts">
import { ref, onMounted } from "@vue/runtime-core";
import { createScene } from "../scripts/scenes/index";

export default {
  name: "BabylonScene",
  setup() {
    const canvasRef = ref(null);

    onMounted(() => {
      if (canvasRef.value) {
        createScene(canvasRef.value);
      }
    });

    return {
      canvasRef,
    };
  },
};
</script>

<template>
  <canvas ref="canvasRef" width="500" height="500" />
</template>
