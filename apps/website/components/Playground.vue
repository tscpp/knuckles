<script setup>
import { ref, onMounted } from "vue";
import PlaygroundLoader from "./PlaygroundLoader.vue";

const container = ref(null);

onMounted(async () => {
  await import("@apps/playground/dist/playground.css");
  const { createPlayground } = await import("@apps/playground");
  const { default: esbuildWasmUrl } = await import(
    "esbuild-wasm/esbuild.wasm?url"
  );
  const { default: editorWorker } = await import(
    "monaco-editor/esm/vs/editor/editor.worker?worker"
  );
  const { default: jsonWorker } = await import(
    "monaco-editor/esm/vs/language/json/json.worker?worker"
  );
  const { default: cssWorker } = await import(
    "monaco-editor/esm/vs/language/css/css.worker?worker"
  );
  const { default: htmlWorker } = await import(
    "monaco-editor/esm/vs/language/html/html.worker?worker"
  );
  const { default: tsWorker } = await import(
    "monaco-editor/esm/vs/language/typescript/ts.worker?worker"
  );

  createPlayground(container.value, {
    monacoWorkerFactory: async (_workerId, label) => {
      if (label === "json") {
        return new jsonWorker();
      }
      if (label === "css" || label === "scss" || label === "less") {
        return new cssWorker();
      }
      if (label === "html" || label === "handlebars" || label === "razor") {
        return new htmlWorker();
      }
      if (label === "typescript" || label === "javascript") {
        return new tsWorker();
      }
      return new editorWorker();
    },
    esbuildWasmUrl,
  });
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
      <PlaygroundLoader />
    </div>
  </div>
</template>
