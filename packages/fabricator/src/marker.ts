import { DynamicPosition } from "./location.js";
import { Position } from "@knuckles/location";

export class Marker extends Position {
  constructor(
    readonly id: string,
    position: Position,
  ) {
    super(position);
  }
}

export class DynamicMarker extends DynamicPosition {
  constructor(
    readonly id: string,
    offset: number,
  ) {
    super(offset);
  }

  override capture(text: string): Marker {
    return new Marker(this.id, super.capture(text));
  }

  override clone(): DynamicMarker {
    return new DynamicMarker(this.id, this.captureOffset());
  }

  override copy() {
    return this.clone();
  }
}
