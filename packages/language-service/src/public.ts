import type { CodeActions, CodeActionParams } from "./features/code-actions.js";
import type { Completion, CompletionParams } from "./features/completion.js";
import type { Definition, DefinitionParams } from "./features/definition.js";
import type { Diagnostics, DiagnosticsParams } from "./features/diagnostics.js";
import type { Hover, HoverParams } from "./features/hover.js";
import { LanguageServiceWorker } from "./private.js";
import {
  createProtocol,
  isRequest,
  type Message,
  type Protocol,
  type ProtocolClient,
} from "./protocol.js";
import { Logger, type Log } from "@eliassko/logger";
import { join } from "node:path";
import { Worker } from "node:worker_threads";

export interface LanguageServiceOptions {
  worker?: boolean;
  workerURL?: string | URL | undefined;
  logger?: Logger;
}

export class LanguageService {
  private api = {
    log: (params: Log[]) => {
      for (const log of params) {
        this.logger.log(log);
      }
    },
  };

  #worker: Worker | undefined;
  #client: ProtocolClient<LanguageServiceWorker["api"]>;

  readonly logger: Logger;

  constructor(options?: LanguageServiceOptions) {
    this.logger = options?.logger ?? new Logger();

    let protocol: Protocol;

    if (options?.worker !== false) {
      this.#worker = new Worker(
        options?.workerURL ?? join(__dirname, "worker.js"),
      );

      this.#worker.on("exit", (code) => {
        throw new Error(`Language service exited with code ${code}.`);
      });

      this.#worker.on("messageerror", (error) => {
        throw new Error("Language service crashed.", {
          cause: error,
        });
      });

      protocol = createProtocol((message) => {
        if (isRequest(message)) {
          this.logger.debug(`Sending request "${message.method}".`);
        }
        this.#worker!.postMessage(message);
      });
      protocol.methods = this.api;
      this.#worker.on("message", (message: Message) =>
        protocol.onMessage(message),
      );
    } else {
      protocol = createProtocol((message) => {
        if (isRequest(message)) {
          this.logger.debug(`Sending request "${message.method}".`);
        }
        worker.onMessage(message);
      });
      protocol.methods = this.api;
      const worker = createProtocol((message) => protocol.onMessage(message));
      new LanguageServiceWorker(worker);
    }

    this.#client = protocol.createClient();
  }

  async stop() {
    await this.#worker?.terminate();
  }

  /*
    Implement public methods using the private api here!
    See the private api at ./private.ts.
  */

  #onDiagnostics = new Set<(diagnostics: Diagnostics) => void>();
  onDiagnostics(listener: (diagnostics: Diagnostics) => void) {
    this.#onDiagnostics.add(listener);
    return () => {
      this.#onDiagnostics.delete(listener);
    };
  }

  //#region document
  openDocument(fileName: string, text: string) {
    const params = { fileName, text };
    return this.#client.request("document/open", params);
  }

  editDocument(fileName: string, text: string) {
    const params = { fileName, text };
    return this.#client.request("document/edit", params);
  }

  closeDocument(fileName: string) {
    const params = { fileName };
    return this.#client.request("document/close", params);
  }
  //#endregion

  //#region language features
  getCompletion(params: CompletionParams): Promise<Completion> {
    return this.#client.request("document/completion", params);
  }

  getDefinition(params: DefinitionParams): Promise<Definition> {
    return this.#client.request("document/definition", params);
  }

  getDiagnostics(params: DiagnosticsParams): Promise<Diagnostics> {
    return this.#client.request("document/diagnostics", params);
  }

  getHover(params: HoverParams): Promise<Hover | null> {
    return this.#client.request("document/hover", params);
  }

  getCodeActions(params: CodeActionParams): Promise<CodeActions> {
    return this.#client.request("document/quick-fixes", params);
  }
  //#endregion
}
