import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function for formatting numbers
export function formatNumber(
  value: number, 
  decimals: number = 2, 
  compact: boolean = false
): string {
  if (value === 0) return '0';
  
  if (compact && value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  
  if (compact && value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  
  if (value < 0.0001 && value > 0) {
    return '< 0.0001';
  }
  
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Format USD value
export function formatUSDValue(value: number): string {
  if (value === 0) return '$0.00';
  
  if (value < 0.01) {
    return '< $0.01';
  }
  
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  }
  
  return `$${value.toFixed(2)}`;
}

// Truncate address for display
export function truncateAddress(
  address: string,
  startLength: number = 6,
  endLength: number = 4
): string {
  if (address.length <= startLength + endLength) {
    return address;
  }
  
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}
