# Token & Chain Reference

## Dynamic Token List

Get real-time token balances and supported tokens from the Bungee API:

```bash
# Get all tokens with balances for an address
curl "https://public-backend.bungee.exchange/api/v1/tokens/list?userAddress=0x..."
```

This returns tokens across all supported chains with current balances — no need for static lists.

## Common Chain IDs

| Chain | ID | Native Token |
|-------|------|--------------|
| Ethereum | 1 | ETH |
| Base | 8453 | ETH |
| Arbitrum | 42161 | ETH |
| Optimism | 10 | ETH |
| Polygon | 137 | MATIC |
| Avalanche | 43114 | AVAX |
| BSC | 56 | BNB |

### Testnets
| Chain | ID |
|-------|------|
| Ethereum Sepolia | 11155111 |
| Base Sepolia | 84532 |
| Arbitrum Sepolia | 421614 |
| OP Sepolia | 11155420 |

## Native Token Address

All chains use the same address for native token:
```
0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
```

## USDC Addresses

### Mainnet
| Chain | Address |
|-------|---------|
| Ethereum | 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 |
| Base | 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 |
| Arbitrum | 0xaf88d065e77c8cC2239327C5EDb3A432268e5831 |
| Optimism | 0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85 |
| Polygon | 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359 |

### Testnet (Sepolia)
| Chain | Address |
|-------|---------|
| Ethereum Sepolia | 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238 |
| Base Sepolia | 0x036CbD53842c5426634e7929541eC2318f3dCF7e |
| Arbitrum Sepolia | 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d |

## CCTP Contracts

### Testnet (V2)
```
TokenMessengerV2:     0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA
MessageTransmitterV2: 0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275
```

### Mainnet (V2)
```
TokenMessengerV2:     0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d
MessageTransmitterV2: 0x81D40F21F12A8F0E3252Bccb954D722d4c464B64
```

## CCTP Domain IDs

| Chain | Domain |
|-------|--------|
| Ethereum | 0 |
| Avalanche | 1 |
| Optimism | 2 |
| Arbitrum | 3 |
| Base | 6 |
| Polygon | 7 |
