import { NextResponse } from 'next/server';
import { MODELS, availableModels } from '@/lib/models';

export const runtime = 'nodejs';

/**
 * Возвращает список движков и их доступность (есть ли API-ключ).
 * Используется фронтендом для выпадающего списка ручного выбора модели.
 * Сами ключи НЕ отдаются — только факт их наличия.
 */
export async function GET() {
  const available = new Set(availableModels());
  const models = (Object.keys(MODELS) as (keyof typeof MODELS)[]).map((id) => ({
    id,
    label: MODELS[id].label,
    available: available.has(id),
  }));
  return NextResponse.json({ models });
}
