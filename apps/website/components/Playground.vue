<script setup>
import { ref, onMounted } from "vue";
import Loader from "./Loader.vue";

const container = ref(null);

onMounted(async () => {
  window.MonacoEnvironment ??= {};
  window.MonacoEnvironment.getWorker ??= async (_workerId, label) => {
    const module = await getWorkerModule(label);
    const constructor = module.default;
    const worker = new constructor();
    return worker;
  };

  function getWorkerModule(label) {
    switch (label) {
      case "css":
      case "scss":
      case "less":
        return import("@apps/playground/dist/monaco/workers/css.js?worker");
      case "html":
      case "handlebars":
      case "razor":
        return import("@apps/playground/dist/monaco/workers/html.js?worker");
      case "json":
        return import("@apps/playground/dist/monaco/workers/json.js?worker");
      case "typescript":
      case "javascript":
        return import("@apps/playground/dist/monaco/workers/typescript.js?worker");
      default:
        return import("@apps/playground/dist/monaco/workers/editor.js?worker");
    }
  }

  await import("@apps/playground/playground.css");
  const { createPlayground } = await import("@apps/playground");
  createPlayground(container.value);
});
</script>

<style scoped>
:global(.VPHome) {
  margin-inline: auto;
}

:global(.VPContent),
:global(.VPPage),
:global(.VPPage > div),
:global(.VPPage > div > div),
.page {
  display: flex;
  min-height: 100%;
  width: 100%;
}

.page {
  padding: 1rem;
}

.playground {
  margin: 0 auto;
}
</style>

<template>
  <div class="page">
    <div class="playground" ref="container">
      <Loader />
    </div>
  </div>
</template>
