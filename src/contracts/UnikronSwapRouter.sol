// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IERC20.sol";
import "./IUniswapV2Router.sol";

contract UnikronSwapRouter {
    address public owner;
    address public constant UNISWAP_V2_ROUTER = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D; // Works on Sepolia
    address public constant WETH = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14; // Sepolia WETH
    
    uint256 public constant MAX_INT = 2**256 - 1;
    uint256 public feePercentage = 25; // 0.25% fee (25/10000)
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public constant MAX_SLIPPAGE = 5000; // 50% max slippage protection
    
    IUniswapV2Router private uniswapRouter;
    
    mapping(address => bool) public authorizedTokens;
    mapping(address => uint256) public tokenBalances;
    
    // Sepolia testnet token addresses for easy testing
    address public constant SEPOLIA_USDC = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238; // Sepolia USDC (if available)
    address public constant SEPOLIA_DAI = 0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6; // Sepolia DAI (if available)
    
    event SwapExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 fee,
        uint256 slippageUsed
    );
    
    event CrossChainSwapInitiated(
        address indexed user,
        address indexed tokenIn,
        uint256 amountIn,
        uint256 targetChainId,
        address targetAddress
    );
    
    event FeesCollected(address indexed token, uint256 amount);
    event TokenAuthorized(address indexed token, bool authorized);
    event SlippageExceeded(address indexed user, uint256 expectedAmount, uint256 actualAmount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier validToken(address token) {
        require(authorizedTokens[token] || token == WETH, "Token not authorized");
        _;
    }
    
    modifier validSlippage(uint256 slippageBps) {
        require(slippageBps <= MAX_SLIPPAGE, "Slippage too high");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        uniswapRouter = IUniswapV2Router(UNISWAP_V2_ROUTER);
        
        // Pre-authorize tokens for Sepolia testing
        authorizedTokens[WETH] = true;
        if (SEPOLIA_USDC != address(0)) {
            authorizedTokens[SEPOLIA_USDC] = true;
        }
        if (SEPOLIA_DAI != address(0)) {
            authorizedTokens[SEPOLIA_DAI] = true;
        }
    }
    
    // Calculate minimum amount out based on slippage tolerance
    function calculateMinAmountOut(
        uint256 amountOut,
        uint256 slippageBps
    ) public pure returns (uint256) {
        return (amountOut * (FEE_DENOMINATOR - slippageBps)) / FEE_DENOMINATOR;
    }
    
    // Helper function to calculate fees and swap amounts
    function _calculateFeeAndSwapAmount(uint256 amountIn) 
        private 
        view 
        returns (uint256 feeAmount, uint256 swapAmount) 
    {
        feeAmount = (amountIn * feePercentage) / FEE_DENOMINATOR;
        swapAmount = amountIn - feeAmount;
    }
    
    // Helper function to handle token transfers and fee storage
    function _handleTokenTransferAndFee(
        address tokenIn, 
        uint256 amountIn, 
        uint256 feeAmount, 
        uint256 swapAmount
    ) private {
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        tokenBalances[tokenIn] += feeAmount;
        IERC20(tokenIn).approve(UNISWAP_V2_ROUTER, swapAmount);
    }
    
    // Helper function to calculate and check slippage
    function _calculateAndCheckSlippage(
        uint256 expectedAmount,
        uint256 actualAmount,
        uint256 slippageBps
    ) private view returns (uint256 actualSlippage) {
        if (expectedAmount > actualAmount) {
            actualSlippage = ((expectedAmount - actualAmount) * FEE_DENOMINATOR) / expectedAmount;
        } else {
            actualSlippage = 0;
        }
        
        if (actualSlippage > slippageBps) {
            emit SlippageExceeded(msg.sender, expectedAmount, actualAmount);
        }
    }
    
    // Enhanced swap function with slippage protection (refactored)
    function swapExactTokensForTokensWithSlippage(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline,
        uint256 slippageBps
    ) public 
        validToken(path[0]) 
        validToken(path[path.length - 1]) 
        validSlippage(slippageBps)
        returns (uint256[] memory amounts) 
    {
        require(path.length >= 2, "Invalid path");
        require(amountIn > 0, "Amount must be greater than 0");
        require(deadline >= block.timestamp, "Transaction expired");
        
        // Calculate fee and swap amounts
        (uint256 feeAmount, uint256 swapAmount) = _calculateFeeAndSwapAmount(amountIn);
        
        // Get expected output and calculate minimum amount out
        uint256[] memory expectedAmounts = uniswapRouter.getAmountsOut(swapAmount, path);
        uint256 minAmountOut = calculateMinAmountOut(expectedAmounts[expectedAmounts.length - 1], slippageBps);
        uint256 finalMinAmountOut = amountOutMin > minAmountOut ? amountOutMin : minAmountOut;
        
        // Handle token transfers and fees
        _handleTokenTransferAndFee(path[0], amountIn, feeAmount, swapAmount);
        
        // Execute swap
        amounts = uniswapRouter.swapExactTokensForTokens(
            swapAmount,
            finalMinAmountOut,
            path,
            to,
            deadline
        );
        
        // Calculate and check slippage
        uint256 actualSlippage = _calculateAndCheckSlippage(
            expectedAmounts[expectedAmounts.length - 1],
            amounts[amounts.length - 1],
            slippageBps
        );
        
        emit SwapExecuted(
            msg.sender, 
            path[0], 
            path[path.length - 1], 
            amountIn, 
            amounts[amounts.length - 1], 
            feeAmount, 
            actualSlippage
        );
        
        return amounts;
    }
    
    // Legacy function for backward compatibility
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        // Default to 2% slippage for legacy calls
        return swapExactTokensForTokensWithSlippage(
            amountIn,
            amountOutMin,
            path,
            to,
            deadline,
            200 // 2% slippage
        );
    }
    
    // Enhanced ETH swap with slippage protection
    function swapETHForExactTokensWithSlippage(
        uint256 amountOut,
        address[] calldata path,
        address to,
        uint256 deadline,
        uint256 slippageBps
    ) external payable 
        validToken(path[path.length - 1]) 
        validSlippage(slippageBps)
        returns (uint256[] memory amounts) 
    {
        require(path[0] == WETH, "First token must be WETH");
        require(msg.value > 0, "Must send ETH");
        require(deadline >= block.timestamp, "Transaction expired");
        
        // Calculate fee
        uint256 feeAmount = (msg.value * feePercentage) / FEE_DENOMINATOR;
        uint256 swapAmount = msg.value - feeAmount;
        
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
        
        emit SwapExecuted(msg.sender, WETH, path[path.length - 1], amounts[0], amountOut, feeAmount, slippageBps);
        
        return amounts;
    }
    
    // Get swap quote with slippage calculation
    function getSwapQuoteWithSlippage(
        uint256 amountIn,
        address[] calldata path,
        uint256 slippageBps
    ) external view 
        validSlippage(slippageBps)
        returns (uint256[] memory amounts, uint256 minAmountOut, uint256 feeAmount) 
    {
        feeAmount = (amountIn * feePercentage) / FEE_DENOMINATOR;
        uint256 swapAmount = amountIn - feeAmount;
        
        amounts = uniswapRouter.getAmountsOut(swapAmount, path);
        minAmountOut = calculateMinAmountOut(amounts[amounts.length - 1], slippageBps);
        
        return (amounts, minAmountOut, feeAmount);
    }
    
    // Testnet helper functions for easy testing
    function getSepoliaTokens() external pure returns (address[] memory tokens) {
        tokens = new address[](3);
        tokens[0] = WETH;
        tokens[1] = SEPOLIA_USDC;
        tokens[2] = SEPOLIA_DAI;
        return tokens;
    }
    
    function authorizeSepoliaTokens() external onlyOwner {
        authorizedTokens[SEPOLIA_USDC] = true;
        authorizedTokens[SEPOLIA_DAI] = true;
        emit TokenAuthorized(SEPOLIA_USDC, true);
        emit TokenAuthorized(SEPOLIA_DAI, true);
    }
    
    // Testnet faucet-like function for testing (remove in production)
    function mintTestTokens(address token, uint256 amount) external onlyOwner {
        require(authorizedTokens[token], "Token not authorized");
        // This would only work with test tokens that have a mint function
        // In reality, you'd need proper test token contracts
        tokenBalances[token] += amount;
    }
    
    // Authorize/deauthorize tokens for swapping
    function setTokenAuthorization(address token, bool authorized) external onlyOwner {
        authorizedTokens[token] = authorized;
        emit TokenAuthorized(token, authorized);
    }
    
    // Set fee percentage (in basis points, e.g., 25 = 0.25%)
    function setFeePercentage(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 1000, "Fee cannot exceed 10%"); // Max 10% fee
        feePercentage = _feePercentage;
    }
    
    // Cross-chain swap initiation (for bridge integration)
    function initiateCrossChainSwap(
        address tokenIn,
        uint256 amountIn,
        uint256 targetChainId,
        address targetAddress,
        bytes calldata bridgeData
    ) external payable validToken(tokenIn) {
        require(amountIn > 0, "Amount must be greater than 0");
        require(targetChainId != block.chainid, "Cannot bridge to same chain");
        
        // Calculate fee
        uint256 feeAmount = (amountIn * feePercentage) / FEE_DENOMINATOR;
        uint256 bridgeAmount = amountIn - feeAmount;
        
        if (tokenIn == WETH) {
            require(msg.value >= amountIn, "Insufficient ETH sent");
            tokenBalances[WETH] += feeAmount;
        } else {
            IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
            tokenBalances[tokenIn] += feeAmount;
        }
        
        // Emit event for cross-chain bridge to pick up
        emit CrossChainSwapInitiated(msg.sender, tokenIn, bridgeAmount, targetChainId, targetAddress);
    }
    
    // Get swap quote
    function getSwapQuote(
        uint256 amountIn,
        address[] calldata path
    ) external view returns (uint256[] memory amounts) {
        uint256 feeAmount = (amountIn * feePercentage) / FEE_DENOMINATOR;
        uint256 swapAmount = amountIn - feeAmount;
        
        return uniswapRouter.getAmountsOut(swapAmount, path);
    }
    
    // Emergency functions
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner).transfer(amount);
        } else {
            IERC20(token).transfer(owner, amount);
        }
    }
    
    // Collect accumulated fees
    function collectFees(address token) external onlyOwner {
        uint256 amount = tokenBalances[token];
        require(amount > 0, "No fees to collect");
        
        tokenBalances[token] = 0;
        
        if (token == WETH) {
            payable(owner).transfer(amount);
        } else {
            IERC20(token).transfer(owner, amount);
        }
        
        emit FeesCollected(token, amount);
    }
    
    // Update owner
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        owner = newOwner;
    }
    
    // Receive ETH
    receive() external payable {}
    
    fallback() external payable {}
}
