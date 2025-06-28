
// Contract ABI - This will be generated after compilation
export const UNIKRON_SWAP_ROUTER_ABI = [
  // Core swap functions
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
      {"internalType": "uint256", "name": "amountOut", "type": "uint256"},
      {"internalType": "address[]", "name": "path", "type": "address[]"},
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "deadline", "type": "uint256"}
    ],
    "name": "swapETHForExactTokens",
    "outputs": [{"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"}],
    "stateMutability": "payable",
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
    "name": "swapExactTokensForETH",
    "outputs": [{"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "tokenIn", "type": "address"},
      {"internalType": "uint256", "name": "amountIn", "type": "uint256"},
      {"internalType": "uint256", "name": "targetChainId", "type": "uint256"},
      {"internalType": "address", "name": "targetAddress", "type": "address"},
      {"internalType": "bytes", "name": "bridgeData", "type": "bytes"}
    ],
    "name": "initiateCrossChainSwap",
    "outputs": [],
    "stateMutability": "payable",
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
  },
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "tokenIn", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "tokenOut", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amountIn", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "amountOut", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "fee", "type": "uint256"}
    ],
    "name": "SwapExecuted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "tokenIn", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amountIn", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "targetChainId", "type": "uint256"},
      {"indexed": false, "internalType": "address", "name": "targetAddress", "type": "address"}
    ],
    "name": "CrossChainSwapInitiated",
    "type": "event"
  }
] as const;

// Sepolia testnet addresses
export const SEPOLIA_ADDRESSES = {
  WETH: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
  USDC: "0x", // You'll need to deploy or find a test USDC address
  UNISWAP_V2_ROUTER: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  // Add your deployed contract address here after deployment
  UNIKRON_SWAP_ROUTER: "0x" // UPDATE THIS AFTER DEPLOYMENT
};

// Contract configuration
export const CONTRACT_CONFIG = {
  chainId: 11155111, // Sepolia chain ID
  rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
  blockExplorer: "https://sepolia.etherscan.io"
};

// Utility functions for contract interaction
export const getDeadline = (minutes: number = 20): number => {
  return Math.floor(Date.now() / 1000) + (minutes * 60);
};

export const parseUnits = (value: string, decimals: number = 18): bigint => {
  return BigInt(Math.floor(parseFloat(value) * Math.pow(10, decimals)));
};

export const formatUnits = (value: bigint, decimals: number = 18): string => {
  return (Number(value) / Math.pow(10, decimals)).toString();
};

// Token addresses mapping for Sepolia
export const SEPOLIA_TOKENS: Record<string, string> = {
  ETH: SEPOLIA_ADDRESSES.WETH,
  WETH: SEPOLIA_ADDRESSES.WETH,
  USDC: SEPOLIA_ADDRESSES.USDC,
  // Add more tokens as needed
};

export const getTokenAddress = (symbol: string): string => {
  return SEPOLIA_TOKENS[symbol.toUpperCase()] || "";
};

// Fee calculation
export const calculateFee = (amount: string, feePercentage: number = 0.25): string => {
  const feeAmount = (parseFloat(amount) * feePercentage) / 100;
  return feeAmount.toString();
};

// Slippage calculation
export const calculateMinAmountOut = (expectedAmount: string, slippagePercent: number = 2): string => {
  const minAmount = parseFloat(expectedAmount) * (1 - slippagePercent / 100);
  return minAmount.toString();
};
