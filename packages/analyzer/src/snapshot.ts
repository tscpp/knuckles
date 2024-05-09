import { type Range, type Position } from "@knuckles/location";

export interface Mapping {
  original: Range;
  generated: Range;
  bidirectional?: boolean;
  name?: string | undefined;
}

export interface SnapshotInit {
  readonly fileName: string;
  readonly original: string;
  readonly generated: string;
  readonly mappings: readonly Mapping[];
}

export class Snapshot {
  readonly fileName: string;
  readonly original: string;
  readonly generated: string;
  readonly mappings: readonly Mapping[];

  constructor(init: SnapshotInit) {
    this.fileName = init.fileName;
    this.original = init.original;
    this.generated = init.generated;
    this.mappings = init.mappings;
  }

  getOriginalRange(position: Position): Range | null {
    return (
      this.mappings.find((mapping) => mapping.original.contains(position))
        ?.original ?? null
    );
  }

  getOriginalPosition(position: Position): Position | null {
    return this.getOriginalRange(position)?.start ?? null;
  }

  geBidirectionalOriginalRange(position: Position): Range | null {
    return (
      this.mappings.find(
        (mapping) =>
          mapping.original.contains(position) && mapping.bidirectional,
      )?.original ?? null
    );
  }

  geBidirectionalOriginalPosition(position: Position): Position | null {
    return this.geBidirectionalOriginalRange(position)?.start ?? null;
  }

  getGeneratedRange(position: Position): Range | null {
    return (
      this.mappings.find((mapping) => mapping.generated.contains(position))
        ?.generated ?? null
    );
  }

  getGeneratedPosition(position: Position): Position | null {
    return this.getGeneratedRange(position)?.start ?? null;
  }
}
