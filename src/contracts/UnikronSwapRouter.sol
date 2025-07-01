
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
    
    IUniswapV2Router private uniswapRouter;
    
    mapping(address => bool) public authorizedTokens;
    mapping(address => uint256) public tokenBalances;
    
    event SwapExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 fee
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
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier validToken(address token) {
        require(authorizedTokens[token] || token == WETH, "Token not authorized");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        uniswapRouter = IUniswapV2Router(UNISWAP_V2_ROUTER);
        
        // Pre-authorize common tokens (you'll need to set actual Sepolia addresses)
        authorizedTokens[WETH] = true;
        // Add more tokens as needed for Sepolia testnet
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
    
    // Swap exact tokens for tokens
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external validToken(path[0]) validToken(path[path.length - 1]) returns (uint256[] memory amounts) {
        require(path.length >= 2, "Invalid path");
        require(amountIn > 0, "Amount must be greater than 0");
        require(deadline >= block.timestamp, "Transaction expired");
        
        address tokenIn = path[0];
        address tokenOut = path[path.length - 1];
        
        // Calculate fee
        uint256 feeAmount = (amountIn * feePercentage) / FEE_DENOMINATOR;
        uint256 swapAmount = amountIn - feeAmount;
        
        // Transfer tokens from user
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        
        // Store fee
        tokenBalances[tokenIn] += feeAmount;
        
        // Approve router to spend tokens
        IERC20(tokenIn).approve(UNISWAP_V2_ROUTER, swapAmount);
        
        // Execute swap
        amounts = uniswapRouter.swapExactTokensForTokens(
            swapAmount,
            amountOutMin,
            path,
            to,
            deadline
        );
        
        emit SwapExecuted(msg.sender, tokenIn, tokenOut, amountIn, amounts[amounts.length - 1], feeAmount);
        
        return amounts;
    }
    
    // Swap ETH for exact tokens
    function swapETHForExactTokens(
        uint256 amountOut,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable validToken(path[path.length - 1]) returns (uint256[] memory amounts) {
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
        
        emit SwapExecuted(msg.sender, WETH, path[path.length - 1], amounts[0], amountOut, feeAmount);
        
        return amounts;
    }
    
    // Swap exact tokens for ETH
    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external validToken(path[0]) returns (uint256[] memory amounts) {
        require(path[path.length - 1] == WETH, "Last token must be WETH");
        require(amountIn > 0, "Amount must be greater than 0");
        require(deadline >= block.timestamp, "Transaction expired");
        
        address tokenIn = path[0];
        
        // Calculate fee
        uint256 feeAmount = (amountIn * feePercentage) / FEE_DENOMINATOR;
        uint256 swapAmount = amountIn - feeAmount;
        
        // Transfer tokens from user
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        
        // Store fee
        tokenBalances[tokenIn] += feeAmount;
        
        // Approve router to spend tokens
        IERC20(tokenIn).approve(UNISWAP_V2_ROUTER, swapAmount);
        
        // Execute swap
        amounts = uniswapRouter.swapExactTokensForETH(
            swapAmount,
            amountOutMin,
            path,
            to,
            deadline
        );
        
        emit SwapExecuted(msg.sender, tokenIn, WETH, amountIn, amounts[amounts.length - 1], feeAmount);
        
        return amounts;
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
        
        // Here you would integrate with actual bridge protocols like LayerZero, Wormhole, etc.
        // For now, we just emit the event
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
