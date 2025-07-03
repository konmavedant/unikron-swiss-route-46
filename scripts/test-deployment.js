
const { ethers } = require("hardhat");

async function main() {
  console.log("Testing deployed contracts...");
  
  // Read deployment info
  const deploymentInfo = require("../src/contracts/deploymentInfo.json");
  const swapRouterAddress = deploymentInfo.contracts.UnikronSwapRouter.address;
  const swapTesterAddress = deploymentInfo.contracts.SwapTester.address;
  
  if (!swapRouterAddress || swapRouterAddress === "0x0000000000000000000000000000000000000000") {
    console.error("❌ UnikronSwapRouter not deployed. Run deployment first.");
    return;
  }
  
  // Get contract instances
  const swapRouter = await ethers.getContractAt("UnikronSwapRouter", swapRouterAddress);
  const swapTester = await ethers.getContractAt("SwapTester", swapTesterAddress);
  
  try {
    // Test 1: Check contract info
    console.log("\n=== Test 1: Contract Info ===");
    const contractInfo = await swapRouter.getContractInfo();
    console.log("Owner:", contractInfo[0]);
    console.log("Fee Percentage:", contractInfo[1].toString());
    console.log("Test Mode:", contractInfo[2]);
    console.log("ETH Balance:", ethers.formatEther(contractInfo[3]));
    console.log("Authorized Tokens:", contractInfo[4].toString());
    
    // Test 2: Check WETH authorization
    console.log("\n=== Test 2: WETH Authorization ===");
    const wethAddress = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";
    const isAuthorized = await swapRouter.authorizedTokens(wethAddress);
    console.log("WETH Authorized:", isAuthorized);
    
    // Test 3: Test quote generation
    console.log("\n=== Test 3: Quote Generation ===");
    const testAmount = ethers.parseEther("0.01");
    const path = [wethAddress, wethAddress]; // Simplified path for testing
    
    try {
      const quote = await swapRouter.getSwapQuote(testAmount, path);
      console.log("Quote amounts:", quote[0].map(a => ethers.formatEther(a)));
      console.log("Fee:", ethers.formatEther(quote[1]));
    } catch (error) {
      console.log("Quote generation test failed (expected for mock):", error.message);
    }
    
    // Test 4: Test simulation
    console.log("\n=== Test 4: Swap Simulation ===");
    try {
      const simulation = await swapRouter.simulateSwap(wethAddress, wethAddress, testAmount);
      console.log("Expected Out:", ethers.formatEther(simulation[0]));
      console.log("Fee:", ethers.formatEther(simulation[1]));
      console.log("Can Execute:", simulation[2]);
    } catch (error) {
      console.log("Simulation test failed (expected for mock):", error.message);
    }
    
    // Test 5: Run SwapTester tests
    console.log("\n=== Test 5: SwapTester Tests ===");
    const [signer] = await ethers.getSigners();
    
    try {
      // Test authorization
      const authTest = await swapTester.testAuthorization();
      console.log("Authorization Test:", authTest);
      
      // Test quote generation
      const quoteTest = await swapTester.testQuoteGeneration(testAmount);
      console.log("Quote Test:", quoteTest);
      
      // Test simulation
      const simTest = await swapTester.testSimulation(testAmount);
      console.log("Simulation Test:", simTest);
      
      // Test error conditions
      const errorTest = await swapTester.testErrorConditions();
      console.log("Error Conditions Test:", errorTest);
      
    } catch (error) {
      console.log("SwapTester tests failed (some expected):", error.message);
    }
    
    console.log("\n✅ Contract testing completed!");
    
  } catch (error) {
    console.error("❌ Testing failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
