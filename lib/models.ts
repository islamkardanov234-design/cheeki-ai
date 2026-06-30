import { createOpenAI, openai } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { LanguageModel } from 'ai';

/**
 * Реестр AI-моделей для CHEEKI AI.
 *
 * Здесь описаны все доступные движки. Чтобы подключить нового провайдера,
 * достаточно добавить запись в объект `MODELS` и (если нужно) ключ в .env.
 *
 * Kimi (Moonshot) и DeepSeek используют OpenAI-совместимый API,
 * поэтому подключаются через `createOpenAI` с другим baseURL — без отдельного пакета.
 */

// --- Провайдеры (создаются лениво, ключи читаются из окружения) ---

// Kimi / Moonshot — OpenAI-совместимый эндпоинт
const moonshot = createOpenAI({
  apiKey: process.env.MOONSHOT_API_KEY ?? '',
  baseURL: process.env.MOONSHOT_BASE_URL ?? 'https://api.moonshot.ai/v1',
});

// DeepSeek — OpenAI-совместимый эндпоинт
const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY ?? '',
  baseURL: process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com/v1',
});

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? '',
});

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? '',
});

// --- Идентификаторы движков ---
export type ModelId =
  | 'gpt-4o-mini'
  | 'gpt-4o'
  | 'claude'
  | 'gemini'
  | 'kimi'
  | 'deepseek';

export interface ModelEntry {
  /** Человекочитаемое имя для UI / логов */
  label: string;
  /** Какой env-ключ нужен этому провайдеру */
  envKey: string;
  /** Фабрика, возвращающая модель для AI SDK */
  build: () => LanguageModel;
}

/**
 * Карта всех движков. label/envKey используются роутером и фронтендом.
 */
export const MODELS: Record<ModelId, ModelEntry> = {
  'gpt-4o-mini': {
    label: 'GPT-4o mini (OpenAI)',
    envKey: 'OPENAI_API_KEY',
    build: () => openai(process.env.OPENAI_MODEL ?? 'gpt-4o-mini'),
  },
  'gpt-4o': {
    label: 'GPT-4o (OpenAI)',
    envKey: 'OPENAI_API_KEY',
    build: () => openai('gpt-4o'),
  },
  claude: {
    label: 'Claude (Anthropic)',
    envKey: 'ANTHROPIC_API_KEY',
    build: () => anthropic(process.env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-latest'),
  },
  gemini: {
    label: 'Gemini (Google)',
    envKey: 'GOOGLE_GENERATIVE_AI_API_KEY',
    build: () => google(process.env.GOOGLE_MODEL ?? 'gemini-2.0-flash'),
  },
  kimi: {
    label: 'Kimi (Moonshot)',
    envKey: 'MOONSHOT_API_KEY',
    build: () => moonshot(process.env.MOONSHOT_MODEL ?? 'moonshot-v1-8k'),
  },
  deepseek: {
    label: 'DeepSeek',
    envKey: 'DEEPSEEK_API_KEY',
    build: () => deepseek(process.env.DEEPSEEK_MODEL ?? 'deepseek-chat'),
  },
};

/** Проверка, что для движка задан API-ключ */
export function isModelAvailable(id: ModelId): boolean {
  const entry = MODELS[id];
  if (!entry) return false;
  return Boolean(process.env[entry.envKey]);
}

/** Список движков, у которых есть рабочий ключ */
export function availableModels(): ModelId[] {
  return (Object.keys(MODELS) as ModelId[]).filter(isModelAvailable);
}

/** Безопасно получить модель по id (с проверкой ключа) */
export function getModel(id: ModelId): LanguageModel | null {
  if (!isModelAvailable(id)) return null;
  return MODELS[id].build();
}
