/**
 * CCTP Bridge Script
 * Bridges USDC across chains using Circle's Cross-Chain Transfer Protocol
 */

import { createWalletClient, createPublicClient, http, encodeFunctionData, parseUnits, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia, baseSepolia, arbitrumSepolia, optimismSepolia } from 'viem/chains';

// ============ Configuration ============

interface ChainConfig {
  name: string;
  domain: number;
  chainId: number;
  chain: any;
  usdc: `0x${string}`;
  rpcUrl?: string;
}

const TESTNET_CHAINS: Record<string, ChainConfig> = {
  'ethereum-sepolia': {
    name: 'Ethereum Sepolia',
    domain: 0,
    chainId: 11155111,
    chain: sepolia,
    usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
  },
  'base-sepolia': {
    name: 'Base Sepolia',
    domain: 6,
    chainId: 84532,
    chain: baseSepolia,
    usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    rpcUrl: 'https://base-sepolia-rpc.publicnode.com',
  },
  'arbitrum-sepolia': {
    name: 'Arbitrum Sepolia',
    domain: 3,
    chainId: 421614,
    chain: arbitrumSepolia,
    usdc: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
  },
  'op-sepolia': {
    name: 'OP Sepolia',
    domain: 2,
    chainId: 11155420,
    chain: optimismSepolia,
    usdc: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7',
  },
};

// CCTP Contracts (same on all testnet chains)
const CCTP_CONTRACTS = {
  testnet: {
    tokenMessenger: '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA' as `0x${string}`,
    messageTransmitter: '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275' as `0x${string}`,
    attestationApi: 'https://iris-api-sandbox.circle.com',
  },
  mainnet: {
    tokenMessenger: '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d' as `0x${string}`,
    messageTransmitter: '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64' as `0x${string}`,
    attestationApi: 'https://iris-api.circle.com',
  },
};

// ABIs
const ERC20_ABI = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

const TOKEN_MESSENGER_ABI = [
  {
    type: 'function',
    name: 'depositForBurn',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'destinationDomain', type: 'uint32' },
      { name: 'mintRecipient', type: 'bytes32' },
      { name: 'burnToken', type: 'address' },
      { name: 'destinationCaller', type: 'bytes32' },
      { name: 'maxFee', type: 'uint256' },
      { name: 'minFinalityThreshold', type: 'uint32' },
    ],
    outputs: [],
  },
] as const;

const MESSAGE_TRANSMITTER_ABI = [
  {
    type: 'function',
    name: 'receiveMessage',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'message', type: 'bytes' },
      { name: 'attestation', type: 'bytes' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
  },
] as const;

// ============ Helper Functions ============

function addressToBytes32(address: string): `0x${string}` {
  return `0x000000000000000000000000${address.slice(2)}` as `0x${string}`;
}

const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============ Bridge Class ============

export class CCTPBridge {
  private privateKey: `0x${string}`;
  private isTestnet: boolean;
  private contracts: typeof CCTP_CONTRACTS.testnet;

  constructor(privateKey: string, isTestnet = true) {
    this.privateKey = privateKey as `0x${string}`;
    this.isTestnet = isTestnet;
    this.contracts = isTestnet ? CCTP_CONTRACTS.testnet : CCTP_CONTRACTS.mainnet;
  }

  private getChainConfig(chainName: string): ChainConfig {
    const normalized = chainName.toLowerCase().replace(/\s+/g, '-');
    const config = TESTNET_CHAINS[normalized];
    if (!config) {
      throw new Error(`Unsupported chain: ${chainName}. Supported: ${Object.keys(TESTNET_CHAINS).join(', ')}`);
    }
    return config;
  }

  private createClients(chainConfig: ChainConfig) {
    const account = privateKeyToAccount(this.privateKey);
    const transport = chainConfig.rpcUrl ? http(chainConfig.rpcUrl) : http();
    const walletClient = createWalletClient({
      chain: chainConfig.chain,
      transport,
      account,
    });
    const publicClient = createPublicClient({
      chain: chainConfig.chain,
      transport,
    });
    return { walletClient, publicClient, account };
  }

  async getBalance(chainName: string): Promise<string> {
    const chainConfig = this.getChainConfig(chainName);
    const { publicClient, account } = this.createClients(chainConfig);
    
    const balance = await publicClient.readContract({
      address: chainConfig.usdc,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [account.address],
    });

    return formatUnits(balance, 6);
  }

  async quote(
    sourceChain: string,
    destChain: string,
    amount: string
  ): Promise<{
    sourceChain: string;
    destChain: string;
    amount: string;
    estimatedReceived: string;
    fee: string;
    estimatedTime: string;
  }> {
    const source = this.getChainConfig(sourceChain);
    const dest = this.getChainConfig(destChain);
    
    // CCTP fee is minimal (~0.0005 USDC)
    const fee = '0.0005';
    const received = (parseFloat(amount) - parseFloat(fee)).toFixed(4);

    return {
      sourceChain: source.name,
      destChain: dest.name,
      amount,
      estimatedReceived: received,
      fee,
      estimatedTime: '1-2 minutes (Fast Transfer)',
    };
  }

