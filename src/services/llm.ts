import type { ApiContent } from '@/types/chat';
import type { ModelId, EffortLevel } from '@/types/plans';

export interface StreamMetrics {
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
}

const SYSTEM_INSTRUCTION = {
  parts: [
    {
      text: 'You are Flash AI. Respond immediately, concisely, and directly using clean Markdown.',
    },
  ],
};

let currentKeyIndex = 0;
const keyCooldownUntil = new Map<string, number>();

export function getGeminiKeyPool(): string[] {
  const env = import.meta.env;
  const rawSources = [
    env.VITE_GEMINI_API_KEY,
    env.VITE_GOOGLE_API_KEY,
    env.VITE_GOOGLE_AI_STUDIO_KEY,
    env.VITE_API_KEY,
    env.VITE_API_KEY_POOL,
    localStorage.getItem('flash_api_key_pool'),
    localStorage.getItem('gemini_api_key'),
  ]
    .filter(Boolean)
    .join(',');

  const uniqueKeys = new Set<string>();

  for (const token of rawSources.split(/[\s,;]+/)) {
    let cleaned = token.trim().replace(/^["']|["']$/g, '');
    if (/^(gemini|google|aistudio):/i.test(cleaned)) {
      cleaned = cleaned.replace(/^(gemini|google|aistudio):/i, '').trim();
    }
    if (
      cleaned.length > 12 &&
      !cleaned.toLowerCase().includes('your_') &&
      !cleaned.toLowerCase().includes('your-') &&
      !cleaned.startsWith('http')
    ) {
      uniqueKeys.add(cleaned);
    }
  }

  return Array.from(uniqueKeys);
}

export function getOrderedGeminiKeys(): string[] {
  const pool = getGeminiKeyPool();
  if (pool.length === 0) return [];

  const now = Date.now();
  const activeKeys: string[] = [];
  const coolingKeys: string[] = [];

  for (let i = 0; i < pool.length; i++) {
    const idx = (currentKeyIndex + i) % pool.length;
    const key = pool[idx];
    if (now >= (keyCooldownUntil.get(key) ?? 0)) {
      activeKeys.push(key);
    } else {
      coolingKeys.push(key);
    }
  }

  currentKeyIndex = (currentKeyIndex + 1) % pool.length;
  return [...activeKeys, ...coolingKeys];
}

export function getActiveGeminiApiKey(): string {
  const keys = getOrderedGeminiKeys();
  if (keys.length === 0) {
    throw new Error('No Google AI Studio key found in .env.local');
  }
  return keys[0];
}

// Persistent cache of the exact model that works for your AQ... key so 0ms is wasted on 404s
const FAST_MODEL_CACHE_KEY = 'flash_ai_verified_fast_model';

export async function* streamChat(
  messages: ApiContent[],
  _modelId: ModelId = 'f1',
  effort: EffortLevel = 'low',
  _plan = 'free',
  signal?: AbortSignal,
  onMetrics?: (metrics: StreamMetrics) => void
): AsyncGenerator<string, void, unknown> {
  const startTime = Date.now();
  let outputTokenCount = 0;

  const keys = getOrderedGeminiKeys();
  if (keys.length === 0) {
    throw new Error('Missing VITE_GEMINI_API_KEY in .env.local');
  }

  const cachedFastModel = localStorage.getItem(FAST_MODEL_CACHE_KEY);
  const baseModels = [
    'gemini-flash-lite-latest',
    'gemini-flash-latest',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash',
  ];
  const candidateModels = cachedFastModel
    ? Array.from(new Set([cachedFastModel, ...baseModels]))
    : baseModels;

  // Send only the last 6 messages and strip heavy base64 attachments from old turns
  const recentMessages = messages.slice(-6);

  const requestBody = JSON.stringify({
    systemInstruction: SYSTEM_INSTRUCTION,
    contents: recentMessages,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: effort === 'low' ? 1024 : 2048,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  const fallbackBodyNoThinkingFlag = JSON.stringify({
    systemInstruction: SYSTEM_INSTRUCTION,
    contents: recentMessages,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: effort === 'low' ? 1024 : 2048,
    },
  });

  const errors: string[] = [];

  for (const apiKey of keys) {
    if (signal?.aborted) return;

    for (const modelName of candidateModels) {
      if (signal?.aborted) return;

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;

        let response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: requestBody,
          signal,
        });

        // If the model rejects thinkingConfig (400), immediately retry without thinkingConfig
        if (response.status === 400) {
          response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: fallbackBodyNoThinkingFlag,
            signal,
          });
        }

        if (!response.ok) {
          const errText = await response.text().catch(() => response.statusText);
          errors.push(`${modelName} [${response.status}]: ${errText.slice(0, 100)}`);
          if (cachedFastModel === modelName) {
            localStorage.removeItem(FAST_MODEL_CACHE_KEY);
          }
          if (response.status === 429) {
            keyCooldownUntil.set(apiKey, Date.now() + 30_000);
            break;
          }
          continue;
        }

        // Save working model to localStorage so every future message connects in 1 hop!
        localStorage.setItem(FAST_MODEL_CACHE_KEY, modelName);
        console.log(
          `[Flash AI Speed] First byte connected in ${Date.now() - startTime}ms via ${modelName}`
        );

        const reader = response.body?.getReader();
        if (!reader) throw new Error('Stream reader not supported.');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          if (signal?.aborted) break;
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const dataStr = trimmed.slice(5).trim();
            if (!dataStr || dataStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(dataStr);
              const parts = parsed?.candidates?.[0]?.content?.parts;
              if (Array.isArray(parts)) {
                for (const part of parts) {
                  if (part?.thought === true) continue;
                  if (typeof part?.text === 'string' && part.text.length > 0) {
                    outputTokenCount += Math.ceil(part.text.length / 4);
                    yield part.text;
                    // Yield 0ms to browser UI thread so React paints each chunk live instead of waiting!
                    await new Promise((r) => setTimeout(r, 0));
                  }
                }
              }
            } catch {
              // ignore partial frame
            }
          }
        }

        if (onMetrics) {
          onMetrics({
            inputTokens: 0,
            outputTokens: outputTokenCount,
            durationMs: Date.now() - startTime,
          });
        }
        return;
      } catch (err: unknown) {
        if (signal?.aborted) return;
        errors.push(err instanceof Error ? err.message : String(err));
      }
    }
  }

  throw new Error(`AI error: ${errors[0] || 'Connection failed'}`);
}