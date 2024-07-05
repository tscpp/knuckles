import { type Diagnostics, LanguageService } from "../index.js";
import { describe, beforeAll, it, expect } from "@jest/globals";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

describe("diagnostics", () => {
  let diagnostics!: Diagnostics;

  beforeAll(async () => {
    const service = new LanguageService({
      worker: false,
    });
    const fileName = fileURLToPath(
      new URL("__fixtures__/diagnostics.html", import.meta.url),
    );
    const text = await readFile(fileName, "utf8");
    await service.openDocument(fileName, text);
    diagnostics = await service.getDiagnostics({
      fileName: fileName,
    });
  });

  it("provides standard diagnostics", async () => {
    console.dir(diagnostics, { depth: null });
    const diagnostic = diagnostics.find(
      (diagnostic) => diagnostic.code === "virtual-element-end-notation",
    );
    expect(diagnostic).not.toBe(undefined);
    expect(diagnostic!.range.start.line).toBe(4);
  });

  it("provides typescript diagnostics", async () => {
    const diagnostic = diagnostics.find(
      (diagnostic) => diagnostic.code === "ts/2552",
    );
    expect(diagnostic).not.toBe(undefined);
    expect(diagnostic!.range.start.line).toBe(1);
  });
});
