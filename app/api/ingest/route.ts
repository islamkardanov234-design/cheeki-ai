import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createEmbedding } from '@/lib/embeddings';
import { cheekiDocs } from '@/lib/knowledge-docs';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? '';

// POST /api/ingest — insert single document
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

// GET /api/ingest?seed=1 — seed all built-in knowledge docs
export async function GET(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();
  const results: { title: string; id: string; error?: string }[] = [];

  for (const doc of cheekiDocs) {
    try {
      const embedding = await createEmbedding(doc.content);
      const { data, error } = await admin
        .from('documents')
        .insert({ content: doc.content, title: doc.title, source: doc.source, embedding })
        .select()
        .single();

      if (error) {
        results.push({ title: doc.title, id: '', error: error.message });
      } else {
        results.push({ title: doc.title, id: data.id });
      }
    } catch (e: unknown) {
      results.push({ title: doc.title, id: '', error: String(e) });
    }
  }

  return NextResponse.json({ seeded: results.length, results });
}
