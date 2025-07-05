
const { run } = require("hardhat");

async function main() {
  console.log("Starting contract verification...");
  
  // Read deployment info
  const deploymentInfo = require("../src/contracts/deploymentInfo.json");
  const swapRouterAddress = deploymentInfo.contracts.UnikronSwapRouter.address;
  const swapTesterAddress = deploymentInfo.contracts.SwapTester.address;
  
  if (!swapRouterAddress || swapRouterAddress === "0x0000000000000000000000000000000000000000") {
    console.error("❌ No deployment found. Deploy contracts first.");
    return;
  }
  
  try {
    // Verify UnikronSwapRouter
    console.log("Verifying UnikronSwapRouter...");
    await run("verify:verify", {
      address: swapRouterAddress,
      constructorArguments: [],
    });
    console.log("✅ UnikronSwapRouter verified");
    
    // Verify SwapTester
    console.log("Verifying SwapTester...");
    await run("verify:verify", {
      address: swapTesterAddress,
      constructorArguments: [swapRouterAddress],
    });
    console.log("✅ SwapTester verified");
    
    // Update deployment info
    deploymentInfo.contracts.UnikronSwapRouter.verified = true;
    deploymentInfo.contracts.SwapTester.verified = true;
    
    require("fs").writeFileSync(
      "src/contracts/deploymentInfo.json",
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\n✅ All contracts verified successfully!");
    
  } catch (error) {
    console.error("❌ Verification failed:", error);
    console.log("Note: Verification might fail if contracts were just deployed. Wait a few minutes and try again.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
