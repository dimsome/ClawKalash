---
name: sovereignclaw
description: Economic sovereignty for AI agents. Create wallets, acquire any asset on any chain. Uses Bungee for all mainnet cross-chain routing. CCTP direct for testnet only. Supports ERC20 (Permit2) and native tokens. Treasury management, payments, portfolio tracking — all self-directed.
version: 0.1.0
author: BotBot (OpenClaw agent for @dimsome)
---

# SovereignClaw

Economic sovereignty for AI agents. Any asset. Any chain. No permission needed.

## Capabilities

| Capability | Description |
|------------|-------------|
| **Wallet Management** | Create wallets, import keys, encrypted storage |
| **Portfolio View** | Check balances across all chains via Bungee API |
| **Cross-Chain Swaps** | Any token → any token across 30+ chains |
| **Native Token Swaps** | ETH/MATIC/etc via direct transactions |
| **ERC20 Swaps** | Gasless via Permit2 signatures |
| **USDC Bridging (Testnet)** | Native CCTP for testnet USDC transfers |
| **Status Tracking** | Monitor transactions via SocketScan |

## When to Activate

- "Create a wallet for me"
- "Get me 100 USDC on Arbitrum"
- "Bridge ETH from Base to Optimism"
- "Swap 0.1 ETH to USDC"
- "What's my balance?"
- "Show my portfolio"

## Quick Start

### 1. Create Wallet

```bash
npx tsx scripts/wallet.ts create
```

**⚠️ CRITICAL:** Seed phrase shown ONCE. User must confirm backup before proceeding.

### 2. Check Portfolio

```bash
npx tsx scripts/bungee.ts portfolio
```

### 3. Execute Swap

```bash
npx tsx scripts/bungee.ts swap 8453 8453 0xEeee...EEEE 0x833589...02913 1000000000000000
```

### 4. Monitor Status

**API:**
```bash
curl "https://public-backend.bungee.exchange/api/v1/bungee/status?requestHash=<requestHash>"
```

**UI:**
```
https://socketscan.io/tx/<requestHash>
```

## Execution Reference

### Wallet Commands

| Command | Description |
|---------|-------------|
| `wallet.ts create` | Create new wallet, show seed once |
| `wallet.ts import <key>` | Import existing key/mnemonic |
| `wallet.ts address` | Show wallet address |
| `wallet.ts exists` | Check if wallet exists |

### Trading Commands

| Command | Description |
|---------|-------------|
| `bungee.ts portfolio [addr]` | View all balances |
| `bungee.ts quote <params>` | Get swap quote |
| `bungee.ts swap <params>` | Execute swap |
| `bungee.ts status <hash>` | Check tx status (for long-running txs) |

### Parameters

```
swap <originChainId> <destChainId> <inputToken> <outputToken> <amount>

Example: swap 8453 42161 0xEeee...EEEE 0x833589...02913 1000000000000000
         (Base → Arbitrum, 0.001 ETH → USDC)
```

## Workflows

### Cross-Chain Swap (ERC20)

1. Get quote → returns `signTypedData`
2. Sign Permit2 typed data (gasless)
3. Submit signature to Bungee
4. Poll status until complete

### Cross-Chain Swap (Native Token)

1. Get quote → returns `txData`
2. Send transaction directly onchain
3. Poll status using `requestHash`

### USDC Bridge via CCTP (Testnet Only)

**⚠️ Use Bungee for mainnet USDC transfers.** CCTP direct is for testnet/development only.

1. Approve USDC for TokenMessenger
2. Call `depositForBurn`
3. Wait for Circle attestation
4. Call `receiveMessage` on destination

## Common Patterns

### Check Before Trading

```bash
# Check balance first
npx tsx scripts/bungee.ts portfolio 0xYourAddress

# Then execute
npx tsx scripts/bungee.ts swap ...
```

### Track Transaction

After swap, use requestHash on SocketScan:
```
https://socketscan.io/tx/<requestHash>
```

## Prompt Examples

| Intent | Example |
|--------|---------|
| Create wallet | "Set up my treasury wallet" |
| Check balance | "What's my balance on Base?" |
| Swap tokens | "Swap 0.1 ETH to USDC on Base" |
| Bridge | "Bridge 100 USDC from Base to Arbitrum" |
| Portfolio | "Show all my tokens across chains" |

## Response Format

```
🔄 Swap: 0.1 ETH → USDC on Base

📊 Route: Bungee Auto
💰 Output: ~210 USDC
⛽ Gas: ~$0.12
⏱️ Time: ~10 seconds

Confirm? (yes/no)
```

## Error Handling

| Error | Response |
|-------|----------|
| Insufficient balance | "Need X but have Y. Acquire more first." |
| No route | "No route for X → Y. Try different pair." |
| Quote expired | "Quote expired. Getting fresh quote..." |
| Tx reverted | "Transaction failed. Check slippage." |

## References

- [API Reference](references/api.md) — Endpoints and parameters
- [Token & Chain IDs](references/tokens.md) — Addresses and chain IDs
- [Troubleshooting](references/troubleshooting.md) — Common issues

## Security

1. **Seed phrase shown ONCE** — never again after setup
2. **Keys encrypted at rest** — AES-256-CBC
3. **Never log keys** — security-first design
4. **Testnet recommended** — for development/testing

---

*Built for the USDC Hackathon on Moltbook.*
