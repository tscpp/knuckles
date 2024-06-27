export interface Request<METHOD extends string = string, PARAMS = unknown> {
  id: number;
  method: METHOD;
  params: PARAMS;
}

export interface Response<RESULT = unknown> {
  id: number;
  result?: RESULT;
  error?: ResponseError;
}

export interface ResponseError {
  message: string;
}

export type Message = Request | Response;

export function isRequest(value: Message): value is Request {
  return Object.hasOwn(value, "method");
}

export function isResponse(value: Message): value is Response {
  return !isRequest(value);
}

export type ProtocolMap = Record<string, (param: any) => any>;

export interface Protocol {
  methods: ProtocolMap;
  onMessage(message: Message): void;
  createClient<T extends ProtocolMap>(): ProtocolClient<T>;
}

export interface ProtocolClient<T extends ProtocolMap> {
  request<K extends Extract<keyof T, string>>(
    method: K,
    params: Parameters<T[K]>[0],
  ): Promise<Awaited<ReturnType<T[K]>>>;
}

export function createProtocol(
  sendMessage: (message: Message) => void,
): Protocol {
  const responseMap = new Map<number, (response: Response) => void>();

  return {
    methods: {},
    async onMessage(message: Message) {
      if (isRequest(message)) {
        if (!Object.hasOwn(this.methods, message.method)) {
          const response: Response = {
            id: message.id,
            error: {
              message: `Method '${message.method}' is not defined.`,
            },
          };
          sendMessage(response);
          return;
        }

        const method = this.methods[message.method]!;

        let result: unknown;
        let error: ResponseError | undefined;
        try {
          result = await method(message.params as any);
        } catch (cause) {
          if (cause instanceof Error) {
            error = { message: cause.message };
          } else {
            error = { message: String(cause) };
          }
        }

        const response: Response = {
          id: message.id,
          result,
          error,
        };
        sendMessage(response);
      } else {
        const callback = responseMap.get(message.id);
        callback?.(message);
      }
    },
    createClient() {
      let nextRequestId = 0;

      return {
        request(method, params) {
          const id = nextRequestId++;

          const promise = new Promise<any>((resolve, reject) => {
            responseMap.set(id, (response) => {
              if (response.error) {
                reject(new Error(response.error.message));
              } else {
                resolve(response.result);
              }
            });
          });

          sendMessage({
            id,
            method,
            params,
          });

          return promise;
        },
      };
    },
  };
}
