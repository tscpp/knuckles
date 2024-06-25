import { LanguageServiceWorker } from "./private.js";
import { createProtocol, type Message } from "./protocol.js";
import { parentPort } from "node:worker_threads";

const protocol = createProtocol((message) => parentPort!.postMessage(message));
parentPort!.on("message", (message: Message) => protocol.onMessage(message));

new LanguageServiceWorker(protocol);
