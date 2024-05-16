import type { DynamicRange } from "./location.js";
import type { Range } from "@knuckles/location";

/**
 * Mapping between the original and generated text.
 */
export interface Mapping {
  original: Range;
  generated: Range;
  mirror: boolean;
}

export class DynamicMapping {
  constructor(
    readonly original: Range,
    readonly generated: DynamicRange,
    readonly mirror = false,
  ) {}

  capture(): Mapping {
    return {
      original: this.original,
      generated: this.generated.capture(),
      mirror: this.mirror,
    };
  }
}
