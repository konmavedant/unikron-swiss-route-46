
import { useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface SlippageSettingsProps {
  slippage: number;
  onSlippageChange: (slippage: number) => void;
}

const SlippageSettings = ({ slippage, onSlippageChange }: SlippageSettingsProps) => {
  const [customSlippage, setCustomSlippage] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const presetSlippages = [0.1, 0.5, 1.0, 2.0];

  const handlePresetClick = (value: number) => {
    onSlippageChange(value);
    setCustomSlippage("");
  };

  const handleCustomSlippage = (value: string) => {
    setCustomSlippage(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0.1 && numValue <= 50) {
      onSlippageChange(numValue);
    }
  };

  const getSlippageColor = (slippageValue: number) => {
    if (slippageValue <= 1) return "text-green-600";
    if (slippageValue <= 3) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          <span className={getSlippageColor(slippage)}>
            {slippage}%
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Slippage Tolerance</Label>
            <p className="text-xs text-gray-500 mt-1">
              Your transaction will revert if the price changes unfavorably by more than this percentage.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {presetSlippages.map((preset) => (
              <Button
                key={preset}
                variant={slippage === preset ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetClick(preset)}
                className="text-sm"
              >
                {preset}%
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Custom (%)</Label>
            <Input
              type="number"
              placeholder="2.0"
              value={customSlippage}
              onChange={(e) => handleCustomSlippage(e.target.value)}
              min="0.1"
              max="50"
              step="0.1"
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Current Setting:</span>
              <Badge variant={slippage <= 1 ? "secondary" : slippage <= 3 ? "outline" : "destructive"}>
                {slippage}% Slippage
              </Badge>
            </div>
            
            {slippage > 5 && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                ⚠️ High slippage tolerance! Your trade may be frontrun.
              </div>
            )}
            
            {slippage < 0.5 && (
              <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                ⚠️ Low slippage tolerance may cause transaction failures.
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SlippageSettings;
