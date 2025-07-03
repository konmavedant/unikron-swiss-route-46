
// Contract ABI - Enhanced version with test functionality
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
    "outputs": [
      {"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"},
      {"internalType": "uint256", "name": "fee", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Test functions
  {
    "inputs": [{"internalType": "bool", "name": "_testMode", "type": "bool"}],
    "name": "setTestMode",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "tokenIn", "type": "address"},
      {"internalType": "address", "name": "tokenOut", "type": "address"},
      {"internalType": "uint256", "name": "amountIn", "type": "uint256"}
    ],
    "name": "simulateSwap",
    "outputs": [
      {"internalType": "uint256", "name": "expectedOut", "type": "uint256"},
      {"internalType": "uint256", "name": "fee", "type": "uint256"},
      {"internalType": "bool", "name": "canExecute", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getContractInfo",
    "outputs": [
      {"internalType": "address", "name": "contractOwner", "type": "address"},
      {"internalType": "uint256", "name": "currentFeePercentage", "type": "uint256"},
      {"internalType": "bool", "name": "isTestMode", "type": "bool"},
      {"internalType": "uint256", "name": "contractETHBalance", "type": "uint256"},
      {"internalType": "uint256", "name": "totalAuthorizedTokens", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "swapId", "type": "bytes32"}],
    "name": "isSwapProcessed",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  // Authorization functions
  {
    "inputs": [
      {"internalType": "address", "name": "token", "type": "address"},
      {"internalType": "bool", "name": "authorized", "type": "bool"}
    ],
    "name": "setTokenAuthorization",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "relayer", "type": "address"},
      {"internalType": "bool", "name": "authorized", "type": "bool"}
    ],
    "name": "setRelayerAuthorization",
    "outputs": [],
    "stateMutability": "nonpayable",
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
      {"indexed": false, "internalType": "uint256", "name": "fee", "type": "uint256"},
      {"indexed": false, "internalType": "bytes32", "name": "swapId", "type": "bytes32"}
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
      {"indexed": false, "internalType": "address", "name": "targetAddress", "type": "address"},
      {"indexed": false, "internalType": "bytes32", "name": "swapId", "type": "bytes32"}
    ],
    "name": "CrossChainSwapInitiated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": false, "internalType": "bool", "name": "enabled", "type": "bool"}
    ],
    "name": "TestModeToggled",
    "type": "event"
  }
] as const;

// Enhanced SwapTester ABI
export const SWAP_TESTER_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "_swapRouter", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "testBasicSwap",
    "outputs": [{"internalType": "bool", "name": "success", "type": "bool"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "amountIn", "type": "uint256"}],
    "name": "testQuoteGeneration",
    "outputs": [{"internalType": "bool", "name": "success", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "testAmountIn", "type": "uint256"}],
    "name": "runAllTests",
    "outputs": [
      {"internalType": "bool", "name": "basicSwapResult", "type": "bool"},
      {"internalType": "bool", "name": "quoteResult", "type": "bool"},
      {"internalType": "bool", "name": "authResult", "type": "bool"},
      {"internalType": "bool", "name": "simulationResult", "type": "bool"},
      {"internalType": "bool", "name": "errorResult", "type": "bool"}
    ],
    "stateMutability": "payable",
    "type": "function"
  }
] as const;

// Sepolia testnet addresses (UPDATE THESE AFTER DEPLOYMENT)
export const SEPOLIA_ADDRESSES = {
  WETH: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
  USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Example Sepolia USDC
  UNISWAP_V2_ROUTER: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  // Add your deployed contract addresses here after deployment
  UNIKRON_SWAP_ROUTER: "0x", // UPDATE THIS AFTER DEPLOYMENT
  SWAP_TESTER: "0x" // UPDATE THIS AFTER DEPLOYMENT
};

// Enhanced contract configuration
export const CONTRACT_CONFIG = {
  chainId: 11155111, // Sepolia chain ID
  rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
  blockExplorer: "https://sepolia.etherscan.io",
  testMode: true, // Enable for testing
  
  // Gas settings
  gasLimits: {
    swap: 300000,
    quote: 50000,
    authorization: 100000,
    testMode: 80000,
  },
  
  // Test parameters
  testAmounts: {
    min: "1000000000000000", // 0.001 ETH in wei
    default: "10000000000000000", // 0.01 ETH in wei
    max: "100000000000000000" // 0.1 ETH in wei
  }
};

// Enhanced utility functions
export const getDeadline = (minutes: number = 20): number => {
  return Math.floor(Date.now() / 1000) + (minutes * 60);
};

