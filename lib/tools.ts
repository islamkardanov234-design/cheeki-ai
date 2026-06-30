import { tool } from 'ai';
import { z } from 'zod';
import { searchKnowledge } from './knowledge-search';
import { knowledge } from './knowledge';
import { generateImage } from './image-gen';

const CHEEKI_CONTRACT = '0x0c0A5B284D3bDD42c9FD53C99502CF8b3FD9f599';
const DEXSCREENER_API = `https://api.dexscreener.com/latest/dex/tokens/${CHEEKI_CONTRACT}`;

async function fetchCheekiPrice() {
  try {
    const res = await fetch(DEXSCREENER_API, { next: { revalidate: 30 } });
    if (!res.ok) return null;
    const data = await res.json();
    const pair = data?.pairs?.[0];
    if (!pair) return null;
    return {
      price_usd: pair.priceUsd ?? 'N/A',
      price_native: pair.priceNative ?? 'N/A',
      volume_24h: pair.volume?.h24 ?? 'N/A',
      liquidity_usd: pair.liquidity?.usd ?? 'N/A',
      market_cap: pair.marketCap ?? 'N/A',
      fdv: pair.fdv ?? 'N/A',
      price_change_5m: pair.priceChange?.m5 ?? 'N/A',
      price_change_1h: pair.priceChange?.h1 ?? 'N/A',
      price_change_6h: pair.priceChange?.h6 ?? 'N/A',
      price_change_24h: pair.priceChange?.h24 ?? 'N/A',
      txns_24h_buys: pair.txns?.h24?.buys ?? 'N/A',
      txns_24h_sells: pair.txns?.h24?.sells ?? 'N/A',
      chart_url: `https://dexscreener.com/bsc/${pair.pairAddress ?? CHEEKI_CONTRACT}`,
    };
  } catch {
    return null;
  }
}

export const cheekiTools = {
  search_knowledge: tool({
    description: 'Search the CHEEKI project knowledge base for specific information about the project, tokenomics, security, how to buy, links, FAQ, etc.',
    inputSchema: z.object({
      query: z.string().describe('The search query to find relevant knowledge'),
    }),
    execute: async ({ query }: { query: string }) => {
      const result = await searchKnowledge(query);
      return result || 'No specific information found for this query.';
    },
  }),

  get_project_info: tool({
    description: 'Get basic CHEEKI project information like contract address, links, chain',
    inputSchema: z.object({
      field: z.enum(['contract', 'links', 'chain', 'name', 'all']),
    }),
    execute: async ({ field }: { field: string }) => {
      const k = knowledge.project;
      if (field === 'contract') return k.contractAddress;
      if (field === 'links') return JSON.stringify(k.officialLinks);
      if (field === 'chain') return k.chain;
      if (field === 'name') return k.name;
      return JSON.stringify(k);
    },
  }),

  get_live_price: tool({
    description: 'Get real-time CHEEKI token price, market cap, trading volume, liquidity, and price changes from DexScreener. Use this whenever the user asks about price, chart, market cap, volume, or trading data.',
    inputSchema: z.object({
      field: z.enum(['all', 'price', 'volume', 'market_cap', 'changes', 'liquidity']).optional().default('all'),
    }),
    execute: async ({ field = 'all' }: { field?: string }) => {
      const data = await fetchCheekiPrice();
      if (!data) {
        return 'Could not fetch live price data. Try checking DexScreener directly: https://dexscreener.com/bsc/' + CHEEKI_CONTRACT;
      }
      if (field === 'price') return `CHEEKI price: $${data.price_usd} USD (${data.price_native} BNB)\nChange 1h: ${data.price_change_1h}% | 24h: ${data.price_change_24h}%`;
      if (field === 'volume') return `24h volume: $${Number(data.volume_24h).toLocaleString()}\nBuys: ${data.txns_24h_buys} | Sells: ${data.txns_24h_sells}`;
      if (field === 'market_cap') return `Market cap: $${Number(data.market_cap).toLocaleString()}\nFDV: $${Number(data.fdv).toLocaleString()}`;
      if (field === 'changes') return `Price changes:\n5m: ${data.price_change_5m}%\n1h: ${data.price_change_1h}%\n6h: ${data.price_change_6h}%\n24h: ${data.price_change_24h}%`;
      if (field === 'liquidity') return `Liquidity: $${Number(data.liquidity_usd).toLocaleString()}`;

      return `CHEEKI Live Data (DexScreener):
💰 Price: $${data.price_usd} (${data.price_native} BNB)
📊 Market Cap: $${Number(data.market_cap).toLocaleString()}
💎 FDV: $${Number(data.fdv).toLocaleString()}
💧 Liquidity: $${Number(data.liquidity_usd).toLocaleString()}
📈 Volume 24h: $${Number(data.volume_24h).toLocaleString()}
🔄 Txns 24h: ${data.txns_24h_buys} buys / ${data.txns_24h_sells} sells
📉 Changes: 5m ${data.price_change_5m}% | 1h ${data.price_change_1h}% | 6h ${data.price_change_6h}% | 24h ${data.price_change_24h}%
🔗 Chart: ${data.chart_url}`;
    },
  }),

  generate_image: tool({
    description:
      'Generate an image from a text description. Use this whenever the user asks to draw, create, generate, or make an image, picture, meme, logo, or art. Returns markdown that renders the image inline in the chat.',
    inputSchema: z.object({
      prompt: z
        .string()
        .describe('Detailed English description of the image to generate. Translate the user request to English if needed and add helpful visual detail.'),
      size: z
        .enum(['1024x1024', '1536x1024', '1024x1536'])
        .optional()
        .default('1024x1024')
        .describe('Aspect ratio: square, landscape, or portrait.'),
    }),
    execute: async ({ prompt, size = '1024x1024' }: { prompt: string; size?: '1024x1024' | '1536x1024' | '1024x1536' }) => {
      try {
        const img = await generateImage(prompt, size);
        // Возвращаем Markdown — фронтенд рендерит его как картинку.
        return `✅ Image generated.\n\n![${prompt.slice(0, 80)}](${img.url})`;
      } catch (e) {
        return `⚠️ Could not generate the image: ${(e as Error).message}`;
      }
    },
  }),
};
