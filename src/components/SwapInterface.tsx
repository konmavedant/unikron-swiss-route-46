
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { usePrices } from "@/hooks/usePrices";
import { useBlockchain } from "@/contexts/BlockchainContext";

interface SwapInterfaceProps {
  amount: string;
  onAmountChange: (amount: string) => void;
  recipientAddress: string;
  onRecipientChange: (address: string) => void;
  isCrossChain: boolean;
  isConnected: boolean;
  fromToken: { symbol: string; chain: string; balance: string; id?: string };
  toToken: { symbol: string; chain: string; balance: string; id?: string };
}

const SwapInterface = ({
  amount,
  onAmountChange,
  recipientAddress,
  onRecipientChange,
  isCrossChain,
  isConnected,
  fromToken,
  toToken
}: SwapInterfaceProps) => {
  const { getPriceData, fetchPrices } = usePrices([fromToken.symbol]);
  const { selectedBlockchain, isSolana, isEthereum } = useBlockchain();
  const [priceError, setPriceError] = useState(false);
  
  const priceData = getPriceData(fromToken.symbol);

  useEffect(() => {
    if (fromToken.symbol) {
      setPriceError(false);
      fetchPrices([fromToken.symbol]).catch((error) => {
        console.error('Failed to fetch prices:', error);
        setPriceError(true);
      });
    }
  }, [fromToken.symbol, fetchPrices]);

  const handleMaxClick = () => {
    onAmountChange(fromToken.balance || "0");
  };

  const usdValue = amount && priceData && !priceError ? 
    (parseFloat(amount) * priceData.price).toFixed(2) : "0.00";

  // Validate addresses based on blockchain
  const validateAddress = (address: string): boolean => {
    if (!address) return true; // Empty is valid (optional field)
    
    if (isSolana) {
      // Basic Solana address validation (44 characters, base58)
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
    } else {
      // Basic Ethereum address validation (42 characters, starts with 0x)
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    }
  };

  const isValidAddress = validateAddress(recipientAddress);
  const isDifferentChain = fromToken.chain !== toToken.chain;
  const showRecipientField = isCrossChain || isDifferentChain;

  const getPlaceholderText = () => {
    if (isSolana) {
      return "Enter Solana address (base58)";
    }
    return "Enter Ethereum address (0x...)";
  };

  const getButtonText = () => {
    if (!isConnected) return "Connect Wallet to Start";
    if (!amount) return "Enter Amount";
    if (showRecipientField && recipientAddress && !isValidAddress) {
      return `Invalid ${selectedBlockchain} Address`;
    }
    if (isSolana) return "Route on Solana";
    return "Start Route";
  };

  const isButtonDisabled = () => {
    if (!isConnected || !amount) return true;
    if (showRecipientField && recipientAddress && !isValidAddress) return true;
    return false;
  };

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
          {amount && (
            <div className="mt-2 text-sm text-gray-500">
              {priceError ? (
                <span className="text-yellow-600">Price data unavailable</span>
              ) : (
                <span>≈ ${usdValue} USD</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {showRecipientField && (
        <Card className="border border-gray-200">
          <CardContent className="p-4">
            <Label className="text-sm font-medium text-gray-600 mb-2 block">
              Recipient Address (Optional)
            </Label>
            <Input
              placeholder={getPlaceholderText()}
              value={recipientAddress}
              onChange={(e) => onRecipientChange(e.target.value)}
              className={`font-mono text-sm ${
                recipientAddress && !isValidAddress ? 'border-red-300 bg-red-50' : ''
              }`}
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">
                Leave empty to use your connected wallet address
              </p>
              {recipientAddress && !isValidAddress && (
                <p className="text-xs text-red-600">
                  Invalid {selectedBlockchain} address format
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        size="lg"
        className="w-full bg-unikron-blue hover:bg-unikron-darkblue text-white py-4 text-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
        disabled={isButtonDisabled()}
      >
        {getButtonText()}
      </Button>

      {isSolana && (
        <div className="text-xs text-gray-500 text-center">
          Powered by Jupiter Protocol for optimal Solana routing
        </div>
      )}
    </div>
  );
};

export default SwapInterface;
