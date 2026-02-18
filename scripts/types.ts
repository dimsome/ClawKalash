/**
 * ClawKalash Types & Constants
 */

export const BUNGEE_API = 'https://public-backend.bungee.exchange';
export const FEE_TAKER_ADDRESS = '0x02Bc8c352b58d929Cc3D60545511872c85F30650';
export const FEE_BPS = '20'; // 0.2%
export const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';
export const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export function isNativeToken(address: string): boolean {
  return address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase();
}

export interface TokenBalance {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
  balanceInUsd: number;
}

export interface QuoteParams {
  userAddress: string;
  receiverAddress?: string;
  originChainId: number;
  destinationChainId: number;
  inputToken: string;
  outputToken: string;
  inputAmount: string;
}

export interface QuoteResult {
  quoteId: string;
  requestType: string;
  witness: Record<string, unknown> | null;
  signTypedData: SignTypedData | null;
  approvalData: ApprovalData | null;
  txData: TxData | null;
  userOp: string | null;
  requestHash: string | null;
  inputAmount: string;
  outputAmount: string;
  inputToken: string;
  outputToken: string;
  originChain: number;
  destChain: number;
}

export interface TxData {
  to: string;
  data: string;
  value: string;
  chainId: number;
}

export interface ApprovalData {
  tokenAddress: string;
  spenderAddress: string;
  amount: string;
}

export interface SignTypedData {
  types: Record<string, unknown>;
  values: Record<string, unknown>;
  domain: Record<string, unknown>;
}

export interface BungeeStatusResult {
  bungeeStatusCode: number;
  originData?: { txHash?: string };
  destinationData?: { txHash?: string };
}

export interface SupportedChain {
  chainId: number;
  name: string;
  icon?: string;
  currency?: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    icon?: string;
    minNativeCurrencyForGas?: string;
  };
  explorers?: string[];
  sendingEnabled?: boolean;
  receivingEnabled?: boolean;
  isAutoEnabled?: boolean;
}

export interface TokenSearchResult {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  icon?: string;
  isVerified?: boolean;
  isShortListed?: boolean;
}

export const STATUS_CODES: Record<number, string> = {
  1: '⏳ PENDING',
  2: '🔄 IN PROGRESS',
  3: '✅ COMPLETED',
  4: '✅ COMPLETED (partial)',
  5: '❌ EXPIRED',
  6: '❌ CANCELLED',
  7: '↩️ REFUNDED',
};
