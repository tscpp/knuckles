import * as ko from "knockout";

ko.bindingHandlers["ref"] = {
  init(element, valueAccessor) {
    const observable = valueAccessor();

    if (ko.isWritableObservable(observable)) {
      observable(element);
    } else {
      console.error("ref binding must be passed a writable observable.");
    }
  },
};
