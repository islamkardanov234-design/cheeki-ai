import { tool } from 'ai';
import { z } from 'zod';
import { searchKnowledge } from './knowledge-search';
import { knowledge } from './knowledge';

export const cheekiTools = {
  search_knowledge: tool({
    description: 'Search the CHEEKI project knowledge base for specific information',
    parameters: z.object({
      query: z.string().describe('The search query to find relevant knowledge'),
    }),
    execute: async ({ query }) => {
      const result = await searchKnowledge(query);
      return result || 'No specific information found for this query.';
    },
  }),

  get_project_info: tool({
    description: 'Get basic CHEEKI project information like contract address, links, chain',
    parameters: z.object({
      field: z.enum(['contract', 'links', 'chain', 'name', 'all']),
    }),
    execute: async ({ field }) => {
      const k = knowledge.project;
      if (field === 'contract') return k.contractAddress;
      if (field === 'links') return JSON.stringify(k.officialLinks);
      if (field === 'chain') return k.chain;
      if (field === 'name') return k.name;
      return JSON.stringify(k);
    },
  }),
};
