
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Settings, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import TokenSelector from "@/components/TokenSelector";
import SwapInterface from "@/components/SwapInterface";
import RoutePreview from "@/components/RoutePreview";
import WalletConnector from "@/components/WalletConnector";
import SolanaWalletConnector from "@/components/SolanaWalletConnector";
import BlockchainSelector, { BlockchainType } from "@/components/BlockchainSelector";
import { useDualChainWallet } from "@/hooks/useDualChainWallet";

interface TokenType {
  symbol: string;
  chain: string;
  balance: string;
  id?: string;
}

const RoutingApp = () => {
  const [isCrossChain, setIsCrossChain] = useState(true);
  const [fromToken, setFromToken] = useState<TokenType>({ 
    symbol: "ETH", 
    chain: "Ethereum", 
    balance: "2.5",
    id: "ethereum"
  });
  const [toToken, setToToken] = useState<TokenType>({ 
    symbol: "USDC", 
    chain: "Polygon", 
    balance: "0",
    id: "usd-coin"
  });
  const [amount, setAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  
  const { 
    selectedBlockchain, 
    setSelectedBlockchain, 
    isConnected,
    ethereum,
    solana 
  } = useDualChainWallet();

  const handleFromTokenChange = (token: TokenType) => {
    setFromToken(token);
  };

  const handleToTokenChange = (token: TokenType) => {
    setToToken(token);
  };

  const handleBlockchainChange = (blockchain: BlockchainType) => {
    setSelectedBlockchain(blockchain);
    
    // Update default tokens based on blockchain
    if (blockchain === 'solana') {
      setFromToken({ 
        symbol: "SOL", 
        chain: "Solana", 
        balance: "5.2",
        id: "solana"
      });
      setToToken({ 
        symbol: "USDC", 
        chain: "Solana", 
        balance: "0",
        id: "usd-coin"
      });
    } else {
      setFromToken({ 
        symbol: "ETH", 
        chain: "Ethereum", 
        balance: "2.5",
        id: "ethereum"
      });
      setToToken({ 
        symbol: "USDC", 
        chain: "Polygon", 
        balance: "0",
        id: "usd-coin"
      });
    }
  };

  return (
    <div className="min-h-screen bg-unikron-gray">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Home
              </Link>
              <div className="border-l border-gray-300 pl-4">
                <h1 className="text-2xl font-bold text-gray-900">UNIKRON Router</h1>
                <p className="text-sm text-gray-500">Multi-Chain DeFi Aggregator</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              
              {/* Dual Wallet Connectors */}
              <div className="flex items-center space-x-2">
                {selectedBlockchain === 'ethereum' ? (
                  <WalletConnector 
                    isConnected={ethereum.connected} 
                    onConnectionChange={() => {}} 
                  />
                ) : (
                  <SolanaWalletConnector />
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
          {/* Main Swap Interface */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {/* Blockchain Selector */}
            <BlockchainSelector
              selected={selectedBlockchain}
              onSelect={handleBlockchainChange}
            />

            <Card className="swiss-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-semibold text-gray-900">
                    Asset Router
                  </CardTitle>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-700">Cross-Chain</span>
                    <Switch
                      checked={isCrossChain}
                      onCheckedChange={setIsCrossChain}
                      className="data-[state=checked]:bg-unikron-blue"
                    />
                  </div>
                </div>
                <p className="text-gray-600">
                  {selectedBlockchain === 'ethereum' 
                    ? (isCrossChain ? "Route assets across multiple blockchain networks with live pricing" : "Same-chain routing with live pricing")
                    : "High-speed Solana swaps with Jupiter integration"
                  }
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <TokenSelector
                  label="From"
                  token={fromToken}
                  onTokenChange={handleFromTokenChange}
                  showBalance={true}
                  blockchain={selectedBlockchain}
                />
                
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full p-2 border-2 border-gray-200 hover:border-unikron-blue"
                    onClick={() => {
                      const temp = fromToken;
                      setFromToken(toToken);
                      setToToken(temp);
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                <TokenSelector
                  label="To"
                  token={toToken}
                  onTokenChange={handleToTokenChange}
                  showBalance={false}
                  blockchain={selectedBlockchain}
                />

                <SwapInterface
                  amount={amount}
                  onAmountChange={setAmount}
                  recipientAddress={recipientAddress}
                  onRecipientChange={setRecipientAddress}
                  isCrossChain={isCrossChain}
                  isConnected={isConnected}
                  fromToken={fromToken}
                  blockchain={selectedBlockchain}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Route Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <RoutePreview
              fromToken={fromToken}
              toToken={toToken}
              amount={amount}
              isCrossChain={isCrossChain}
              blockchain={selectedBlockchain}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RoutingApp;
