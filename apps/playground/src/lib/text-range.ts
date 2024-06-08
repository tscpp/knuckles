import type { Snapshot } from "@knuckles/fabricator";
import type { OffsetArray } from "./location";

export type TextRange = {
  range: OffsetArray;
  to: OffsetArray[];
  text: string;
};

export function computeRanges(
  snapshot: Snapshot | undefined,
  from: "original" | "generated",
  to: "original" | "generated",
): TextRange[] {
  if (!snapshot) return [];

  const text = snapshot[from];

  const markers = snapshot.mappings
    .flatMap(
      (mapping): OffsetArray => [
        mapping[from].start.offset,
        mapping[from].end.offset,
      ],
    )
    .sort((a, b) => a - b);

  const ranges = markers
    .map((offset, i): OffsetArray => [markers[i - 1] ?? 0, offset])
    .concat([[markers.at(-1) ?? 0, text.length]]);

  const textRanges = ranges
    .map((range): TextRange => {
      const affected = snapshot.mappings.filter(
        (mapping) =>
          mapping[from].start.offset <= range[0] &&
          mapping[from].end.offset >= range[1],
      );

      return {
        range,
        text: text.slice(range[0], range[1]),
        to: affected.map(
          (mapping): OffsetArray => [
            mapping[to].start.offset,
            mapping[to].end.offset,
          ],
        ),
      };
    })
    .filter((textRange) => !!textRange.text);

  return textRanges;
}
