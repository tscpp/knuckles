import * as ssr from "../src/node/index.js";
import { html, render } from "./common.js";
import assert from "node:assert/strict";

describe("server-side rendering", () => {
  test("renders text binding into element", async () => {
    const { modified } = await render(html`
      <!-- ko with: {} -->
      <div data-bind="text: 'Hello'"></div>
      <!-- /ko -->
    `);
    assert(modified);
    assert(modified.includes(">Hello<"));
  });

  test("renders data from inline viewmodel", async () => {
    const { modified } = await render(html`
      <!-- ko with: { name: 'SSR' } -->
      <div data-bind="text: 'Hello ' + name"></div>
      <!-- /ko -->
    `);
    assert(modified);
    assert(modified.includes(">Hello SSR<"));
  });

  test("resolves viewmodel from relative path", async () => {
    const { modified } = await render(
      html`
        <!-- ok with: default from "./viewmodel.js" -->
        <div data-bind="text: 'Hello ' + name"></div>
        <!-- /ok -->
      `,
      new URL("__fixtures__/unnamed.html", import.meta.url),
    );
    assert(modified);
    assert(modified.includes(">Hello SSR<"));
  });

  test("renders html binding into element", async () => {
    const { modified } = await render(html`
      <!-- ko with: {} -->
      <div data-bind="html: '<b>Hello</b>'"></div>
      <!-- /ko -->
    `);
    assert(modified);
    assert(modified.includes("><b>Hello</b><"));
  });

  test("renders visible binding on element", async () => {
    const { modified } = await render(html`
      <!-- ko with: {} -->
      <div data-bind="visible: false"></div>
      <!-- /ko -->
    `);
    assert(modified);
    assert(/style=["'][^]*display:\s*none/.test(modified));
  });

  test("renders class binding on element", async () => {
    const { modified } = await render(html`
      <!-- ko with: {} -->
      <div data-bind="class: 'foo'"></div>
      <!-- /ko -->
    `);
    assert(modified);
    assert(/class=["'][^]*foo/.test(modified));
  });

  test("renders css binding on element", async () => {
    const { modified } = await render(html`
      <!-- ko with: {} -->
      <div data-bind="css: { foo: true }"></div>
      <!-- /ko -->
    `);
    assert(modified);
    assert(/class=["'][^]*foo/.test(modified));
  });

  test("renders using custom plugin", async () => {
    const translations = {
      fr: {
        greeting: "bonjour",
      },
    };
    const i18nPlugin: ssr.Plugin = {
      filter: (binding) => binding.name.value === "i18n",
      ssr: ({ binding, generated, context, value }) => {
        const lang = (context.$data as any).language;
        const key = String(value());
        const asHtml = ssr.helpers.escapeHtml((translations as any)[lang][key]);

        if (binding.parent.inner.isEmpty) {
          generated.appendLeft(binding.parent.inner.start.offset, asHtml);
        } else {
          generated.update(...binding.parent.inner.offsets, asHtml);
        }
      },
    };
    const { modified } = await render(
      html`
        <!-- ko with: { language: "fr" } -->
        <div data-bind="i18n: 'greeting'"></div>
        <!-- /ko -->
      `,
      undefined,
      {
        plugins: [i18nPlugin],
      },
    );
    assert(modified);
    assert(modified.includes(`>${translations.fr.greeting}<`));
  });

  test("renders style binding on element", async () => {
    const { modified } = await render(html`
      <!-- ko with: {} -->
      <div data-bind="style: { color: 'red' }"></div>
      <!-- /ko -->
    `);
    assert(modified);
    assert(/style=["'][^]*color:\s*red/.test(modified));
  });

  test("renders attr binding on element", async () => {
    const { modified } = await render(html`
      <!-- ko with: {} -->
      <div data-bind="attr: { title: 'Hello' }"></div>
      <!-- /ko -->
    `);
    assert(modified);
    assert(/title=["'][^]*Hello/.test(modified));
  });

  test("renders with binding", async () => {
    const { modified } = await render(html`
      <!-- ko with: { foo: { bar: 'baz' } } -->
      <!-- ko with: foo -->
      <div data-bind="text: bar"></div>
      <!-- /ko -->
      <!-- /ko -->
    `);
    assert(modified);
    assert(modified.includes(">baz<"));
  });

  test("renders using binding", async () => {
    const { modified } = await render(html`
      <!-- ko with: { foo: { bar: 'baz' } } -->
      <div data-bind="using: foo, as: 'hi'">
        <div data-bind="text: hi.bar"></div>
      </div>
      <!-- /ko -->
    `);
    assert(modified);
    assert(modified.includes(">baz<"));
  });

  test("renders let binding", async () => {
    const { modified } = await render(html`
      <!-- ko with: { } -->
      <!-- ko let: { foo: 'bar' } -->
      <div data-bind="text: foo"></div>
      <!-- /ko -->
      <!-- /ko -->
    `);
    assert(modified);
    assert(modified.includes(">bar<"));
  });

  test("renders value binding", async () => {
    const { modified } = await render(html`
      <!-- ko with: { value: 'foo' } -->
      <input data-bind="value: value" />
      <!-- /ko -->
    `);
    assert(modified);
    assert(/value=["']foo/.test(modified));
  });

  test("renders checked binding", async () => {
    const { modified } = await render(html`
      <!-- ko with: { value: true } -->
      <input data-bind="checked: value" />
      <!-- /ko -->
    `);
    assert(modified);
    assert(modified.includes('checked=""'));
  });

  test("renders disabled binding", async () => {
    const { modified } = await render(html`
      <!-- ko with: { value: true } -->
      <input data-bind="disabled: value" />
      <!-- /ko -->
    `);
    assert(modified);
    assert(modified.includes('disabled=""'));
  });
});
