import { createAdminClient } from './supabase/admin';
import { createEmbedding } from './embeddings';

export async function searchKnowledge(query: string, topK = 5): Promise<string> {
  const supabase = createAdminClient();
  const embedding = await createEmbedding(query);

  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_threshold: 0.7,
    match_count: topK,
  });

  if (error || !data || data.length === 0) return '';

  return data
    .map((doc: { content: string; similarity: number }) => doc.content)
    .join('\n\n---\n\n');
}
