<script setup lang="ts">
import VPLink from "vitepress/dist/client/theme-default/components/VPLink.vue";
import { useData } from "vitepress/dist/client/theme-default/composables/data.js";
import { useSidebar } from "vitepress/dist/client/theme-default/composables/sidebar.js";

const { theme, frontmatter } = useData();
const { hasSidebar } = useSidebar();
</script>

<template>
  <footer
    v-if="theme.footer && frontmatter.footer !== false"
    class="VPFooter"
    :class="{ 'has-sidebar': hasSidebar }"
  >
    <div class="container">
      <ul class="links">
        <li v-for="link in theme.footer.links" class="link">
          <VPLink :href="link.link" :no-icon="true">{{ link.text }}</VPLink>
        </li>
      </ul>
      <p
        v-if="theme.footer.disclaimer"
        class="disclaimer"
        v-html="theme.footer.disclaimer"
      ></p>
    </div>
  </footer>
</template>

<style scoped>
.VPFooter {
  position: relative;
  z-index: var(--vp-z-index-footer);
  border-top: 1px solid var(--vp-c-gutter);
  padding: 32px 24px;
  background-color: var(--vp-c-bg);
}

.VPFooter.has-sidebar {
  display: none;
}

.VPFooter :deep(a) {
  text-decoration-line: underline;
  text-underline-offset: 2px;
  transition: color 0.25s;
}

.VPFooter :deep(a:hover) {
  color: var(--vp-c-text-1);
}

@media (min-width: 768px) {
  .VPFooter {
    padding: 32px;
  }
}

.container {
  margin: 0 auto;
  max-width: var(--vp-layout-max-width);
  text-align: center;
}

.links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
}

.link {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 0;
}

.link a {
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-brand-3);
  text-decoration: none;
  text-underline-offset: 2px;
  padding: 0;
}

.link a:hover {
  color: var(--vp-c-brand-2);
}

.link + .link::before {
  content: "";
  /* position: absolute;
  transform: translate(-16px, 0); */
  display: inline flow-root;
  width: 1px;
  height: 16px;
  margin: 0 16px;
  background-color: var(--vp-c-divider);
}

.disclaimer {
  line-height: 24px;
  font-size: 13px;
  font-weight: 500;
  margin-top: 8px;
  color: var(--vp-c-text-2);
}
</style>
