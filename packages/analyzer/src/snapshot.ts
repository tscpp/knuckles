import { Position } from "@knuckles/location";
import { SourceMapConsumer, type RawSourceMap } from "source-map";

export interface SnapshotInit {
  readonly fileName: string;
  readonly original: string;
  readonly generated: string;
  readonly sourceMap: RawSourceMap;
}

export interface Snapshot {
  readonly fileName: string;
  readonly original: string;
  readonly generated: string;
  readonly sourceMap: RawSourceMap;

  getOriginalPosition(position: Position): Position | null;
  getGeneratedPosition(position: Position): Position | null;
}

export interface SnapshotConstructor {
  new (init: SnapshotInit): Promise<Snapshot>;
}

export const Snapshot: SnapshotConstructor = class Snapshot {
  fileName: string;
  original: string;
  generated: string;
  sourceMap: RawSourceMap;
  _sourceMapConsumer!: SourceMapConsumer;

  constructor(init: SnapshotInit) {
    this.fileName = init.fileName;
    this.original = init.original;
    this.generated = init.generated;
    this.sourceMap = init.sourceMap;

    return Promise.resolve(this).then(async (self) => {
      self._sourceMapConsumer = await new SourceMapConsumer(self.sourceMap);
      return self;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;
  }

  getOriginalPosition(position: Position): Position | null {
    const sourceMapPosition = this._sourceMapConsumer.originalPositionFor({
      line: position.line + 1,
      column: position.column,
    });
    if (sourceMapPosition.line === null || sourceMapPosition.column === null) {
      return null;
    }
    return Position.fromLineAndColumn(
      sourceMapPosition.line - 1,
      sourceMapPosition.column,
      this.original,
    );
  }

  getGeneratedPosition(position: Position): Position | null {
    const sourceMapPosition = this._sourceMapConsumer.generatedPositionFor({
      line: position.line + 1,
      column: position.column,
      source: this.fileName,
    });
    if (sourceMapPosition.line === null || sourceMapPosition.column === null) {
      return null;
    }
    return Position.fromLineAndColumn(
      sourceMapPosition.line - 1,
      sourceMapPosition.column,
      this.generated,
    );
  }
} as unknown as SnapshotConstructor;
