import ky, { type AfterResponseHook } from 'ky';
import { createParser } from 'eventsource-parser';

export interface SSEOptions {
  onData: (data: string) => void;
  onCompleted?: (error?: Error) => void;
  onAborted?: () => void;
}

function createSSEHook(options: SSEOptions): AfterResponseHook {
  return async (_request, _opts, response) => {
    if (!response.ok || !response.body) return;

    let done = false;
    const finish = (err?: Error) => {
      if (!done) {
        done = true;
        options.onCompleted?.(err);
      }
    };

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    const parser = createParser({
      onEvent: (event) => {
        if (!event.data) return;
        options.onData(event.data);
      },
    });

    const read = (): void => {
      reader
        .read()
        .then(({ done: streamDone, value }) => {
          if (streamDone) {
            finish();
            return;
          }
          parser.feed(decoder.decode(value, { stream: true }));
          read();
        })
        .catch((err: Error) => {
          finish(err);
        });
    };
    read();
    return response;
  };
}

export interface StreamRequestOptions {
  supabaseUrl: string;
  supabaseAnonKey: string;
  requestBody: unknown;
  onData: (data: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
  signal?: AbortSignal;
}

export async function streamLLM(options: StreamRequestOptions): Promise<void> {
  const { supabaseUrl, supabaseAnonKey, requestBody, onData, onComplete, onError, signal } =
    options;

  const functionUrl = `${supabaseUrl}/functions/v1/large-language-model`;

  const sseHook = createSSEHook({
    onData,
    onCompleted: (err) => (err ? onError(err) : onComplete()),
    onAborted: () => console.log('[SSE] Stream aborted'),
  });

  try {
    await ky.post(functionUrl, {
      json: requestBody,
      headers: {
        Authorization: `Bearer ${supabaseAnonKey}`,
        apikey: supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      signal,
      timeout: 120_000,
      hooks: { afterResponse: [sseHook] },
    });
  } catch (err) {
    if (!signal?.aborted) {
      onError(err as Error);
    }
  }
}
