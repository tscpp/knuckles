import type { DynamicRange } from "./location.js";
import type { Range } from "@knuckles/location";

export interface Marker {
  id: string;
  range: Range;
}

export class DynamicMarker {
  constructor(
    readonly id: string,
    readonly range: DynamicRange,
  ) {}

  capture(): Marker {
    return {
      id: this.id,
      range: this.range.capture(),
    };
  }
}
