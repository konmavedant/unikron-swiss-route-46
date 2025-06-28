
import { motion } from "framer-motion";
import { Wallet, ArrowRight, Shield, Globe } from "lucide-react";

const RouteFlowVisual = () => {
  const steps = [
    { icon: Wallet, label: "Your Wallet", color: "bg-green-500" },
    { icon: Shield, label: "UNIKRON Router", color: "bg-unikron-blue" },
    { icon: Globe, label: "Stargate Bridge", color: "bg-purple-500" },
    { icon: Wallet, label: "Recipient", color: "bg-orange-500" }
  ];

  return (
    <div className="relative">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {steps.map((step, index) => (
          <div key={step.label} className="flex flex-col items-center relative">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className={`${step.color} rounded-full p-4 mb-4 shadow-lg`}
            >
              <step.icon className="h-8 w-8 text-white" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 + 0.1 }}
              className="text-sm font-medium text-gray-700 text-center max-w-20"
            >
              {step.label}
            </motion.p>
            
            {index < steps.length - 1 && (
              <>
                <ArrowRight className="absolute top-6 left-24 h-6 w-6 text-gray-400 hidden lg:block" />
                <div className="absolute top-8 left-20 hidden lg:block">
                  <div className="route-particle" style={{ animationDelay: `${index * 0.5}s` }}></div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="text-center mt-12"
      >
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Experience seamless asset routing with institutional-grade security and MEV protection 
          across multiple blockchain networks.
        </p>
      </motion.div>
    </div>
  );
};

export default RouteFlowVisual;
