import type { LanguageModel } from 'ai';
import {
  type ModelId,
  MODELS,
  getModel,
  isModelAvailable,
  availableModels,
} from './models';

/**
 * Роутер моделей CHEEKI AI.
 *
 * Задача: по тексту вопроса пользователя выбрать наиболее подходящий движок,
 * и при этом всегда иметь рабочий fallback, если у выбранной модели нет ключа.
 *
 * Логика автоматического выбора (приоритет — сверху вниз):
 *   1. Сложные/технические вопросы (безопасность контракта, аудит, код, токеномика)
 *      -> Claude (хорош в рассуждениях и аккуратных технических ответах)
 *   2. Очень длинный контекст / "объясни подробно" / большой текст
 *      -> Gemini (большое контекстное окно)
 *   3. Быстрые фактические вопросы (цена, как купить, ссылки)
 *      -> gpt-4o-mini (быстро и дёшево)
 *   4. Всё остальное -> дефолтная модель
 *
 * Порядок fallback можно переопределить через env ROUTER_FALLBACK_ORDER
 * (список id через запятую).
 */

// Дефолтная модель, если ничего конкретного не подошло
const DEFAULT_MODEL: ModelId =
  (process.env.ROUTER_DEFAULT_MODEL as ModelId) || 'gpt-4o-mini';

// Порядок запасных вариантов, если у выбранной модели нет ключа
function fallbackOrder(): ModelId[] {
  const fromEnv = process.env.ROUTER_FALLBACK_ORDER;
  if (fromEnv) {
    return fromEnv
      .split(',')
      .map((s) => s.trim())
      .filter((s): s is ModelId => s in MODELS);
  }
  return ['gpt-4o-mini', 'claude', 'gemini', 'kimi', 'deepseek', 'gpt-4o'];
}

// --- Ключевые слова для авто-роутинга ---

const TECHNICAL_PATTERNS =
  /(security|audit|contract|solidity|renounc|honeypot|rug|tokenomics|liquidity lock|smart contract|безопасн|аудит|контракт|солидит|ренонс|ханипот|рагпулл|токеномик|ликвидност|смарт-контракт|как устроен|how does .* work)/i;

const LONG_CONTEXT_PATTERNS =
  /(explain in detail|step by step|full breakdown|whitepaper|подробно объясни|пошагово|разбери полностью|whitepaper|вайтпейпер|полный разбор)/i;

const QUICK_FACT_PATTERNS =
  /(price|how to buy|where to buy|chart|link|telegram|цена|как купить|где купить|график|ссылк|телеграм)/i;

// Запросы на генерацию изображений — нужна модель с вызовом инструментов (generate_image работает через OpenAI)
const IMAGE_PATTERNS =
  /(draw|generate (an? )?image|create (an? )?image|make (a )?(meme|picture|logo|image)|picture of|нарисуй|сгенерируй|сгенери|сделай (мем|картинк|логотип|изображен)|картинку|изображение с)/i;

export interface RouteDecision {
  id: ModelId;
  label: string;
  reason: string;
  /** Был ли использован fallback вместо предпочтительной модели */
  fellBack: boolean;
}

/** Выбирает предпочтительный движок по тексту (без учёта наличия ключей) */
function preferredModel(text: string): { id: ModelId; reason: string } {
  // Генерация изображений идёт через OpenAI-инструмент — направляем на модель с надёжным tool-calling.
  if (IMAGE_PATTERNS.test(text)) {
    return { id: 'gpt-4o-mini', reason: 'image generation request' };
  }
  if (TECHNICAL_PATTERNS.test(text)) {
    return { id: 'claude', reason: 'technical/security question' };
  }
  if (LONG_CONTEXT_PATTERNS.test(text)) {
    return { id: 'gemini', reason: 'long-context / detailed explanation' };
  }
  if (QUICK_FACT_PATTERNS.test(text)) {
    return { id: 'gpt-4o-mini', reason: 'quick factual question' };
  }
  return { id: DEFAULT_MODEL, reason: 'default' };
}

/**
 * Главная функция: принимает текст последнего сообщения пользователя
 * и (опционально) явно выбранную пользователем модель.
 * Возвращает решение и готовый объект модели для streamText.
 */
export function routeModel(
  userText: string,
  forced?: ModelId | null,
): { model: LanguageModel; decision: RouteDecision } {
  // 1. Если пользователь выбрал модель вручную и ключ есть — уважаем выбор
  if (forced && isModelAvailable(forced)) {
    return {
      model: getModel(forced)!,
      decision: {
        id: forced,
        label: MODELS[forced].label,
        reason: 'user-selected',
        fellBack: false,
      },
    };
  }

  // 2. Авто-выбор по содержанию вопроса
  const pref = preferredModel(userText || '');

  if (isModelAvailable(pref.id)) {
    return {
      model: getModel(pref.id)!,
      decision: {
        id: pref.id,
        label: MODELS[pref.id].label,
        reason: pref.reason,
        fellBack: false,
      },
    };
  }

  // 3. Fallback — берём первый доступный движок по приоритету
  for (const id of fallbackOrder()) {
    if (isModelAvailable(id)) {
      return {
        model: getModel(id)!,
        decision: {
          id,
          label: MODELS[id].label,
          reason: `fallback (preferred "${pref.id}" has no key)`,
          fellBack: true,
        },
      };
    }
  }

  // 4. Совсем ничего не настроено — последний шанс: дефолтная модель как есть.
  // OpenAI SDK всё равно требует ключ, но это даст понятную ошибку выше по стеку.
  const avail = availableModels();
  throw new Error(
    `No AI provider configured. Set at least one API key. Available: ${
      avail.length ? avail.join(', ') : 'none'
    }`,
  );
}
