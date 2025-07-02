-- CreateTable
CREATE TABLE "SwapCommit" (
    "id" TEXT NOT NULL,
    "intentId" TEXT NOT NULL,
    "commitmentTx" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SwapCommit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SwapReveal" (
    "id" TEXT NOT NULL,
    "intentId" TEXT NOT NULL,
    "revealTx" TEXT NOT NULL,
    "settlementSuccessful" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SwapReveal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SwapCommit_intentId_key" ON "SwapCommit"("intentId");

-- CreateIndex
CREATE UNIQUE INDEX "SwapReveal_intentId_key" ON "SwapReveal"("intentId");

-- AddForeignKey
ALTER TABLE "SwapCommit" ADD CONSTRAINT "SwapCommit_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "TradeIntent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwapReveal" ADD CONSTRAINT "SwapReveal_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "TradeIntent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
