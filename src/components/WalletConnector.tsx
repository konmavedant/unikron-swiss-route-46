
import { useState } from "react";
import { Wallet, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WalletConnectorProps {
  isConnected: boolean;
  onConnectionChange: (connected: boolean) => void;
}

const WalletConnector = ({ isConnected, onConnectionChange }: WalletConnectorProps) => {
  const [connectedWallet, setConnectedWallet] = useState<string>("");

  const wallets = [
    { name: "MetaMask", type: "EVM", icon: "🦊" },
    { name: "WalletConnect", type: "EVM", icon: "🔗" },
    { name: "Phantom", type: "Solana", icon: "👻" },
    { name: "Solflare", type: "Solana", icon: "☀️" }
  ];

  const handleConnect = (walletName: string) => {
    setConnectedWallet(walletName);
    onConnectionChange(true);
  };

  const handleDisconnect = () => {
    setConnectedWallet("");
    onConnectionChange(false);
  };

  if (isConnected) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center space-x-2">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">
              {connectedWallet} Connected
            </span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48 bg-white border border-gray-200 shadow-lg">
          <DropdownMenuItem onClick={handleDisconnect} className="text-red-600 hover:text-red-700 hover:bg-red-50">
            Disconnect Wallet
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-unikron-blue hover:bg-unikron-darkblue text-white">
          <Wallet className="h-4 w-4 mr-2" />
          Connect Wallet
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 bg-white border border-gray-200 shadow-lg">
        <div className="p-2">
          <p className="text-sm font-medium text-gray-900 mb-2">Choose Wallet</p>
          {wallets.map((wallet) => (
            <DropdownMenuItem
              key={wallet.name}
              onClick={() => handleConnect(wallet.name)}
              className="p-3 cursor-pointer hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3 w-full">
                <span className="text-lg">{wallet.icon}</span>
                <div>
                  <div className="font-medium text-gray-900">{wallet.name}</div>
                  <div className="text-sm text-gray-500">{wallet.type}</div>
                </div>
              </div>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WalletConnector;
