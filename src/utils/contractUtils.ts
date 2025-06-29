import { parseUnits, formatUnits } from 'viem';

// Sepolia Testnet Configuration
export const SEPOLIA_ADDRESSES = {
  UNIKRON_SWAP_ROUTER: '0x0000000000000000000000000000000000000000', // Update after deployment
  WETH: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
  USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  DAI: '0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6',
  UNISWAP_V2_ROUTER: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
};

export const UNIKRON_SWAP_ROUTER_ABI = [
  // Enhanced ABI with slippage functions
  {
    "inputs": [
      {"internalType": "uint256", "name": "amountIn", "type": "uint256"},
      {"internalType": "uint256", "name": "amountOutMin", "type": "uint256"},
      {"internalType": "address[]", "name": "path", "type": "address[]"},
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "deadline", "type": "uint256"},
      {"internalType": "uint256", "name": "slippageBps", "type": "uint256"}
    ],
    "name": "swapExactTokensForTokensWithSlippage",
    "outputs": [{"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "amountIn", "type": "uint256"},
      {"internalType": "address[]", "name": "path", "type": "address[]"},
      {"internalType": "uint256", "name": "slippageBps", "type": "uint256"}
    ],
    "name": "getSwapQuoteWithSlippage",
    "outputs": [
      {"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"},
      {"internalType": "uint256", "name": "minAmountOut", "type": "uint256"},
      {"internalType": "uint256", "name": "feeAmount", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "amountOut", "type": "uint256"}, {"internalType": "uint256", "name": "slippageBps", "type": "uint256"}],
    "name": "calculateMinAmountOut",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getSepoliaTokens",
    "outputs": [{"internalType": "address[]", "name": "tokens", "type": "address[]"}],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "authorizeSepoliaTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "amountIn", "type": "uint256"},
      {"internalType": "uint256", "name": "amountOutMin", "type": "uint256"},
      {"internalType": "address[]", "name": "path", "type": "address[]"},
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "deadline", "type": "uint256"}
    ],
    "name": "swapExactTokensForTokens",
    "outputs": [{"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "amountIn", "type": "uint256"},
      {"internalType": "address[]", "name": "path", "type": "address[]"}
    ],
    "name": "getSwapQuote",
    "outputs": [{"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Utility functions
export const getDeadline = (minutesFromNow: number = 20): bigint => {
  return BigInt(Math.floor(Date.now() / 1000) + (minutesFromNow * 60));
};

export const parseUnits = (value: string, decimals: number = 18): bigint => {
  return parseUnits(value, decimals);
};

export const formatUnits = (value: bigint, decimals: number = 18): string => {
  return formatUnits(value, decimals);
};

export const calculateMinAmountOut = (amount: string, slippagePercent: number): string => {
  const amountNum = parseFloat(amount);
  const slippageMultiplier = (100 - slippagePercent) / 100;
  return (amountNum * slippageMultiplier).toString();
};

export const convertSlippageToBasicPoints = (slippagePercent: number): number => {
  return Math.floor(slippagePercent * 100); // Convert percentage to basis points
};

export const SEPOLIA_CHAIN_ID = 11155111;

export const TESTNET_CONFIG = {
  chainId: SEPOLIA_CHAIN_ID,
  name: 'Sepolia',
  rpcUrl: 'https://sepolia.infura.io/v3/',
  blockExplorer: 'https://sepolia.etherscan.io',
  nativeCurrency: {
    name: 'Sepolia ETH',
    symbol: 'SEP',
    decimals: 18
  }
};
