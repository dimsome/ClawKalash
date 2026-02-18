/**
 * Dynamic chain resolution — zero hardcoded chain data.
 * 
 * Chain names and native currency come from Bungee's supported-chains API.
 * Viem chain configs (for swap execution) are resolved from viem/chains by chainId,
 * with defineChain fallback for chains viem doesn't know about.
 */

import * as allViemChains from 'viem/chains';
import { defineChain, type Chain } from 'viem';
import { BUNGEE_API, type SupportedChain } from './types.js';

// ============ Bungee chain data (fetched once, cached) ============

let cachedChains: SupportedChain[] | null = null;
let chainMap: Map<number, SupportedChain> | null = null;

export async function fetchSupportedChains(): Promise<SupportedChain[]> {
  if (cachedChains) return cachedChains;

  const response = await fetch(`${BUNGEE_API}/api/v1/supported-chains`);
  if (!response.ok) {
    throw new Error(`Bungee API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json() as { success: boolean; result: SupportedChain[] };

  if (!data.success || !data.result) {
    throw new Error('Failed to fetch supported chains');
  }

  cachedChains = data.result;
  chainMap = new Map(data.result.map(c => [c.chainId, c]));
  return cachedChains;
}

function getChainMap(): Map<number, SupportedChain> {
  if (!chainMap) {
    console.warn('[chains] Chain data not loaded — call fetchSupportedChains() first');
    return new Map();
  }
  return chainMap;
}

/**
 * Get chain name by chainId. Uses cached Bungee data if available.
 */
export function getChainName(chainId: number): string {
  const bungeeChain = getChainMap().get(chainId);
  if (bungeeChain) return bungeeChain.name;

  // Fallback to viem
  const viemChain = viemChainsByIdCache.get(chainId);
  if (viemChain) return viemChain.name;

  return `Chain ${chainId}`;
}

/**
 * Get native currency info for a chain.
 */
export function getNativeCurrency(chainId: number): { name: string; symbol: string; decimals: number } {
  const bungeeChain = getChainMap().get(chainId);
  if (bungeeChain?.currency) {
    return {
      name: bungeeChain.currency.name,
      symbol: bungeeChain.currency.symbol,
      decimals: bungeeChain.currency.decimals,
    };
  }

  const viemChain = viemChainsByIdCache.get(chainId);
  if (viemChain) return viemChain.nativeCurrency;

  console.warn(`[chains] No native currency info for chain ${chainId}, defaulting to ETH`);
  return { name: 'Unknown', symbol: 'ETH', decimals: 18 };
}

// ============ Viem chain configs (for swap execution) ============

const viemChainsByIdCache = new Map<number, Chain>();

for (const chain of Object.values(allViemChains)) {
  if (chain && typeof chain === 'object' && 'id' in chain) {
    viemChainsByIdCache.set(chain.id, chain as Chain);
  }
}

// ============ Chainlist fallback RPCs (ethereum-lists/chains) ============

let chainlistCache: Map<number, string[]> | null = null;

interface ChainlistRPC {
  url: string;
  tracking?: string;
  isOpenSource?: boolean;
}

interface ChainlistEntry {
  name: string;
  chainId: number;
  rpc: ChainlistRPC[];
}

async function fetchChainlistRPCs(chainId: number): Promise<string[]> {
  if (chainlistCache) {
    return chainlistCache.get(chainId) || [];
  }

  try {
    const response = await fetch('https://chainlist.org/rpcs.json');
    if (!response.ok) {
      console.warn(`[chains] Chainlist fetch failed: ${response.status}`);
      return [];
    }
    const chains = await response.json() as ChainlistEntry[];
    
    chainlistCache = new Map();
    for (const chain of chains) {
      // Filter to HTTP(S) only, prefer no-tracking RPCs first
      const httpRPCs = chain.rpc.filter(r => r.url.startsWith('https://'));
      const noTracking = httpRPCs.filter(r => r.tracking === 'none').map(r => r.url);
      const rest = httpRPCs.filter(r => r.tracking !== 'none').map(r => r.url);
      const sorted = [...noTracking, ...rest];
      if (sorted.length > 0) {
        chainlistCache.set(chain.chainId, sorted);
      }
    }
    return chainlistCache.get(chainId) || [];
  } catch {
    return [];
  }
}

/**
 * Get a viem Chain config by chainId for transaction execution.
 * Resolution order:
 *   1. viem's built-in chains (best: curated RPCs, proper config)
 *   2. defineChain with chainlist.org public RPCs (fallback for exotic chains)
 */
export async function getChain(chainId: number): Promise<Chain> {
  const cached = viemChainsByIdCache.get(chainId);
  if (cached) return cached;

  const currency = getNativeCurrency(chainId);
  const chainlistRPCs = await fetchChainlistRPCs(chainId);
  
  if (chainlistRPCs.length === 0) {
    throw new Error(`No RPC available for chain ${chainId}. Cannot execute transactions.`);
  }

  const chain = defineChain({
    id: chainId,
    name: getChainName(chainId),
    nativeCurrency: currency,
    rpcUrls: {
      default: { http: chainlistRPCs.slice(0, 3) },
    },
  });

  viemChainsByIdCache.set(chainId, chain); // cache for future calls
  return chain;
}
