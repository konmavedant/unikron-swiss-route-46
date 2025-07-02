export interface TradeIntent {
  user: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  minOut: number;
  expiry: number;
  nonce: number;
  routeHash: string;
  relayerFee: number;
  relayer: string;
}
