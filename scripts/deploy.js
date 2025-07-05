
const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Starting deployment process...");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Check balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  
  if (balance < ethers.parseEther("0.1")) {
    console.warn("Warning: Low balance. Make sure you have enough ETH for deployment.");
  }
  
  try {
    // Deploy UnikronSwapRouter
    console.log("\n=== Deploying UnikronSwapRouter ===");
    const UnikronSwapRouter = await ethers.getContractFactory("UnikronSwapRouter");
    
    console.log("Deploying UnikronSwapRouter...");
    const swapRouter = await UnikronSwapRouter.deploy();
    await swapRouter.waitForDeployment();
    
    const swapRouterAddress = await swapRouter.getAddress();
    console.log("✅ UnikronSwapRouter deployed to:", swapRouterAddress);
    
    // Deploy SwapTester
    console.log("\n=== Deploying SwapTester ===");
    const SwapTester = await ethers.getContractFactory("SwapTester");
    
    console.log("Deploying SwapTester...");
    const swapTester = await SwapTester.deploy(swapRouterAddress);
    await swapTester.waitForDeployment();
    
    const swapTesterAddress = await swapTester.getAddress();
    console.log("✅ SwapTester deployed to:", swapTesterAddress);
    
    // Initialize contracts
    console.log("\n=== Initializing Contracts ===");
    
    // Enable test mode
    console.log("Enabling test mode...");
    const testModeTx = await swapRouter.setTestMode(true);
    await testModeTx.wait();
    console.log("✅ Test mode enabled");
    
    // Authorize WETH
    const wethAddress = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14"; // Sepolia WETH
    console.log("Authorizing WETH token...");
    const authTx = await swapRouter.setTokenAuthorization(wethAddress, true);
    await authTx.wait();
    console.log("✅ WETH authorized for trading");
    
    // Update deployment info
    const deploymentInfo = {
      network: "sepolia",
      chainId: 11155111,
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      contracts: {
        UnikronSwapRouter: {
          address: swapRouterAddress,
          deploymentBlock: await ethers.provider.getBlockNumber(),
          verified: false
        },
        SwapTester: {
          address: swapTesterAddress,
          deploymentBlock: await ethers.provider.getBlockNumber(),
          verified: false
        }
      },
      tokens: {
        WETH: wethAddress,
        USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
      },
      externalContracts: {
        UniswapV2Router: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
      }
    };
    
    // Save deployment info
    fs.writeFileSync(
      "src/contracts/deploymentInfo.json",
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\n=== Deployment Summary ===");
    console.log("UnikronSwapRouter:", swapRouterAddress);
    console.log("SwapTester:", swapTesterAddress);
    console.log("Network: Sepolia");
    console.log("Deployer:", deployer.address);
    console.log("\n✅ Deployment completed successfully!");
    
    console.log("\n=== Next Steps ===");
    console.log("1. Verify contracts on Etherscan:");
    console.log(`   npx hardhat verify --network sepolia ${swapRouterAddress}`);
    console.log(`   npx hardhat verify --network sepolia ${swapTesterAddress} ${swapRouterAddress}`);
    console.log("2. Update frontend configuration with new addresses");
    console.log("3. Run tests to ensure everything works correctly");
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
