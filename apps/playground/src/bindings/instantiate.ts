import * as ko from "knockout";
import { type ComponentConstructor } from "~/lib/component";

type InstantiateParam =
  | ComponentConstructor
  | [component: ComponentConstructor, params?: unknown];

ko.bindingHandlers["instantiate"] = {
  init(
    element,
    valueAccessor: () => InstantiateParam,
    _allBindings,
    _viewModel: unknown,
    bindingContext: ko.BindingContext<unknown>,
  ) {
    ko.virtualElements.emptyNode(element);

    const param = ko.computed(() => {
      const value = valueAccessor();
      return Array.isArray(value) ? value : [value];
    });

    const constructor = param()[0];
    const component = new constructor(ko.pureComputed(() => param()[1]));

    const asyncContext = ko.bindingEvent.startPossiblyAsyncContentBinding(
      element,
      bindingContext,
    );

    const childBindingContext = asyncContext.createChildContext(component, {
      extend: (self) => {
        self.$component = component;
        Object.assign(self, component.components);
      },
    });

    if (component.initialize) {
      ko.bindingEvent.subscribe(
        element,
        "descendantsComplete",
        component.initialize,
        component,
      );
    }

    if (component.dispose) {
      ko.utils.domNodeDisposal.addDisposeCallback(element, component.dispose);
    }

    const template = document.createElement("template");
    template.innerHTML = component.template;

    ko.virtualElements.setDomNodeChildren(
      element,
      Array.from(template.content.childNodes),
    );

    ko.applyBindingsToDescendants(childBindingContext, element);

    return {
      controlsDescendantBindings: true,
    };
  },
};

ko.virtualElements.allowedBindings["instantiate"] = true;
