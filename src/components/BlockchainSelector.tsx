
import { Button } from "@/components/ui/button";
import { useBlockchain, BlockchainType } from "@/contexts/BlockchainContext";

const BlockchainSelector = () => {
  const { selectedBlockchain, setSelectedBlockchain } = useBlockchain();

  const blockchains: Array<{ type: BlockchainType; name: string; icon: string }> = [
    { type: 'ethereum', name: 'Ethereum', icon: '🔷' },
    { type: 'solana', name: 'Solana', icon: '🌞' }
  ];

  return (
    <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
      {blockchains.map((blockchain) => (
        <Button
          key={blockchain.type}
          variant={selectedBlockchain === blockchain.type ? "default" : "ghost"}
          size="sm"
          onClick={() => setSelectedBlockchain(blockchain.type)}
          className={`flex items-center space-x-2 px-3 py-2 ${
            selectedBlockchain === blockchain.type
              ? "bg-white shadow-sm text-gray-900"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <span className="text-sm">{blockchain.icon}</span>
          <span className="text-sm font-medium">{blockchain.name}</span>
        </Button>
      ))}
    </div>
  );
};

export default BlockchainSelector;
