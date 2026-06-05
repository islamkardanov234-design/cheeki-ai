// lib/knowledge-docs.ts
// Full CHEEKI knowledge base — used for vector ingest via /api/ingest

export const cheekiDocs = [
  {
    title: 'CHEEKI Project Overview',
    source: 'internal',
    content: `CHEEKI is a community-driven meme token on BNB Smart Chain (BEP20). The project was created with a "no shortcuts" philosophy: no paid promotions, no fake hype, fully organic growth. The mascot is a Slavic gopnik character in a black tracksuit and ushanka hat — a bold, recognizable figure for the meme community.

Contract address: 0x0c0A5B284D3bDD42c9FD53C99502CF8b3FD9f599
Blockchain: BNB Smart Chain (BSC), BEP20
Token name: CHEEKI
Token symbol: CHEEKI
Decimals: 18
Total supply: 1,000,000,000 (1 billion)`,
  },
  {
    title: 'CHEEKI Security & Tokenomics',
    source: 'internal',
    content: `CHEEKI security features:
- Ownership renounced: the developer has no control over the contract
- 99.47% of liquidity is locked for 5 years via Mudra Locker (verified on-chain)
- 0% buy tax and 0% sell tax — no hidden fees
- Contract verified on BscScan
- Total supply: 1,000,000,000 CHEEKI (1 billion tokens)

These features make CHEEKI one of the safest meme tokens on BNB Chain. Traders can buy and sell without any tax penalty. LP lock certificate is available via Mudra Locker.`,
  },
  {
    title: 'CHEEKI Official Links',
    source: 'internal',
    content: `CHEEKI official channels and tools:
- X (Twitter): https://x.com/cheekiofficial
- Telegram community: https://t.me/CHEEKIofficial
- Radar Bot (Telegram): https://t.me/cheeki_radar_bot
- Contract on BscScan: https://bscscan.com/token/0x0c0A5B284D3bDD42c9FD53C99502CF8b3FD9f599
- Chart on DexScreener: https://dexscreener.com/bsc/0x0c0A5B284D3bDD42c9FD53C99502CF8b3FD9f599
- Buy on PancakeSwap: https://pancakeswap.finance/swap?outputCurrency=0x0c0A5B284D3bDD42c9FD53C99502CF8b3FD9f599

The Telegram Radar Bot (@cheeki_radar_bot) provides real-time alerts and market monitoring for CHEEKI.`,
  },
  {
    title: 'CHEEKI Listings & Trackers',
    source: 'internal',
    content: `CHEEKI is listed and tracked on the following platforms:
- CMC DEXScan (CoinMarketCap): live, price and volume tracked
- CoinGecko: listing submitted and in review
- Trust Wallet: assets PR submitted (logo and metadata)
- PancakeSwap Token List: PR submitted for official logo/name in swap UI
- DexScreener: chart available with live price data
- DEXTools: available for BSC pairs

How to buy CHEEKI:
1. Open PancakeSwap (pancakeswap.finance)
2. Connect your wallet (MetaMask, Trust Wallet, or WalletConnect)
3. Switch network to BNB Smart Chain
4. Paste contract: 0x0c0A5B284D3bDD42c9FD53C99502CF8b3FD9f599
5. Swap BNB for CHEEKI (0% tax, no slippage adjustments needed)`,
  },
  {
    title: 'CHEEKI Mascot & Branding',
    source: 'internal',
    content: `The CHEEKI mascot is a Slavic gopnik character inspired by the "cheeki breeki" internet meme culture. The character wears a black tracksuit, an ushanka hat with a "C" logo, and has a serious, confident expression.

The brand colors are black and yellow (gold). The logo features the mascot in a crouching or standing pose. The visual identity is bold, crypto-native, and meme-ready.

CHEEKI AI is the official AI assistant of the project — a bilingual (English/Russian) chatbot that answers questions about the token, project status, how to buy, and general DeFi topics.`,
  },
  {
    title: 'CHEEKI Community & Philosophy',
    source: 'internal',
    content: `CHEEKI community values:
- No paid promotions or influencer deals
- No fake volume or wash trading
- Transparent, on-chain verifiable security (renounced, LP locked)
- Organic growth through real community engagement
- Active daily content on X (Twitter) and Telegram
- Community-first: holders are invited to propose ideas for memes, tools, and collabs

The community is active on Telegram (@CHEEKIofficial) and X (@cheekiofficial). The project runs regular engagement posts, meme contests, and community check-ins.`,
  },
  {
    title: 'CHEEKI FAQ — Common Questions',
    source: 'internal',
    content: `Frequently asked questions about CHEEKI:

Q: Is CHEEKI safe?
A: Yes. The contract is renounced, 99.47% of LP is locked for 5 years, and there is 0% tax. This is among the safest setups for a meme token.

Q: Where can I buy CHEEKI?
A: On PancakeSwap using BNB. Contract: 0x0c0A5B284D3bDD42c9FD53C99502CF8b3FD9f599

Q: What is the total supply?
A: 1,000,000,000 CHEEKI (1 billion tokens)

Q: Is there a tax?
A: No. 0% buy and 0% sell tax.

Q: Is the liquidity locked?
A: Yes. 99.47% of LP is locked for 5 years via Mudra Locker.

Q: Is the contract renounced?
A: Yes. The developer has no control over the contract.

Q: What chain is CHEEKI on?
A: BNB Smart Chain (BSC), BEP20.

Q: What is the Radar Bot?
A: @cheeki_radar_bot on Telegram provides market alerts and CHEEKI tracking.

Q: Is CHEEKI on CoinGecko or CoinMarketCap?
A: CMC DEXScan is live. CoinGecko listing is pending review. Trust Wallet PR is submitted.`,
  },
  {
    title: 'How to Add CHEEKI to MetaMask',
    source: 'internal',
    content: `Step-by-step guide to add CHEEKI token to MetaMask:

1. Open MetaMask and make sure you are on BNB Smart Chain network
   - Network name: BNB Smart Chain
   - RPC URL: https://bsc-dataseed.binance.org/
   - Chain ID: 56
   - Symbol: BNB

2. Click "Import tokens" at the bottom of the Assets tab

3. Select "Custom token" and paste:
   - Token contract address: 0x0c0A5B284D3bDD42c9FD53C99502CF8b3FD9f599
   - Token symbol: CHEEKI (auto-filled)
   - Decimals: 18 (auto-filled)

4. Click "Add custom token" then "Import tokens"

Your CHEEKI balance will now appear in MetaMask.`,
  },
];
