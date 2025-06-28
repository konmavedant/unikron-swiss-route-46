
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { usePrices } from "@/hooks/usePrices";

interface SwapInterfaceProps {
  amount: string;
  onAmountChange: (amount: string) => void;
  recipientAddress: string;
  onRecipientChange: (address: string) => void;
  isCrossChain: boolean;
  isConnected: boolean;
  fromToken: { symbol: string; chain: string; balance: string; id?: string };
}

const SwapInterface = ({
  amount,
  onAmountChange,
  recipientAddress,
  onRecipientChange,
  isCrossChain,
  isConnected,
  fromToken
}: SwapInterfaceProps) => {
  const { getPriceData, fetchPrices } = usePrices([fromToken.symbol]);
  const priceData = getPriceData(fromToken.symbol);

  useEffect(() => {
    if (fromToken.symbol) {
      fetchPrices([fromToken.symbol]);
    }
  }, [fromToken.symbol, fetchPrices]);

  const handleMaxClick = () => {
    onAmountChange(fromToken.balance || "2.5");
  };

  const usdValue = amount && priceData ? 
    (parseFloat(amount) * priceData.price).toFixed(2) : "0.00";

  return (
    <div className="space-y-4">
      <Card className="border border-gray-200">
        <CardContent className="p-4">
          <Label className="text-sm font-medium text-gray-600 mb-2 block">
            Swap Amount
          </Label>
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
          {amount && priceData && (
            <div className="mt-2 text-sm text-gray-500">
              ≈ ${usdValue} USD
            </div>
          )}
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
        className="w-full bg-unikron-blue hover:bg-unikron-darkblue text-white py-4 text-lg font-semibold"
        disabled={!isConnected || !amount}
      >
        {!isConnected ? "Connect Wallet to Start" : "Start Route"}
      </Button>
    </div>
  );
};

export default SwapInterface;
