import { createContentLoader } from "vitepress";

export default createContentLoader("../CONTRIBUTING.md", {
  render: true,
});
