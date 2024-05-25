<script setup>
import { useData } from "vitepress/dist/client/theme-default/composables/data.js";
const { params } = useData();
location.href = new URL(params.value.url, location.href);
</script>

<a href="{{ $params.url }}">Redirecting...</a>
