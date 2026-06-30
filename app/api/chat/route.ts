import { streamText, stepCountIs, convertToModelMessages } from 'ai';
import { NextRequest } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { buildSystemPrompt } from '@/lib/prompt';
import { checkRateLimit } from '@/lib/rate-limit';
import { cheekiTools } from '@/lib/tools';
import { createAdminClient } from '@/lib/supabase/admin';
import { routeModel } from '@/lib/router';
import type { ModelId } from '@/lib/models';
import { headers } from 'next/headers';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Guest rate limit: 10 messages per hour per IP
const guestRateCache = new Map<string, { count: number; resetAt: number }>();
const GUEST_LIMIT = 10;
const GUEST_WINDOW_MS = 60 * 60 * 1000;

function checkGuestRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = guestRateCache.get(ip);
  if (!entry || now > entry.resetAt) {
    guestRateCache.set(ip, { count: 1, resetAt: now + GUEST_WINDOW_MS });
    return true;
  }
  if (entry.count >= GUEST_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Rate limiting — authenticated users get 20/hr, guests get 10/hr
  if (user) {
    const { allowed } = await checkRateLimit(user.id);
    if (!allowed) {
      return new Response('Rate limit exceeded', { status: 429 });
    }
  } else {
    // Guest mode
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    if (!checkGuestRateLimit(ip)) {
      return new Response('Guest rate limit exceeded. Sign in for more messages.', { status: 429 });
    }
  }

  const { messages: uiMessages, chatId, lang = 'en', model: forcedModel = null } = await req.json();

  const admin = createAdminClient();

  // Convert UIMessages to model messages for ai v6
  const messages = await convertToModelMessages(uiMessages);

  // Save user message (only for authenticated users with a chatId)
  if (user && chatId) {
    const lastUiMsg = uiMessages[uiMessages.length - 1];
    if (lastUiMsg?.role === 'user') {
      const textPart = (lastUiMsg.parts ?? []).find((p: { type: string }) => p.type === 'text');
      const textContent = (textPart as { text?: string })?.text ?? '';
      if (textContent) {
        await admin.from('messages').insert({
          chat_id: chatId,
          role: 'user',
          content: textContent,
        });
      }
    }
  }

  const systemPrompt = buildSystemPrompt(lang as 'en' | 'ru');

  // --- Выбор модели: ручной (forcedModel) или автоматический по тексту вопроса ---
  const lastUserUiMsg = [...uiMessages].reverse().find((m: { role: string }) => m.role === 'user');
  const lastUserText =
    ((lastUserUiMsg?.parts ?? []).find((p: { type: string }) => p.type === 'text') as { text?: string })?.text ?? '';

  let model;
  try {
    const routed = routeModel(lastUserText, forcedModel as ModelId | null);
    model = routed.model;
    // Лог для отладки роутинга (виден в логах Vercel)
    console.log(`[router] -> ${routed.decision.id} (${routed.decision.reason})${routed.decision.fellBack ? ' [fallback]' : ''}`);
  } catch (err) {
    return new Response(
      (err as Error).message ?? 'No AI provider configured.',
      { status: 503 },
    );
  }

  const result = streamText({
    model,
    system: systemPrompt,
    messages,
    tools: cheekiTools,
    stopWhen: stepCountIs(5),
    onFinish: async ({ text }) => {
      if (user && chatId && text) {
        await admin.from('messages').insert({
          chat_id: chatId,
          role: 'assistant',
          content: text,
        });
      }
    },
  });

  return result.toTextStreamResponse();
}
