<script setup lang="ts">
import BabylonScene from "./components/BabylonScene.vue";
import { ref, onMounted } from "@vue/runtime-core";
import { createScene } from "./scripts/scenes/index";

// const canvasRef = ref(null);

// onMounted(() => {
//   if (canvasRef.value) {
//     createScene(canvasRef.value);
//   }
// });
</script>

<template>
    <header>
        <div class="wrapper">
            <div class="container">
                <div class="canvas-wrapper">
                    <BabylonScene />
                    <!-- <canvas ref="canvasRef" width="500" height="500"></canvas> -->
                    <canvas id="canvas" width="500" height="500"></canvas>
                </div>

                <!-- <div id="scatter-gl-container"></div> -->
            </div>
        </div>
    </header>
</template>

<style scoped>
header {
    line-height: 1.5;
    max-height: 100vh;
}

.logo {
    display: block;
    margin: 0 auto 2rem;
}

nav {
    width: 100%;
    font-size: 12px;
    text-align: center;
    margin-top: 2rem;
}

nav a.router-link-exact-active {
    color: var(--color-text);
}

nav a.router-link-exact-active:hover {
    background-color: transparent;
}

nav a {
    display: inline-block;
    padding: 0 1rem;
    border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
    border: 0;
}

@media (min-width: 1024px) {
    header {
        display: flex;
        place-items: center;
        padding-right: calc(var(--section-gap) / 2);
    }

    .logo {
        margin: 0 2rem 0 0;
    }

    header .wrapper {
        top: 0;
        left: 0;
        display: flex;
        place-items: flex-start;
        flex-wrap: wrap;
    }

    nav {
        text-align: left;
        margin-left: -1rem;
        font-size: 1rem;

        padding: 1rem 0;
        margin-top: 1rem;
    }

    #canvas-wrapper,
    #scatter-gl-container {
        top: 500px;
        width: 100%;
        height: 100%;
        overflow: hidden;
        position: relative;
    }
}
</style>
