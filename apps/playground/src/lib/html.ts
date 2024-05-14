export type HTML = string & { __brand: "html" };

export default function html(
  template: TemplateStringsArray,
  ...substitutions: unknown[]
): HTML {
  return String.raw(template, ...substitutions) as HTML;
}
