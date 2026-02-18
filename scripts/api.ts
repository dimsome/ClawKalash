/**
 * Bungee API client
 */

import {
  BUNGEE_API, FEE_TAKER_ADDRESS, FEE_BPS,
  type TokenBalance, type QuoteParams, type QuoteResult,
  type BungeeStatusResult, type TokenSearchResult,
} from './types.js';

// ============ Retry Wrapper ============

async function withRetry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 1000): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === attempts - 1) throw err;
      await new Promise(r => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw new Error('Unreachable');
}

// ============ Token List / Portfolio ============

export async function getTokenBalances(userAddress: string): Promise<TokenBalance[]> {
  return withRetry(async () => {
    const url = `${BUNGEE_API}/api/v1/tokens/list?userAddress=${userAddress}`;
    const response = await fetch(url);
    const data = await response.json() as { success?: boolean; result?: Record<string, TokenBalance[]> };

    if (!data.success || !data.result) {
      throw new Error('Failed to fetch token list');
    }

    const allTokens: TokenBalance[] = [];
    for (const tokens of Object.values(data.result)) {
      for (const token of tokens) {
        if (token.balanceInUsd > 0) {
          allTokens.push(token);
        }
      }
    }

    return allTokens.sort((a, b) => b.balanceInUsd - a.balanceInUsd);
  });
}

// ============ Token Search ============

export async function searchTokens(query: string): Promise<TokenSearchResult[]> {
  const url = `${BUNGEE_API}/api/v1/tokens/search?query=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  const data = await response.json() as { success?: boolean; result?: TokenSearchResult[] };

  if (!data.success || !data.result) {
    throw new Error('Failed to search tokens');
  }

  return data.result;
}

/**
 * Resolve a token by address or symbol on a specific chain.
 * Relies on Bungee's search endpoint which handles both.
 */
export async function resolveToken(input: string, chainId: number): Promise<{ address: string; symbol: string; decimals: number }> {
  const results = await searchTokens(input);
  const match = results.find(t => t.chainId === chainId);

  if (!match) {
    throw new Error(`Token "${input}" not found on chain ${chainId}`);
  }

  return { address: match.address, symbol: match.symbol, decimals: match.decimals };
}

// ============ Quote ============

export function buildQuoteParams(params: QuoteParams): URLSearchParams {
  return new URLSearchParams({
    userAddress: params.userAddress,
    receiverAddress: params.receiverAddress || params.userAddress,
    originChainId: String(params.originChainId),
    destinationChainId: String(params.destinationChainId),
    inputToken: params.inputToken,
    outputToken: params.outputToken,
    inputAmount: params.inputAmount,
    feeTakerAddress: FEE_TAKER_ADDRESS,
    feeBps: FEE_BPS,
  });
}

export async function getQuote(params: QuoteParams): Promise<QuoteResult> {
  return withRetry(async () => {
    const quoteParams = buildQuoteParams(params);
    const url = `${BUNGEE_API}/api/v1/bungee/quote?${quoteParams}`;
    const response = await fetch(url);
    const data = await response.json() as Record<string, unknown>;
    const serverReqId = response.headers.get('server-req-id');

    if (!data.success) {
      throw new Error(`Quote error: ${data.message}. server-req-id: ${serverReqId}`);
    }

    const result = data.result as Record<string, unknown>;
    if (!result) {
      throw new Error(`No result in quote response. server-req-id: ${serverReqId}`);
    }

    const auto = result.autoRoute as Record<string, unknown> | undefined;

    if (!auto) {
      throw new Error(`No autoRoute available. server-req-id: ${serverReqId}`);
    }

    const signTypedData = auto.signTypedData as QuoteResult['signTypedData'];
    const output = auto.output as Record<string, string> | undefined;

    return {
      quoteId: auto.quoteId as string,
      requestType: auto.requestType as string,
      witness: signTypedData?.values?.witness as Record<string, unknown> | null ?? null,
      signTypedData,
      approvalData: (auto.approvalData as QuoteResult['approvalData']) || null,
      txData: (auto.txData as QuoteResult['txData']) || null,
      userOp: (auto.userOp as string) || null,
      requestHash: (auto.requestHash as string) || null,
      inputAmount: params.inputAmount,
      outputAmount: output?.amount || (auto.outputAmount as string) || '0',
      inputToken: params.inputToken,
      outputToken: params.outputToken,
      originChain: params.originChainId,
      destChain: params.destinationChainId,
    };
  });
}

// ============ Status ============

export async function getStatus(requestHash: string): Promise<BungeeStatusResult[]> {
  const response = await fetch(`${BUNGEE_API}/api/v1/bungee/status?requestHash=${requestHash}`);
  const data = await response.json() as { success?: boolean; result?: BungeeStatusResult[]; error?: { message: string } };

  if (!data.success || !data.result) {
    throw new Error(`Status error: ${data.error?.message || 'Unknown error'}`);
  }

  return data.result;
}

// ============ Submit ============

export async function submitPermit2(payload: {
  requestType: string;
  request: Record<string, unknown>;
  userSignature: string;
  quoteId: string;
}): Promise<string> {
  return withRetry(async () => {
    const response = await fetch(`${BUNGEE_API}/api/v1/bungee/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json() as { success?: boolean; result?: { requestHash: string }; error?: { message: string } };
    if (!data.success || !data.result?.requestHash) {
      throw new Error(`Submit error: ${data.error?.message || JSON.stringify(data)}`);
    }

    return data.result.requestHash;
  });
}
