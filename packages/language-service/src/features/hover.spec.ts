import { LanguageService } from "../index.js";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

describe("hover", () => {
  let service: LanguageService;
  let fileName: string;

  beforeAll(async () => {
    service = new LanguageService({
      worker: false,
    });
    fileName = fileURLToPath(
      new URL("__fixtures__/hover.html", import.meta.url),
    );
    const text = await readFile(fileName, "utf8");
    await service.openDocument(fileName, text);
  });

  it("provides hover details for bindings (name)", async () => {
    const hover = await service.getHover({
      fileName: fileName,
      position: {
        line: 1,
        column: 17,
      },
    });
    expect(hover).not.toBe(null);
  });

  it("provides hover details for viewmodel property", async () => {
    const hover = await service.getHover({
      fileName: fileName,
      position: {
        line: 1,
        column: 23,
      },
    });
    expect(hover).not.toBe(null);
  });
});
