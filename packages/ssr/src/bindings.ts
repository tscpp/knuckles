import attr from "./bindings/attr.js";
import checked from "./bindings/checked.js";
import class_ from "./bindings/class.js";
import component from "./bindings/component.js";
import css from "./bindings/css.js";
import { disabled, enabled } from "./bindings/disabled.js";
import html from "./bindings/html.js";
import { if_, ifnot } from "./bindings/if.js";
import let_ from "./bindings/let.js";
import noSsr from "./bindings/no-ssr.js";
import style from "./bindings/style.js";
import textInput from "./bindings/text-input.js";
import text from "./bindings/text.js";
import using from "./bindings/using.js";
import value from "./bindings/value.js";
import { visible, hidden } from "./bindings/visible.js";
import with_ from "./bindings/with.js";
import { type Plugin } from "./plugin.js";

const bindings: Plugin[] = [
  attr,
  checked,
  class_,
  component,
  css,
  enabled,
  disabled,
  html,
  if_,
  ifnot,
  let_,
  noSsr,
  style,
  textInput,
  text,
  using,
  value,
  visible,
  hidden,
  with_,
];

export default bindings;
