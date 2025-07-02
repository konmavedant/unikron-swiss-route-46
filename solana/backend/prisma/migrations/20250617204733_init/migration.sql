-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeIntent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenIn" TEXT NOT NULL,
    "tokenOut" TEXT NOT NULL,
    "amountIn" BIGINT NOT NULL,
    "minOut" BIGINT NOT NULL,
    "expiry" TIMESTAMP(3) NOT NULL,
    "nonce" BIGINT NOT NULL,
    "routeHash" TEXT NOT NULL,
    "relayerFee" BIGINT NOT NULL,
    "relayer" TEXT NOT NULL,
    "intentHash" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeIntent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "TradeIntent_intentHash_key" ON "TradeIntent"("intentHash");

-- AddForeignKey
ALTER TABLE "TradeIntent" ADD CONSTRAINT "TradeIntent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
