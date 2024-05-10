---
layout: page
---

<script setup>
import { ref, onMounted } from 'vue'

const container = ref(null)

onMounted(async () => {
  await import("@apps/playground/playground.css");
  const { createPlayground } = await import('@apps/playground');
  createPlayground(container.value);
});
</script>

<style scoped>
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

<div class="page">
  <div class="playground" ref="container">
    Loading...
  </div>
</div>
