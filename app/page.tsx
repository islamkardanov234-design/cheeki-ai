import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { ChatApp } from '@/components/chat-app';

export default async function HomePage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <ChatApp user={user} />;
}
