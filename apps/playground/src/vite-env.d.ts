/// <reference types="vite/client" />
import type { HTML } from "~/lib/html";

declare module "*.html" {
  const html: HTML;
  export default HTML;
}
