import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { buildSystemPrompt } from '@/lib/prompt';
import { checkRateLimit } from '@/lib/rate-limit';
import { cheekiTools } from '@/lib/tools';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { allowed } = await checkRateLimit(user.id);
  if (!allowed) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  const { messages, chatId, lang = 'en' } = await req.json();

  const admin = createAdminClient();

  // Save user message
  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.role === 'user' && chatId) {
    await admin.from('messages').insert({
      chat_id: chatId,
      role: 'user',
      content: lastMessage.content,
    });
  }

  const systemPrompt = buildSystemPrompt(lang as 'en' | 'ru');

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: systemPrompt,
    messages,
    tools: cheekiTools,
    maxSteps: 5,
    onFinish: async ({ text }) => {
      if (chatId && text) {
        await admin.from('messages').insert({
          chat_id: chatId,
          role: 'assistant',
          content: text,
        });
      }
    },
  });

  return result.toDataStreamResponse();
}
