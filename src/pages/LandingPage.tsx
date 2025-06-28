
import { motion } from "framer-motion";
import { ChevronDown, Shield, Zap, Globe, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import RegulatoryBanner from "@/components/RegulatoryBanner";
import RouteFlowVisual from "@/components/RouteFlowVisual";

const LandingPage = () => {
  const features = [
    {
      icon: Shield,
      title: "Non-Custodial",
      description: "Your assets remain in your control throughout the entire routing process"
    },
    {
      icon: Zap,
      title: "MEV-Protected",
      description: "Advanced protection against maximal extractable value attacks"
    },
    {
      icon: Globe,
      title: "Cross-Chain Finality",
      description: "Seamless routing across multiple blockchain networks"
    }
  ];

  const regulations = [
    {
      region: "Switzerland (CH)",
      content: "Compliant with Swiss DLT Bill and FINMA guidelines for decentralized financial services. Non-custodial architecture aligns with Swiss regulatory frameworks."
    },
    {
      region: "United States (US)",
      content: "Operates within existing regulatory frameworks. Non-custodial nature reduces regulatory overhead while maintaining compliance with relevant securities laws."
    },
    {
      region: "European Union (EU)",
      content: "Designed to align with MiCA (Markets in Crypto-Assets) regulation and existing financial services directives across EU member states."
    },
    {
      region: "Asia-Pacific",
      content: "Flexible architecture accommodates varying regulatory approaches across APAC jurisdictions while maintaining core compliance principles."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <RegulatoryBanner />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-unikron-gray pt-20 pb-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Swiss Engineered
              <br />
              <span className="text-unikron-blue">for Trust</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 font-light">
              MEV-Protected, Cross-Chain Institutional Routing
            </p>
            <Link to="/app">
              <Button size="lg" className="bg-unikron-blue hover:bg-unikron-darkblue text-white px-8 py-4 text-lg font-medium">
                Launch Routing Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Institutional-Grade Infrastructure
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built with Swiss precision for the future of decentralized finance
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="swiss-card h-full text-center p-8">
                  <CardHeader>
                    <div className="mx-auto mb-4 p-3 bg-unikron-blue/10 rounded-full w-fit">
                      <feature.icon className="h-8 w-8 text-unikron-blue" />
                    </div>
                    <CardTitle className="text-2xl font-semibold text-gray-900">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-lg text-gray-600">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Route Flow Visual */}
      <section className="py-20 bg-unikron-gray">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How UNIKRON Routes Your Assets
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Seamless cross-chain routing with institutional-grade security
            </p>
          </motion.div>
          
          <RouteFlowVisual />
        </div>
      </section>

      {/* Regulatory Synergy */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Global Regulatory Synergy
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Designed for compliance across multiple jurisdictions
            </p>
          </motion.div>
          
          <div className="max-w-4xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {regulations.map((reg, index) => (
                <AccordionItem key={reg.region} value={`item-${index}`} className="swiss-card px-6">
                  <AccordionTrigger className="text-left font-semibold text-lg text-gray-900">
                    {reg.region}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 text-base leading-relaxed">
                    {reg.content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">UNIKRON</h3>
            <p className="text-gray-400 max-w-2xl mx-auto mb-8">
              This routing engine is for educational demo purposes only. 
              Regulations vary by jurisdiction. Please consult with legal professionals 
              before deploying in production environments.
            </p>
            <div className="border-t border-gray-700 pt-8">
              <p className="text-sm text-gray-500">
                © 2024 UNIKRON. Swiss Engineered for Trust.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
