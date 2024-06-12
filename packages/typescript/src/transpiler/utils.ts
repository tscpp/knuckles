export const quote = (string: string) => JSON.stringify(string);
export const ns = "κο";

/** Removes all newlines from string. */
export const rmnl = (string: string) => string.replace(/[\r\n]/g, "");

export function groupBy<T, K extends string>(
  array: T[],
  predicate: (value: T, index: number, array: T[]) => K,
) {
  return array.reduce(
    (acc, value, index, array) => {
      (acc[predicate(value, index, array)] ||= []).push(value);
      return acc;
    },
    {} as { [_ in K]?: T[] },
  );
}
