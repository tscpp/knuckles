import { Position, Range } from "@knuckles/location";

export interface Mapping {
  original: Range;
  generated: Range;
  uniform?: boolean;
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

  getRealRangeInGenerated(range: Range): Range | null {
    const filtered = this.mappings.filter(
      (mapping) => mapping.uniform && mapping.original.contains(range.start),
    );

    if (filtered.length === 0) {
      return null;
    }

    const mapping = filtered.reduce((a, b) =>
      a.original.size < b.original.size ? a : b,
    );

    const localOffset = range.start.offset - mapping.original.start.offset;
    const start = mapping.generated.start.offset + localOffset;
    const end = start + range.size;

    return Range.fromOffset(start, end, this.generated);
  }

  getRealRangeInOriginal(range: Range): Range | null {
    const filtered = this.mappings.filter(
      (mapping) => mapping.uniform && mapping.generated.contains(range.start),
    );

    if (filtered.length === 0) {
      return null;
    }

    const mapping = filtered.reduce((a, b) =>
      a.generated.size < b.generated.size ? a : b,
    );

    const localOffset = range.start.offset - mapping.generated.start.offset;
    const start = mapping.original.start.offset + localOffset;
    const end = start + range.size;

    return Range.fromOffset(start, end, this.original);
  }

  getRealPositionInGenerated(position: Position): Position | null {
    const filtered = this.mappings.filter(
      (mapping) => mapping.uniform && mapping.original.contains(position),
    );

    if (filtered.length === 0) {
      return null;
    }

    // Pick the shortest original range.
    const mapping = filtered.reduce((a, b) =>
      a.original.size < b.original.size ? a : b,
    );

    // Get the local offset within the range.
    const localOffset = position.offset - mapping.original.start.offset;

    return Position.fromOffset(
      mapping.generated.start.offset + localOffset,
      this.generated,
    );
  }

  getRealPositionInOriginal(position: Position): Position | null {
    const filtered = this.mappings.filter(
      (mapping) => mapping.uniform && mapping.generated.contains(position),
    );

    if (filtered.length === 0) {
      return null;
    }

    // Pick the shortest generated range.
    const mapping = filtered.reduce((a, b) =>
      a.generated.size < b.generated.size ? a : b,
    );

    // Get the local offset within the range.
    const localOffset = position.offset - mapping.generated.start.offset;

    return Position.fromOffset(
      mapping.original.start.offset + localOffset,
      this.original,
    );
  }

  blameOriginal(position: Position): Range | null {
    const filtered = this.mappings.filter((mapping) =>
      mapping.generated.contains(position),
    );

    if (filtered.length === 0) {
      return null;
    }

    // Pick the shortest original range.
    return filtered.reduce((a, b) =>
      a.original.size < b.original.size ? a : b,
    ).original;
  }
}
