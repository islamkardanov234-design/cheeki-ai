import { createAdminClient } from './supabase/admin';

export async function checkRateLimit(
  userId: string,
  limit = 20,
  windowMinutes = 60
): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = createAdminClient();
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

  const { count } = await supabase
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', windowStart);

  const used = count ?? 0;

  if (used >= limit) {
    return { allowed: false, remaining: 0 };
  }

  await supabase.from('rate_limits').insert({ user_id: userId });

  return { allowed: true, remaining: limit - used - 1 };
}
