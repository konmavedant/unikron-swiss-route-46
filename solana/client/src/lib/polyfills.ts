// src/lib/polyfills.ts
// Polyfills for Solana Web3.js compatibility in browser

// Buffer polyfill
import { Buffer } from 'buffer';
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  (window as any).global = window;
}

// Process polyfill for environment variables
if (typeof process === 'undefined') {
  (globalThis as any).process = {
    env: {},
    version: '18.0.0',
    platform: 'browser',
    nextTick: (cb: Function) => setTimeout(cb, 0)
  };
}

export {};