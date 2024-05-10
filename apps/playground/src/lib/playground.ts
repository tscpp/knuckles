import "~/bindings/instantiate";
import * as ko from "knockout";
import Playground from "~/components/playground";

export function createPlayground(container: HTMLElement) {
  container.innerHTML = "<!-- ko instantiate: Playground --><!-- /ko -->";
  ko.applyBindings({ Playground }, container);
}
