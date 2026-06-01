-- ============================================================
-- CHEEKI AI v5 — Full Schema
-- Run this in Supabase SQL Editor (once)
-- ============================================================

-- 1. Enable pgvector extension
create extension if not exists vector;

-- 2. Chats table
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New Chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.chats enable row level security;

create policy "Users can manage own chats"
  on public.chats for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. Messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Users can manage messages in own chats"
  on public.messages for all
  using (
    exists (
      select 1 from public.chats
      where chats.id = messages.chat_id
        and chats.user_id = auth.uid()
    )
  );

-- 4. Rate limits table
create table if not exists public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.rate_limits enable row level security;

create policy "Service role only"
  on public.rate_limits for all
  using (false);

-- 5. Knowledge documents table (pgvector)
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  title text,
  source text,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

alter table public.documents enable row level security;

create policy "Service role only"
  on public.documents for all
  using (false);

-- 6. Similarity search function
create or replace function match_documents(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 5
)
returns table (
  id uuid,
  content text,
  title text,
  source text,
  similarity float
)
language sql stable
as $$
  select
    id,
    content,
    title,
    source,
    1 - (embedding <=> query_embedding) as similarity
  from public.documents
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;

-- 7. Index for fast vector search
create index if not exists documents_embedding_idx
  on public.documents
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- 8. Auto-update updated_at on chats
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger chats_updated_at
  before update on public.chats
  for each row execute procedure update_updated_at();
