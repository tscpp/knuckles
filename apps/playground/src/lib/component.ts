import type { HTML } from "./html";

export abstract class Component<Props> {
  abstract readonly template: HTML;
  components?: Readonly<Record<string, ComponentConstructor>>;
  initialize?(): void;
  dispose?(): void;

  constructor(readonly props: ko.PureComputed<Props>) {}
}

export interface ComponentConstructor {
  new (props: ko.PureComputed<any>): Component<any>;
}
