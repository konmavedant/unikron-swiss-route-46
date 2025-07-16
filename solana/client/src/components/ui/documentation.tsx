import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from 'framer-motion';
import { 
  Book, 
  Search, 
  ExternalLink, 
  Copy, 
  Code, 
  Shield, 
  Info,
  ChevronRight,
  GitBranch,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Lightbulb,
  Zap
} from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface DocSection {
  id: string;
  title: string;
  description: string;
  category: 'getting-started' | 'api' | 'security' | 'troubleshooting' | 'examples';
  content: React.ReactNode;
  tags: string[];
}

interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  example?: string;
  response?: string;
}

interface CodeExample {
  title: string;
  language: string;
  code: string;
  description?: string;
}

interface DocumentationProps {
  className?: string;
}

export const Documentation = ({ className }: DocumentationProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Code copied successfully",
      duration: 2000,
    });
  };

  const docSections: DocSection[] = [
    {
      id: 'quick-start',
      title: 'Quick Start Guide',
      description: 'Get started with UNIKRON in minutes',
      category: 'getting-started',
      tags: ['setup', 'wallet', 'first-swap'],
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">Getting Started</h4>
            </div>
            <p className="text-blue-700 dark:text-blue-200">
              UNIKRON is a MEV-protected cross-chain DEX aggregator that finds the best rates 
              while protecting your trades from front-running attacks.
            </p>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold">Step 1: Connect Your Wallet</h4>
            <p className="text-muted-foreground">
              Click the "Connect Wallet" button in the top-right corner and select your preferred wallet.
            </p>
            
            <h4 className="font-semibold">Step 2: Select Tokens</h4>
            <p className="text-muted-foreground">
              Choose the token you want to swap from and the token you want to receive.
            </p>
            
            <h4 className="font-semibold">Step 3: Enable MEV Protection</h4>
            <p className="text-muted-foreground">
              Toggle MEV protection to secure your swap from front-running attacks.
            </p>
            
            <h4 className="font-semibold">Step 4: Execute Swap</h4>
            <p className="text-muted-foreground">
              Review the quote and execute your swap with confidence.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'mev-protection',
      title: 'MEV Protection',
      description: 'Understanding our commit-reveal mechanism',
      category: 'security',
      tags: ['mev', 'security', 'commit-reveal'],
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-green-900 dark:text-green-100">Commit-Reveal Protocol</h4>
            </div>
            <p className="text-green-700 dark:text-green-200">
              Our commit-reveal mechanism protects your trades by hiding swap intentions 
              until execution, preventing MEV attacks.
            </p>
          </div>
          
          <Accordion type="single" collapsible>
            <AccordionItem value="how-it-works">
              <AccordionTrigger>How does MEV protection work?</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <p>The commit-reveal protocol works in two phases:</p>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li><strong>Commit Phase:</strong> Your swap intention is encrypted and committed to the blockchain without revealing details.</li>
                    <li><strong>Reveal Phase:</strong> After a short delay, the commitment is revealed and the swap is executed.</li>
                  </ol>
                  <p className="text-muted-foreground">
                    This prevents MEV bots from seeing your transaction in the mempool and front-running your swap.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="when-to-use">
              <AccordionTrigger>When should I enable MEV protection?</AccordionTrigger>
              <AccordionContent>
                <p>MEV protection is recommended for:</p>
                <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                  <li>Large trades that could impact market prices</li>
                  <li>Trades during high volatility periods</li>
                  <li>Swaps involving tokens with low liquidity</li>
                  <li>Any time you want maximum protection</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      ),
    },
    {
      id: 'api-endpoints',
      title: 'API Reference',
      description: 'Complete API documentation for developers',
      category: 'api',
      tags: ['api', 'endpoints', 'development'],
      content: <ApiDocumentation />,
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      description: 'Common issues and solutions',
      category: 'troubleshooting',
      tags: ['issues', 'errors', 'support'],
      content: <TroubleshootingGuide />,
    },
    {
      id: 'code-examples',
      title: 'Code Examples',
      description: 'Integration examples and code snippets',
      category: 'examples',
      tags: ['code', 'integration', 'examples'],
      content: <CodeExamples onCopy={copyToClipboard} />,
    },
  ];

  const filteredSections = docSections.filter(section => {
    const matchesSearch = searchQuery === '' || 
      section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || section.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categoryIcons = {
    'getting-started': Book,
    'api': Code,
    'security': Shield,
    'troubleshooting': AlertTriangle,
    'examples': GitBranch,
  };

  return (
    <div className={cn("max-w-6xl mx-auto space-y-6", className)}>
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Documentation</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Everything you need to know about using UNIKRON's MEV-protected swap platform
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full sm:w-auto">
              <TabsList className="grid grid-cols-3 sm:grid-cols-6 h-auto">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="getting-started" className="text-xs">Getting Started</TabsTrigger>
                <TabsTrigger value="api" className="text-xs">API</TabsTrigger>
                <TabsTrigger value="security" className="text-xs">Security</TabsTrigger>
                <TabsTrigger value="troubleshooting" className="text-xs">Help</TabsTrigger>
                <TabsTrigger value="examples" className="text-xs">Examples</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Documentation Sections */}
      <div className="grid gap-6">
        {filteredSections.map((section, index) => {
          const CategoryIcon = categoryIcons[section.category];
          
          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CategoryIcon className="w-5 h-5 text-primary" />
                        <CardTitle>{section.title}</CardTitle>
                      </div>
                      <p className="text-muted-foreground">{section.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {section.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {section.category.replace('-', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {section.content}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredSections.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No documentation found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or browse all categories.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Sub-components for different documentation sections
const ApiDocumentation = () => {
  const endpoints: APIEndpoint[] = [
    {
      method: 'GET',
      path: '/api/tokens',
      description: 'Get list of supported tokens',
      parameters: [
        { name: 'chain', type: 'string', required: false, description: 'Filter by blockchain' },
        { name: 'limit', type: 'number', required: false, description: 'Maximum number of results' },
      ],
      example: 'GET /api/tokens?chain=ethereum&limit=10',
      response: `{
  "tokens": [
    {
      "address": "0x...",
      "symbol": "ETH",
      "name": "Ethereum",
      "decimals": 18,
      "logoURI": "https://..."
    }
  ]
}`,
    },
    {
      method: 'POST',
      path: '/api/quote',
      description: 'Get swap quote',
      parameters: [
        { name: 'fromToken', type: 'string', required: true, description: 'Source token address' },
        { name: 'toToken', type: 'string', required: true, description: 'Destination token address' },
        { name: 'amount', type: 'string', required: true, description: 'Amount to swap' },
        { name: 'slippage', type: 'number', required: false, description: 'Slippage tolerance (%)' },
      ],
      example: `POST /api/quote
{
  "fromToken": "0x...",
  "toToken": "0x...",
  "amount": "1000000000000000000"
}`,
      response: `{
  "quote": {
    "amountOut": "1500000000",
    "priceImpact": "0.1",
    "route": [...],
    "gasEstimate": "150000"
  }
}`,
    },
  ];

  return (
    <div className="space-y-6">
      {endpoints.map((endpoint, index) => (
        <Card key={index} className="border-l-4 border-l-primary">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant={endpoint.method === 'GET' ? 'default' : 'secondary'}>
                {endpoint.method}
              </Badge>
              <code className="text-sm bg-muted px-2 py-1 rounded">{endpoint.path}</code>
            </div>
            <p className="text-muted-foreground">{endpoint.description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {endpoint.parameters && (
              <div>
                <h4 className="font-semibold mb-2">Parameters</h4>
                <div className="space-y-2">
                  {endpoint.parameters.map((param, i) => (
                    <div key={i} className="flex items-center gap-4 text-sm p-2 bg-muted rounded">
                      <code className="font-mono">{param.name}</code>
                      <Badge variant="outline" className="text-xs">{param.type}</Badge>
                      {param.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                      <span className="text-muted-foreground">{param.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {endpoint.example && (
              <div>
                <h4 className="font-semibold mb-2">Example Request</h4>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                  <code>{endpoint.example}</code>
                </pre>
              </div>
            )}
            
            {endpoint.response && (
              <div>
                <h4 className="font-semibold mb-2">Example Response</h4>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                  <code>{endpoint.response}</code>
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const TroubleshootingGuide = () => {
  const issues = [
    {
      title: "Wallet connection fails",
      solution: "Make sure your wallet extension is installed and unlocked. Try refreshing the page and reconnecting.",
      severity: "common",
    },
    {
      title: "Transaction fails with insufficient gas",
      solution: "Increase gas limit or wait for lower network congestion. Enable MEV protection for better execution.",
      severity: "common",
    },
    {
      title: "Swap quote not loading",
      solution: "Check your internet connection and try again. The token pair might not be supported.",
      severity: "moderate",
    },
    {
      title: "MEV protection timeout",
      solution: "This is rare but can happen during high network congestion. The system will retry automatically.",
      severity: "rare",
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'common': return 'text-red-600 bg-red-50 dark:bg-red-950';
      case 'moderate': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950';
      case 'rare': return 'text-green-600 bg-green-50 dark:bg-green-950';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-950';
    }
  };

  return (
    <div className="space-y-4">
      {issues.map((issue, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold">{issue.title}</h4>
                  <Badge variant="outline" className={cn("text-xs", getSeverityColor(issue.severity))}>
                    {issue.severity}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm">{issue.solution}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const CodeExamples = ({ onCopy }: { onCopy: (code: string) => void }) => {
  const examples: CodeExample[] = [
    {
      title: "Basic Swap Integration",
      language: "typescript",
      description: "How to integrate UNIKRON swap functionality in your dApp",
      code: `import { UnikronSDK } from '@unikron/sdk';

const unikron = new UnikronSDK({
  apiKey: 'your-api-key',
  network: 'mainnet'
});

// Get swap quote
const quote = await unikron.getQuote({
  fromToken: '0xA0b86a33E6d6C...',
  toToken: '0x6B175474E89094C44...',
  amount: '1000000000000000000',
  mevProtection: true
});

// Execute swap
const swap = await unikron.executeSwap({
  quote,
  userAddress: '0x...',
  slippage: 0.5
});`,
    },
    {
      title: "Listen to Swap Events",
      language: "typescript",
      description: "How to listen to swap status updates",
      code: `// Listen to swap events
unikron.on('swapStarted', (data) => {
  console.log('Swap started:', data.swapId);
});

unikron.on('swapCommitted', (data) => {
  console.log('Commitment created:', data.commitmentHash);
});

unikron.on('swapRevealed', (data) => {
  console.log('Intent revealed:', data.revealHash);
});

unikron.on('swapCompleted', (data) => {
  console.log('Swap completed:', data.transactionHash);
});

unikron.on('swapFailed', (error) => {
  console.error('Swap failed:', error.message);
});`,
    },
  ];

  return (
    <div className="space-y-6">
      {examples.map((example, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{example.title}</CardTitle>
                {example.description && (
                  <p className="text-muted-foreground text-sm mt-1">{example.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{example.language}</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCopy(example.code)}
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto">
              <code>{example.code}</code>
            </pre>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};