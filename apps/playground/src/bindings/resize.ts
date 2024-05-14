import * as ko from "knockout";

type ResizeParam =
  | ResizeObserverCallback
  | {
      callback: ResizeObserverCallback;
      options?: ResizeObserverOptions;
    };

ko.bindingHandlers["resize"] = {
  init(element, valueAccessor: () => ResizeParam) {
    const param = valueAccessor();
    const { callback, options = {} } =
      typeof param === "function" ? { callback: param } : param;

    const observer = new ResizeObserver(callback);
    observer.observe(element, options);

    ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
      observer.disconnect();
    });
  },
};
