# CHEEKI AI

AI assistant for the CHEEKI meme project on BNB Smart Chain.

**Stack:** Next.js 15 · TypeScript · Supabase (Auth + pgvector) · OpenAI · Tailwind CSS

## Features
- Bilingual chat (EN/RU)
- Guest mode (no login required, 10 msgs/hr)
- Authenticated mode (20 msgs/hr, chat history saved)
- Live price from DexScreener via AI tool
- Vector knowledge base with semantic search
- Markdown rendering in messages
- Quick action chips on empty chat

## Deploy on Vercel

1. Fork or use the repo `islamkardanov234-design/cheeki-ai`
2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
3. Select this repo
4. Add environment variables (see below)
5. Click **Deploy**

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Admin (for seeding knowledge base)
ADMIN_EMAIL=your-admin@email.com
```

## Supabase Setup

Run `supabase/schema.sql` in your Supabase SQL Editor once.

## Seed Knowledge Base

After deploying, log in as admin and visit:
```
GET /api/ingest?seed=1
```
This will populate the vector knowledge base with all CHEEKI docs.

## Links

- Twitter: https://x.com/cheekiofficial
- Telegram: https://t.me/CHEEKIofficial
- Contract: `0x0c0A5B284D3bDD42c9FD53C99502CF8b3FD9f599`