export const parseUnits = (value: string, decimals: number = 18): bigint => {
  const valueFloat = parseFloat(value);
  if (isNaN(valueFloat)) throw new Error("Invalid value for parsing");
  return BigInt(Math.floor(valueFloat * Math.pow(10, decimals)));
};

export const formatUnits = (value: bigint, decimals: number = 18): string => {
  return (Number(value) / Math.pow(10, decimals)).toString();
};

// Enhanced token addresses mapping for Sepolia
export const SEPOLIA_TOKENS: Record<string, string> = {
  ETH: SEPOLIA_ADDRESSES.WETH,
  WETH: SEPOLIA_ADDRESSES.WETH,
  USDC: SEPOLIA_ADDRESSES.USDC,
  // Add more tokens as needed
};

export const getTokenAddress = (symbol: string): string => {
  return SEPOLIA_TOKENS[symbol.toUpperCase()] || "";
};

// Enhanced fee calculation
export const calculateFee = (amount: string, feePercentage: number = 0.25): string => {
  const amountFloat = parseFloat(amount);
  if (isNaN(amountFloat)) return "0";
  const feeAmount = (amountFloat * feePercentage) / 100;
  return feeAmount.toString();
};

// Enhanced slippage calculation
export const calculateMinAmountOut = (expectedAmount: string, slippagePercent: number = 2): string => {
  const expectedFloat = parseFloat(expectedAmount);
  if (isNaN(expectedFloat)) return "0";
  const minAmount = expectedFloat * (1 - slippagePercent / 100);
  return minAmount.toString();
};

// Swap ID generation
export const generateSwapId = (
  user: string,
  tokenIn: string,
  tokenOut: string,
  amountIn: string,
  timestamp?: number
): string => {
  const ts = timestamp || Math.floor(Date.now() / 1000);
  // This should match the contract's keccak256 calculation
  return `${user}-${tokenIn}-${tokenOut}-${amountIn}-${ts}`;
};

// Test utilities
export const getTestPath = (tokenIn: string, tokenOut: string): string[] => {
  if (tokenIn === tokenOut) {
    return [tokenIn, tokenOut]; // Simplified for testing
  }
  // For real swaps, you'd need proper routing through WETH
  return [tokenIn, SEPOLIA_ADDRESSES.WETH, tokenOut];
};

// Contract interaction helpers
export const buildSwapParams = (
  amountIn: string,
  tokenIn: string,
  tokenOut: string,
  recipient: string,
  slippagePercent: number = 2
) => {
  const path = getTestPath(tokenIn, tokenOut);
  const deadline = getDeadline(20);
  const expectedOut = amountIn; // Simplified - would need actual price calculation
  const minAmountOut = calculateMinAmountOut(expectedOut, slippagePercent);
  
  return {
    amountIn,
    amountOutMin: minAmountOut,
    path,
    to: recipient,
    deadline
  };
};

// Error handling utilities
export const parseContractError = (error: any): string => {
  if (error?.data?.message) {
    return error.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return "Unknown contract error";
};

// Validation utilities
export const validateSwapParams = (params: {
  amountIn: string;
  tokenIn: string;
  tokenOut: string;
  recipient: string;
}): { valid: boolean; error?: string } => {
  const { amountIn, tokenIn, tokenOut, recipient } = params;
  
  if (!amountIn || parseFloat(amountIn) <= 0) {
    return { valid: false, error: "Invalid amount" };
  }
  
  if (!tokenIn || !getTokenAddress(tokenIn)) {
    return { valid: false, error: "Invalid input token" };
  }
  
  if (!tokenOut || !getTokenAddress(tokenOut)) {
    return { valid: false, error: "Invalid output token" };
  }
  
  if (!recipient || recipient === "0x0000000000000000000000000000000000000000") {
    return { valid: false, error: "Invalid recipient address" };
  }
  
  return { valid: true };
};

// Contract deployment information
export const DEPLOYMENT_INFO = {
  compiler: "0.8.19",
  optimization: true,
  runs: 200,
  testnet: "Sepolia",
  deploymentDate: new Date().toISOString(),
  features: [
    "Basic token swaps",
    "ETH to token swaps",
    "Token to ETH swaps",
    "Cross-chain swap initiation",
    "Fee collection and distribution",
    "Test mode for development",
    "Swap simulation",
    "Authorization management",
    "Reentrancy protection",
    "Comprehensive event logging"
  ]
};
