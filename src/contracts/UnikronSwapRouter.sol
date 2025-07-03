
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IERC20.sol";
import "./IUniswapV2Router.sol";

contract UnikronSwapRouter {
    address public owner;
    address public constant UNISWAP_V2_ROUTER = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D; // Mainnet address, use Sepolia equivalent
    address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2; // Mainnet WETH, use Sepolia equivalent
    
    uint256 public constant MAX_INT = 2**256 - 1;
    uint256 public feePercentage = 25; // 0.25% fee (25/10000)
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public constant MIN_SWAP_AMOUNT = 1000; // Minimum swap amount (in wei)
    uint256 public constant MAX_SWAP_AMOUNT = 1000 ether; // Maximum swap amount
    
    IUniswapV2Router private uniswapRouter;
    
    mapping(address => bool) public authorizedTokens;
    mapping(address => uint256) public tokenBalances;
    mapping(address => bool) public authorizedRelayers;
    mapping(bytes32 => bool) public processedSwaps; // Prevent duplicate swaps
    
    // Test mode variables
    bool public testMode = false;
    mapping(address => uint256) public mockBalances;
    mapping(address => uint256) public mockPrices; // Price in USD with 8 decimals
    
    event SwapExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 fee,
        bytes32 swapId
    );
    
    event CrossChainSwapInitiated(
        address indexed user,
        address indexed tokenIn,
        uint256 amountIn,
        uint256 targetChainId,
        address targetAddress,
        bytes32 swapId
    );
    
    event FeesCollected(address indexed token, uint256 amount, address collector);
    event TokenAuthorized(address indexed token, bool authorized);
    event RelayerAuthorized(address indexed relayer, bool authorized);
    event TestModeToggled(bool enabled);
    event SwapQuoteGenerated(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 expectedOut,
        uint256 fee
    );
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier validToken(address token) {
        require(authorizedTokens[token] || token == WETH, "Token not authorized");
        _;
    }
    
    modifier authorizedRelayer() {
        require(authorizedRelayers[msg.sender] || msg.sender == owner, "Not authorized relayer");
        _;
    }
    
    modifier validSwapAmount(uint256 amount) {
        require(amount >= MIN_SWAP_AMOUNT && amount <= MAX_SWAP_AMOUNT, "Invalid swap amount");
        _;
    }
    
    modifier nonReentrant() {
        // Simple reentrancy guard
        require(!_locked, "Reentrant call");
        _locked = true;
        _;
        _locked = false;
    }
    
    bool private _locked;
    
    constructor() {
        owner = msg.sender;
        uniswapRouter = IUniswapV2Router(UNISWAP_V2_ROUTER);
        
        // Pre-authorize common tokens (you'll need to set actual Sepolia addresses)
        authorizedTokens[WETH] = true;
        authorizedRelayers[msg.sender] = true;
        
        // Initialize mock prices for testing (8 decimals)
        mockPrices[WETH] = 250000000000; // $2500 ETH
    }
    
    // Test mode functions
    function setTestMode(bool _testMode) external onlyOwner {
        testMode = _testMode;
        emit TestModeToggled(_testMode);
    }
    
    function setMockBalance(address token, uint256 balance) external onlyOwner {
        require(testMode, "Test mode not enabled");
        mockBalances[token] = balance;
    }
    
    function setMockPrice(address token, uint256 price) external onlyOwner {
        require(testMode, "Test mode not enabled");
        mockPrices[token] = price;
    }
    
    function getMockBalance(address token, address user) external view returns (uint256) {
        if (testMode) {
            return mockBalances[token];
        }
        return IERC20(token).balanceOf(user);
    }
    
    // Authorization functions
    function setTokenAuthorization(address token, bool authorized) external onlyOwner {
        authorizedTokens[token] = authorized;
        emit TokenAuthorized(token, authorized);
    }
    
    function setRelayerAuthorization(address relayer, bool authorized) external onlyOwner {
        authorizedRelayers[relayer] = authorized;
        emit RelayerAuthorized(relayer, authorized);
    }
    
    function setFeePercentage(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 1000, "Fee cannot exceed 10%"); // Max 10% fee
        feePercentage = _feePercentage;
    }
    
    // Enhanced swap functions
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external 
        validToken(path[0]) 
        validToken(path[path.length - 1]) 
        validSwapAmount(amountIn)
        nonReentrant
        returns (uint256[] memory amounts) 
    {
        require(path.length >= 2, "Invalid path");
        require(deadline >= block.timestamp, "Transaction expired");
        require(to != address(0), "Invalid recipient");
        
        address tokenIn = path[0];
        address tokenOut = path[path.length - 1];
        bytes32 swapId = keccak256(abi.encodePacked(msg.sender, tokenIn, tokenOut, amountIn, block.timestamp));
        require(!processedSwaps[swapId], "Swap already processed");
        
        // Calculate fee
        uint256 feeAmount = (amountIn * feePercentage) / FEE_DENOMINATOR;
        uint256 swapAmount = amountIn - feeAmount;
        
        if (testMode) {
            // Mock swap for testing
            require(mockBalances[tokenIn] >= amountIn, "Insufficient mock balance");
            mockBalances[tokenIn] -= amountIn;
            
            // Mock calculation - simplified
            uint256 mockAmountOut = (swapAmount * mockPrices[tokenOut]) / mockPrices[tokenIn];
            mockBalances[tokenOut] += mockAmountOut;
            
            amounts = new uint256[](2);
            amounts[0] = swapAmount;
            amounts[1] = mockAmountOut;
            
            processedSwaps[swapId] = true;
            emit SwapExecuted(msg.sender, tokenIn, tokenOut, amountIn, mockAmountOut, feeAmount, swapId);
            return amounts;
        }
        
        // Real swap logic
        require(IERC20(tokenIn).balanceOf(msg.sender) >= amountIn, "Insufficient balance");
        
        // Transfer tokens from user
        require(IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn), "Transfer failed");
        
        // Store fee
        tokenBalances[tokenIn] += feeAmount;
        
        // Approve router to spend tokens
        require(IERC20(tokenIn).approve(UNISWAP_V2_ROUTER, swapAmount), "Approval failed");
        
        // Execute swap
        amounts = uniswapRouter.swapExactTokensForTokens(
            swapAmount,
            amountOutMin,
            path,
            to,
            deadline
        );
        
        processedSwaps[swapId] = true;
        emit SwapExecuted(msg.sender, tokenIn, tokenOut, amountIn, amounts[amounts.length - 1], feeAmount, swapId);
        
        return amounts;
    }
    
    function swapETHForExactTokens(
        uint256 amountOut,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external 
        payable 
        validToken(path[path.length - 1]) 
        validSwapAmount(msg.value)
        nonReentrant
        returns (uint256[] memory amounts) 
    {
        require(path[0] == WETH, "First token must be WETH");
        require(msg.value > 0, "Must send ETH");
        require(deadline >= block.timestamp, "Transaction expired");
        require(to != address(0), "Invalid recipient");
        
        bytes32 swapId = keccak256(abi.encodePacked(msg.sender, WETH, path[path.length - 1], msg.value, block.timestamp));
        require(!processedSwaps[swapId], "Swap already processed");
        
        // Calculate fee
        uint256 feeAmount = (msg.value * feePercentage) / FEE_DENOMINATOR;
        uint256 swapAmount = msg.value - feeAmount;
        
        if (testMode) {
            // Mock swap for testing
            uint256 mockAmountIn = (amountOut * mockPrices[WETH]) / mockPrices[path[path.length - 1]];
            require(swapAmount >= mockAmountIn, "Insufficient ETH for mock swap");
            
            amounts = new uint256[](2);
            amounts[0] = mockAmountIn;
            amounts[1] = amountOut;
            
            // Refund excess ETH
            uint256 refundAmount = swapAmount - mockAmountIn;
            if (refundAmount > 0) {
                payable(msg.sender).transfer(refundAmount);
            }
            
            processedSwaps[swapId] = true;
            emit SwapExecuted(msg.sender, WETH, path[path.length - 1], mockAmountIn, amountOut, feeAmount, swapId);
            return amounts;
        }
        
        // Store ETH fee
        tokenBalances[WETH] += feeAmount;
        
        // Execute swap
        amounts = uniswapRouter.swapETHForExactTokens{value: swapAmount}(
            amountOut,
            path,
            to,
            deadline
        );
        
        // Refund excess ETH
        uint256 refundAmount = swapAmount - amounts[0];
        if (refundAmount > 0) {
            payable(msg.sender).transfer(refundAmount);
        }
        
        processedSwaps[swapId] = true;
        emit SwapExecuted(msg.sender, WETH, path[path.length - 1], amounts[0], amountOut, feeAmount, swapId);
        
        return amounts;
    }
    
    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external 
        validToken(path[0]) 
        validSwapAmount(amountIn)
        nonReentrant
        returns (uint256[] memory amounts) 
    {
        require(path[path.length - 1] == WETH, "Last token must be WETH");
        require(amountIn > 0, "Amount must be greater than 0");
        require(deadline >= block.timestamp, "Transaction expired");
        require(to != address(0), "Invalid recipient");
        
        address tokenIn = path[0];
        bytes32 swapId = keccak256(abi.encodePacked(msg.sender, tokenIn, WETH, amountIn, block.timestamp));
        require(!processedSwaps[swapId], "Swap already processed");
        
        // Calculate fee
        uint256 feeAmount = (amountIn * feePercentage) / FEE_DENOMINATOR;
        uint256 swapAmount = amountIn - feeAmount;
        
        if (testMode) {
            // Mock swap for testing
            require(mockBalances[tokenIn] >= amountIn, "Insufficient mock balance");
            mockBalances[tokenIn] -= amountIn;
            
            uint256 mockAmountOut = (swapAmount * mockPrices[tokenIn]) / mockPrices[WETH];
            
            amounts = new uint256[](2);
            amounts[0] = swapAmount;
            amounts[1] = mockAmountOut;
            
            processedSwaps[swapId] = true;
            emit SwapExecuted(msg.sender, tokenIn, WETH, amountIn, mockAmountOut, feeAmount, swapId);
            return amounts;
        }
        
        // Transfer tokens from user
        require(IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn), "Transfer failed");
        
        // Store fee
        tokenBalances[tokenIn] += feeAmount;
        
        // Approve router to spend tokens
        require(IERC20(tokenIn).approve(UNISWAP_V2_ROUTER, swapAmount), "Approval failed");
        
        // Execute swap
        amounts = uniswapRouter.swapExactTokensForETH(
            swapAmount,
            amountOutMin,
            path,
            to,
            deadline
        );
        
        processedSwaps[swapId] = true;
        emit SwapExecuted(msg.sender, tokenIn, WETH, amountIn, amounts[amounts.length - 1], feeAmount, swapId);
        
        return amounts;
    }
    
    // Enhanced cross-chain swap initiation
    function initiateCrossChainSwap(
        address tokenIn,
        uint256 amountIn,
        uint256 targetChainId,
        address targetAddress,
        bytes calldata bridgeData
    ) external 
        payable 
        validToken(tokenIn) 
        validSwapAmount(amountIn)
        nonReentrant
    {
        require(amountIn > 0, "Amount must be greater than 0");
        require(targetChainId != block.chainid, "Cannot bridge to same chain");
        require(targetAddress != address(0), "Invalid target address");
        
        bytes32 swapId = keccak256(abi.encodePacked(msg.sender, tokenIn, amountIn, targetChainId, block.timestamp));
        require(!processedSwaps[swapId], "Swap already processed");
        
        // Calculate fee
        uint256 feeAmount = (amountIn * feePercentage) / FEE_DENOMINATOR;
        uint256 bridgeAmount = amountIn - feeAmount;
        
        if (tokenIn == WETH) {
            require(msg.value >= amountIn, "Insufficient ETH sent");
            tokenBalances[WETH] += feeAmount;
        } else {
            require(IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn), "Transfer failed");
            tokenBalances[tokenIn] += feeAmount;
        }
        
        processedSwaps[swapId] = true;
        
        // Emit event for cross-chain bridge to pick up
        emit CrossChainSwapInitiated(msg.sender, tokenIn, bridgeAmount, targetChainId, targetAddress, swapId);
        
        // Here you would integrate with actual bridge protocols like LayerZero, Wormhole, etc.
    }
    
    // Enhanced quote function
    function getSwapQuote(
        uint256 amountIn,
        address[] calldata path
    ) external view returns (uint256[] memory amounts, uint256 fee) {
        require(path.length >= 2, "Invalid path");
        require(amountIn > 0, "Amount must be greater than 0");
        
        fee = (amountIn * feePercentage) / FEE_DENOMINATOR;
        uint256 swapAmount = amountIn - fee;
        
        if (testMode) {
            // Mock quote calculation
            amounts = new uint256[](2);
            amounts[0] = swapAmount;
            amounts[1] = (swapAmount * mockPrices[path[path.length - 1]]) / mockPrices[path[0]];
            return (amounts, fee);
        }
        
        amounts = uniswapRouter.getAmountsOut(swapAmount, path);
        return (amounts, fee);
    }
    
    // Test functions for simulation
    function simulateSwap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 expectedOut, uint256 fee, bool canExecute) {
        fee = (amountIn * feePercentage) / FEE_DENOMINATOR;
        uint256 swapAmount = amountIn - fee;
        
        if (testMode) {
            expectedOut = (swapAmount * mockPrices[tokenOut]) / mockPrices[tokenIn];
            canExecute = mockBalances[tokenIn] >= amountIn;
        } else {
            canExecute = authorizedTokens[tokenIn] && authorizedTokens[tokenOut];
            expectedOut = swapAmount; // Simplified - would need actual price oracle
        }
        
        return (expectedOut, fee, canExecute);
    }
    
    // Emergency and management functions
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            require(address(this).balance >= amount, "Insufficient ETH balance");
            payable(owner).transfer(amount);
        } else {
            require(IERC20(token).balanceOf(address(this)) >= amount, "Insufficient token balance");
            require(IERC20(token).transfer(owner, amount), "Transfer failed");
        }
    }
    
    function collectFees(address token) external onlyOwner {
        uint256 amount = tokenBalances[token];
        require(amount > 0, "No fees to collect");
        
        tokenBalances[token] = 0;
        
        if (token == WETH) {
            require(address(this).balance >= amount, "Insufficient ETH balance");
            payable(owner).transfer(amount);
        } else {
            require(IERC20(token).transfer(owner, amount), "Transfer failed");
        }
        
        emit FeesCollected(token, amount, owner);
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        owner = newOwner;
    }
    
    // View functions
    function getContractInfo() external view returns (
        address contractOwner,
        uint256 currentFeePercentage,
        bool isTestMode,
        uint256 contractETHBalance,
        uint256 totalAuthorizedTokens
    ) {
        contractOwner = owner;
        currentFeePercentage = feePercentage;
        isTestMode = testMode;
        contractETHBalance = address(this).balance;
        
        // Count authorized tokens (simplified)
        totalAuthorizedTokens = 1; // At least WETH is authorized
    }
    
    function isSwapProcessed(bytes32 swapId) external view returns (bool) {
        return processedSwaps[swapId];
    }
    
    // Receive ETH
    receive() external payable {
        // Accept ETH deposits
    }
    
    fallback() external payable {
        // Accept ETH deposits
    }
}
