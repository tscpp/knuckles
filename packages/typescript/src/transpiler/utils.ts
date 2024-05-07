export const quote = (string: string) => JSON.stringify(string);
export const ns = "κο";
export const TYPES_MODULE = "@knuckles/typescript/types";

/** Removes all newlines from string. */
export const rmnl = (string: string) => string.replace(/[\r\n]/g, "");
