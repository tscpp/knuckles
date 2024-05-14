declare module "*.html" {
  import type { HTML } from "~/lib/html";
  const html: HTML;
  export default html;
}

declare module "*.module.css" {
  const styles: Record<string, string>;
  export default styles;
}

declare module "*.module.scss" {
  const styles: Record<string, string>;
  export default styles;
}
