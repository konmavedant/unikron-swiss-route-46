// Constants for supported chains
export const SUPPORTED_EVM_CHAINS = [
  {
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    type: 'evm' as const,
    rpcUrl: 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    logoURI: '/chains/ethereum.png',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  {
    id: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    type: 'evm' as const,
    rpcUrl: 'https://polygon.llamarpc.com',
    explorerUrl: 'https://polygonscan.com',
    logoURI: '/chains/polygon.png',
    nativeCurrency: {
      name: 'Polygon',
      symbol: 'MATIC',
      decimals: 18,
    },
  },
  {
    id: 42161,
    name: 'Arbitrum',
    symbol: 'ETH',
    type: 'evm' as const,
    rpcUrl: 'https://arbitrum.llamarpc.com',
    explorerUrl: 'https://arbiscan.io',
    logoURI: '/chains/arbitrum.png',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  {
    id: 10,
    name: 'Optimism',
    symbol: 'ETH',
    type: 'evm' as const,
    rpcUrl: 'https://optimism.llamarpc.com',
    explorerUrl: 'https://optimistic.etherscan.io',
    logoURI: '/chains/optimism.png',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  {
    id: 8453,
    name: 'Base',
    symbol: 'ETH',
    type: 'evm' as const,
    rpcUrl: 'https://base.llamarpc.com',
    explorerUrl: 'https://basescan.org',
    logoURI: '/chains/base.png',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
] as const;

export const SUPPORTED_SOLANA_CHAINS = [
  {
    id: 'mainnet-beta',
    name: 'Solana',
    symbol: 'SOL',
    type: 'solana' as const,
    cluster: 'mainnet-beta',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    explorerUrl: 'https://explorer.solana.com',
    logoURI: '/chains/solana.png',
    nativeCurrency: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9,
    },
  },
] as const;

// Wallet constants
export const SUPPORTED_WALLETS = {
  EVM: [
    {
      type: 'metamask',
      name: 'MetaMask',
      icon: '/wallets/metamask.svg',
      downloadUrl: 'https://metamask.io',
    },
    {
      type: 'walletconnect',
      name: 'WalletConnect',
      icon: '/wallets/walletconnect.svg',
      downloadUrl: 'https://walletconnect.com',
    },
    {
      type: 'coinbase',
      name: 'Coinbase Wallet',
      icon: '/wallets/coinbase.svg',
      downloadUrl: 'https://wallet.coinbase.com',
    },
    {
      type: 'rainbow',
      name: 'Rainbow',
      icon: '/wallets/rainbow.svg',
      downloadUrl: 'https://rainbow.me',
    },
  ],
  SOLANA: [
    {
      type: 'phantom',
      name: 'Phantom',
      icon: '/wallets/phantom.svg',
      downloadUrl: 'https://phantom.app',
    },
    {
      type: 'solflare',
      name: 'Solflare',
      icon: '/wallets/solflare.svg',
      downloadUrl: 'https://solflare.com',
    },
    {
      type: 'backpack',
      name: 'Backpack',
      icon: '/wallets/backpack.svg',
      downloadUrl: 'https://backpack.app',
    },
    {
      type: 'glow',
      name: 'Glow',
      icon: '/wallets/glow.svg',
      downloadUrl: 'https://glow.app',
    },
  ],
} as const;

// API constants
export const API_ENDPOINTS = {
  TOKENS: '/tokens',
  QUOTE: '/quote',
  SWAP: '/swap',
  HISTORY: '/history',
  STATUS: '/status',
  ANALYTICS: '/analytics',
} as const;

// Default configurations
export const DEFAULT_SWAP_CONFIG = {
  slippage: 0.5,
  deadline: 20, // minutes
  mevProtection: true,
  gasSpeed: 'standard' as const,
} as const;

export const DEFAULT_USER_SETTINGS = {
  defaultSlippage: 0.5,
  defaultDeadline: 20,
  mevProtectionEnabled: true,
  preferredChainType: 'evm' as const,
  theme: 'system' as const,
  currency: 'USD' as const,
  gasSettings: {
    evm: 'standard' as const,
    solana: 1000, // micro lamports
  },
} as const;

// Validation constants
export const VALIDATION_RULES = {
  MIN_TRADE_AMOUNT: 0.000001,
  MAX_SLIPPAGE: 50, // percent
  MIN_SLIPPAGE: 0.01,
  MAX_DEADLINE: 180, // minutes
  MIN_DEADLINE: 1,
  ADDRESS_LENGTH: {
    EVM: 42,
    SOLANA: 44,
  },
} as const;

// Time constants
export const TIME_CONSTANTS = {
  QUOTE_REFRESH_INTERVAL: 10000, // 10 seconds
  SWAP_STATUS_POLL_INTERVAL: 2000, // 2 seconds
  TRANSACTION_TIMEOUT: 300000, // 5 minutes
  QUOTE_VALIDITY: 30000, // 30 seconds
} as const;