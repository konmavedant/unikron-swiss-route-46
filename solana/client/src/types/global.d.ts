// Global type declarations for the project

// Environment variables
declare global {
  interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_WALLET_CONNECT_PROJECT_ID: string;
    readonly VITE_SOLANA_RPC_URL: string;
    readonly VITE_ALCHEMY_API_KEY: string;
    readonly VITE_ENVIRONMENT: 'development' | 'staging' | 'production';
    readonly VITE_ENABLE_ANALYTICS: string;
    readonly VITE_SENTRY_DSN: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

// Window object extensions
declare global {
  interface Window {
    ethereum?: any;
    solana?: any;
    phantom?: {
      solana?: any;
    };
    solflare?: any;
    backpack?: any;
    glow?: any;
  }
}

// Module declarations for assets
declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}

declare module '*.ico' {
  const content: string;
  export default content;
}

declare module '*.woff' {
  const content: string;
  export default content;
}

declare module '*.woff2' {
  const content: string;
  export default content;
}

// CSS modules
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// Export empty object to make this a module
export {};