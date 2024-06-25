import getCompletion from "./features/completion.js";
import getDefinition from "./features/definition.js";
import getDiagnostics from "./features/diagnostics.js";
import getHover from "./features/hover.js";
import { type Protocol, type ProtocolClient } from "./protocol.js";
import type { LanguageService } from "./public.js";
import { Document } from "./utils/document.js";
import { DocumentStateProvider, ProgramProvider } from "./utils/program.js";
import { Logger } from "@eliassko/logger";
import assert from "node:assert/strict";

export class LanguageServiceWorker {
  /*
    Implement private methods invoked from the public api here!
    See the public api at ./public.ts.
  */
  readonly api = {
    "document/open": async (params: { fileName: string; text: string }) => {
      await this.createOrUpdateDocument(params.fileName, params.text);
    },

    "document/edit": async (params: { fileName: string; text: string }) => {
      await this.createOrUpdateDocument(params.fileName, params.text);
    },

    "document/close": (params: { fileName: string }) => {
      this.removeDocument(params.fileName);
    },

    "document/completion": getCompletion.bind(this),
    "document/definition": getDefinition.bind(this),
    "document/diagnostics": getDiagnostics.bind(this),
    "document/hover": getHover.bind(this),
  };

  #programProvider = new ProgramProvider();
  #documents = new Map<string, Document>();
  #providers = new Map<Document, DocumentStateProvider>();
  #client: ProtocolClient<LanguageService["api"]>;

  readonly logger = new Logger();

  constructor(protected protocol: Protocol) {
    protocol.methods = this.api;
    this.#client = protocol.createClient();

    this.logger.onLog((log) => {
      this.#client.request("log", [log]);
    });
    this.logger.debug("Hello from language service!");
  }

  async createOrUpdateDocument(fileName: string, text: string) {
    let document = this.#documents.get(fileName);
    if (document) {
      const provider = this.#providers.get(document)!;

      document.text = text;
      await provider.touch();
    } else {
      document = new Document(fileName, text);
      this.#documents.set(fileName, document);

      const provider = new DocumentStateProvider(
        this,
        document,
        this.#programProvider,
      );
      this.#providers.set(document, provider);
      await provider.touch();
    }
    return document;
  }

  removeDocument(fileName: string) {
    this.#documents.delete(fileName);
  }

  async getDocumentState(fileName: string) {
    const document = this.#documents.get(fileName);
    assert(document);
    const provider = this.#providers.get(document);
    assert(provider);
    const state = await provider.get();
    return state;
  }
}
