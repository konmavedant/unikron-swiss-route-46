
# UNIKRON Swap Router Deployment Guide

## Prerequisites
1. Install Hardhat or Foundry
2. Set up Sepolia testnet configuration
3. Get Sepolia ETH from faucet
4. Configure environment variables

## Sepolia Testnet Addresses (for reference)
- Uniswap V2 Router: 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
- WETH: 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14
- USDC: (You'll need to find or deploy a test USDC contract)

## Deployment Steps

### Using Hardhat:

1. Initialize project:
```bash
npm install --save-dev hardhat @nomiclabs/hardhat-ethers ethers
npx hardhat init
```

2. Configure hardhat.config.js:
```javascript
require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.19",
  networks: {
    sepolia: {
      url: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
      accounts: ["YOUR_PRIVATE_KEY"]
    }
  }
};
```

3. Create deployment script (scripts/deploy.js):
```javascript
async function main() {
  const UnikronSwapRouter = await ethers.getContractFactory("UnikronSwapRouter");
  const router = await UnikronSwapRouter.deploy();
  await router.deployed();
  
  console.log("UnikronSwapRouter deployed to:", router.address);
  
  // Authorize common tokens
  const wethAddress = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14"; // Sepolia WETH
  await router.setTokenAuthorization(wethAddress, true);
  
  console.log("WETH authorized for trading");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

4. Deploy:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Contract Verification
After deployment, verify on Etherscan:
```bash
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS
```

## Expected Deployment Output
The deployment will provide:
- Contract Address
- Transaction Hash
- Block Number
- Gas Used

## Integration with Frontend
After deployment, update the frontend with:
1. Contract Address
2. ABI (from artifacts/contracts/UnikronSwapRouter.sol/UnikronSwapRouter.json)
3. Network configuration
