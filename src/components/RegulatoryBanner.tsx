
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

const RegulatoryBanner = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-unikron-blue text-white py-3 px-4"
    >
      <div className="container mx-auto">
        <div className="flex items-center justify-center space-x-6 text-sm font-medium">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Swiss DLT Bill Compliant</span>
          </div>
          <div className="hidden md:block w-px h-4 bg-white/30"></div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Non-Custodial</span>
          </div>
          <div className="hidden md:block w-px h-4 bg-white/30"></div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Multi-Jurisdictional Alignment</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RegulatoryBanner;
