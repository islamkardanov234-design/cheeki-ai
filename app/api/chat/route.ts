import { streamText, stepCountIs, convertToModelMessages } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextRequest } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { buildSystemPrompt } from '@/lib/prompt';
import { checkRateLimit } from '@/lib/rate-limit';
import { cheekiTools } from '@/lib/tools';
import { createAdminClient } from '@/lib/supabase/admin';
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

  const { messages: uiMessages, chatId, lang = 'en' } = await req.json();

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

  const result = streamText({
    model: openai('gpt-4o-mini'),
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
