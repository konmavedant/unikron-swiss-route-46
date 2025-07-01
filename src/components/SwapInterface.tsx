
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { usePrices } from "@/hooks/usePrices";
import SlippageSettings from "./SlippageSettings";
import type { BlockchainType } from "./BlockchainSelector";

interface SwapInterfaceProps {
  amount: string;
  onAmountChange: (amount: string) => void;
  recipientAddress: string;
  onRecipientChange: (address: string) => void;
  isCrossChain: boolean;
  isConnected: boolean;
  fromToken: { symbol: string; chain: string; balance: string; id?: string };
  blockchain: BlockchainType;
}

const SwapInterface = ({
  amount,
  onAmountChange,
  recipientAddress,
  onRecipientChange,
  isCrossChain,
  isConnected,
  fromToken,
  blockchain
}: SwapInterfaceProps) => {
  const symbols = useMemo(() => [fromToken.symbol], [fromToken.symbol]);
  const { getPriceData } = usePrices(symbols);
  const priceData = getPriceData(fromToken.symbol);
  const [slippage, setSlippage] = useState(2.0); // Default 2% slippage

  const handleMaxClick = () => {
    onAmountChange(fromToken.balance || "2.5");
  };

  const usdValue = useMemo(() => {
    return amount && priceData ? 
      (parseFloat(amount) * priceData.price).toFixed(2) : "0.00";
  }, [amount, priceData?.price]);

  const estimatedMinReceived = useMemo(() => {
    if (!amount || !priceData) return "0.00";
    const baseAmount = parseFloat(amount) * priceData.price;
    const slippageAmount = baseAmount * (slippage / 100);
    return (baseAmount - slippageAmount).toFixed(4);
  }, [amount, priceData?.price, slippage]);

  const getNetworkFee = () => {
    return blockchain === 'solana' ? '~0.0001 SOL' : '~0.01 ETH';
  };

  const getNetworkName = () => {
    return blockchain === 'solana' ? 'Solana Devnet' : 'Sepolia Testnet';
  };

  return (
    <div className="space-y-4">
      <Card className="border border-gray-200">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <Label className="text-sm font-medium text-gray-600">
              Swap Amount
            </Label>
            <SlippageSettings 
              slippage={slippage} 
              onSlippageChange={setSlippage}
            />
          </div>
          <div className="relative">
            <Input
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              className="text-2xl font-semibold pr-16 border-0 bg-transparent text-gray-900 placeholder:text-gray-400"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMaxClick}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-unikron-blue hover:text-unikron-darkblue"
            >
              MAX
            </Button>
          </div>
          <div className="mt-3 space-y-1">
            {amount && priceData && (
              <div className="text-sm text-gray-500">
                ≈ ${usdValue} USD
              </div>
            )}
            {amount && priceData && (
              <div className="text-xs text-gray-400 flex justify-between">
                <span>Minimum received (after {slippage}% slippage):</span>
                <span className="font-medium">${estimatedMinReceived}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isCrossChain && (
        <Card className="border border-gray-200">
          <CardContent className="p-4">
            <Label className="text-sm font-medium text-gray-600 mb-2 block">
              Recipient Address (Optional)
            </Label>
            <Input
              placeholder="Enter recipient address or use connected wallet"
              value={recipientAddress}
              onChange={(e) => onRecipientChange(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-2">
              Leave empty to use your connected wallet address
            </p>
          </CardContent>
        </Card>
      )}

      <Button
        size="lg"
        className={`w-full py-4 text-lg font-semibold ${
          blockchain === 'solana' 
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' 
            : 'bg-unikron-blue hover:bg-unikron-darkblue'
        } text-white`}
        disabled={!isConnected || !amount}
      >
        {!isConnected 
          ? `Connect ${blockchain === 'solana' ? 'Solana' : 'Ethereum'} Wallet` 
          : `Start ${blockchain === 'solana' ? 'Solana' : 'EVM'} Route`
        }
      </Button>
      
      {amount && (
        <div className="text-xs text-gray-500 text-center space-y-1">
          <div>Network Fee: {getNetworkFee()} | UNIKRON Fee: 0.25%</div>
          <div>Max Slippage: {slippage}% | Optimized for {getNetworkName()}</div>
        </div>
      )}
    </div>
  );
};

export default SwapInterface;
