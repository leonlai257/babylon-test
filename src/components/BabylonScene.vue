<script lang="ts">
import { ref, onMounted } from '@vue/runtime-core';
import { createScene } from '../scripts/scenes/index';

export default {
    name: 'BabylonScene',
    setup() {
        const bjsCanvas = ref(null);

        onMounted(() => {
            if (bjsCanvas.value) {
                createScene(bjsCanvas.value);
            }
        });

        return {
            bjsCanvas,
        };
    },
};
</script>

<template>
    <canvas ref="bjsCanvas" width="2400" height="1100" />
</template>
