import { createServerClient } from '@/lib/supabase/server';
import { ChatApp } from '@/components/chat-app';

export default async function HomePage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Guest mode: allow unauthenticated users to use the chat
  return <ChatApp user={user ?? null} />;
}
