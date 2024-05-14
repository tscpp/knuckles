import { configureEnvironment, type EnvironmentOptions } from "./environment";
import * as ko from "knockout";
import "~/bindings/instantiate";
import Playground from "~/components/playground";

export interface PlaygroundOptions extends EnvironmentOptions {}

export async function createPlayground(
  container: HTMLElement,
  options?: PlaygroundOptions,
) {
  configureEnvironment(options);
  container.innerHTML = "<!-- ko instantiate: Playground --><!-- /ko -->";
  ko.applyBindings({ Playground }, container);
}