  async bridge(
    sourceChain: string,
    destChain: string,
    amount: string,
    recipient?: string,
    onStatus?: (status: string) => void
  ): Promise<{
    burnTxHash: string;
    mintTxHash: string;
    amountReceived: string;
  }> {
    const log = onStatus || console.log;

    const source = this.getChainConfig(sourceChain);
    const dest = this.getChainConfig(destChain);
    const amountWei = parseUnits(amount, 6);

    const { walletClient: sourceWallet, publicClient: sourcePublic, account } = this.createClients(source);
    const { walletClient: destWallet } = this.createClients(dest);

    const recipientAddress = recipient || account.address;
    const recipientBytes32 = addressToBytes32(recipientAddress);

    // Step 1: Check balance
    log('📊 Checking USDC balance...');
    const balance = await sourcePublic.readContract({
      address: source.usdc,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [account.address],
    });

    if (balance < amountWei) {
      throw new Error(`Insufficient USDC. Have: ${formatUnits(balance, 6)}, Need: ${amount}`);
    }

    // Step 2: Approve USDC
    log('✅ Step 1/4: Approving USDC...');
    const allowance = await sourcePublic.readContract({
      address: source.usdc,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [account.address, this.contracts.tokenMessenger],
    });

    if (allowance < amountWei) {
      const approveTx = await sourceWallet.sendTransaction({
        to: source.usdc,
        data: encodeFunctionData({
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [this.contracts.tokenMessenger, amountWei * 10n], // Approve extra for future txs
        }),
      });
      log(`   Approval TX: ${approveTx}`);
      await sourcePublic.waitForTransactionReceipt({ hash: approveTx });
    } else {
      log('   Already approved.');
    }

    // Step 3: Burn USDC
    log('🔥 Step 2/4: Burning USDC on source chain...');
    const maxFee = 100000n; // 0.1 USDC - higher fee for faster attestation
    const minFinalityThreshold = 1000; // Fast transfer

    const burnTx = await sourceWallet.sendTransaction({
      to: this.contracts.tokenMessenger,
      data: encodeFunctionData({
        abi: TOKEN_MESSENGER_ABI,
        functionName: 'depositForBurn',
        args: [
          amountWei,
          dest.domain,
          recipientBytes32,
          source.usdc,
          ZERO_BYTES32,
          maxFee,
          minFinalityThreshold,
        ],
      }),
    });
    log(`   Burn TX: ${burnTx}`);
    await sourcePublic.waitForTransactionReceipt({ hash: burnTx });

    // Step 4: Wait for attestation
    log('⏳ Step 3/4: Waiting for attestation...');
    const attestation = await this.waitForAttestation(source.domain, burnTx, log);
    log('   ✅ Attestation received!');

    // Step 5: Mint on destination
    log('🪙 Step 4/4: Minting USDC on destination chain...');
    const mintTx = await destWallet.sendTransaction({
      to: this.contracts.messageTransmitter,
      data: encodeFunctionData({
        abi: MESSAGE_TRANSMITTER_ABI,
        functionName: 'receiveMessage',
        args: [attestation.message as `0x${string}`, attestation.attestation as `0x${string}`],
      }),
    });
    log(`   Mint TX: ${mintTx}`);

    const destPublic = createPublicClient({
      chain: dest.chain,
      transport: http(),
    });
    await destPublic.waitForTransactionReceipt({ hash: mintTx });

    log('✅ Bridge complete!');

    return {
      burnTxHash: burnTx,
      mintTxHash: mintTx,
      amountReceived: formatUnits(amountWei - maxFee, 6),
    };
  }

  private async waitForAttestation(
    sourceDomain: number,
    txHash: string,
    log: (msg: string) => void
  ): Promise<{ message: string; attestation: string }> {
    const url = `${this.contracts.attestationApi}/v2/messages/${sourceDomain}?transactionHash=${txHash}`;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json() as { messages?: Array<{ status: string; message: string; attestation: string }> };
          if (data.messages?.[0]?.status === 'complete') {
            return {
              message: data.messages[0].message,
              attestation: data.messages[0].attestation,
            };
          }
        }

        attempts++;
        if (attempts % 6 === 0) {
          log(`   Still waiting... (${attempts * 5}s)`);
        }
        await sleep(5000);
      } catch (error) {
        attempts++;
        await sleep(5000);
      }
    }

    throw new Error(`Attestation timeout after ${maxAttempts * 5}s. TX: ${txHash}`);
  }
}

// ============ CLI Interface ============

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 4) {
    console.log(`
Usage: npx tsx bridge.ts <action> <source> <dest> <amount> [recipient]

Actions:
  quote   - Get a quote without executing
  bridge  - Execute the bridge

Examples:
  npx tsx bridge.ts quote ethereum-sepolia base-sepolia 10
  npx tsx bridge.ts bridge ethereum-sepolia base-sepolia 10

Environment:
  PRIVATE_KEY - Your wallet private key
`);
    process.exit(1);
  }

  const [action, source, dest, amount, recipient] = args;
  const privateKey = process.env.PRIVATE_KEY;

  if (action === 'bridge' && !privateKey) {
    console.error('Error: PRIVATE_KEY environment variable required for bridging');
    process.exit(1);
  }

  const bridge = new CCTPBridge(privateKey || '0x0', true);

  if (action === 'quote') {
    const quote = await bridge.quote(source, dest, amount);
    console.log(`
🔄 CCTP Bridge Quote: ${quote.amount} USDC
📤 From: ${quote.sourceChain}
📥 To: ${quote.destChain}

💰 You receive: ~${quote.estimatedReceived} USDC
⛽ Fee: ~${quote.fee} USDC
⏱️ Est. time: ${quote.estimatedTime}
`);
  } else if (action === 'bridge') {
    const result = await bridge.bridge(source, dest, amount, recipient);
    console.log(`
✅ Bridge Complete!
🔥 Burn TX: ${result.burnTxHash}
🪙 Mint TX: ${result.mintTxHash}
💰 Received: ${result.amountReceived} USDC
`);
  }
}

main().catch(console.error);
