import type { Mapping } from "./mapping.js";
import type { Marker } from "./marker.js";
import { Position, Range } from "@knuckles/location";

export interface SnapshotInit {
  original: string;
  generated: string;
  mappings?: Iterable<Mapping> | undefined;
  markers?: Iterable<Marker> | undefined;
}

export class Snapshot {
  original: string;
  generated: string;
  mappings: Mapping[];
  markers: Marker[];

  constructor(init: SnapshotInit) {
    this.original = init.original;
    this.generated = init.generated;
    this.mappings = Array.from(init.mappings ?? []);
    this.markers = Array.from(init.markers ?? []);
  }

  blame(
    options: { original: Position } | { generated: Position },
  ): Range | null {
    const source = Object.hasOwn(options, "original")
      ? "original"
      : "generated";
    const target = source === "original" ? "generated" : "original";
    const position = (options as { original?: Position; generated?: Position })[
      source
    ]!;

    const mappings = this.mappings.filter((mapping) =>
      mapping[target].contains(position),
    );

    if (mappings.length === 0) {
      return null;
    }

    const mapping = mappings.reduce((a, b) =>
      a[target].size < b[target].size ? a : b,
    );

    return mapping[target];
  }

  mirror(options: { original: Range } | { generated: Range }): Range | null;
  mirror(
    options: { original: Position } | { generated: Position },
  ): Position | null;
  mirror(
    options: { original: Range | Position } | { generated: Range | Position },
  ): Range | Position | null {
    const source = Object.hasOwn(options, "original")
      ? "original"
      : "generated";
    const target = source === "original" ? "generated" : "original";
    const locator = (
      options as { original?: Range | Position; generated?: Range | Position }
    )[source]!;

    const mappings = this.mappings.filter(
      (mapping) => mapping.mirror && mapping[target].contains(locator),
    );

    if (mappings.length === 0) {
      return null;
    }

    const mapping = mappings.reduce((a, b) =>
      a[target].size < b[target].size ? a : b,
    );

    if (locator instanceof Range) {
      const translate = locator.start.offset - mapping[source].start.offset;

      return Range.fromOffsets(
        mapping[target].start.offset + translate,
        Math.min(
          mapping[target].start.offset + translate + locator.size,
          mapping[target].end.offset,
        ),
        this[target],
      );
    } else {
      const translate = locator.offset - mapping[source].start.offset;

      return Position.fromOffset(
        mapping[target].start.offset + translate,
        this[target],
      );
    }
  }
}
