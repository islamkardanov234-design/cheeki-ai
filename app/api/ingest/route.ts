import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createEmbedding } from '@/lib/embeddings';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? '';

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { content, title, source } = await req.json();
  if (!content) {
    return NextResponse.json({ error: 'content required' }, { status: 400 });
  }

  const embedding = await createEmbedding(content);
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('documents')
    .insert({ content, title, source, embedding })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, id: data.id });
}
