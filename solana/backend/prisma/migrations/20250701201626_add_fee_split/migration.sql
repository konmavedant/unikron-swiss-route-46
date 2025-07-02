-- CreateTable
CREATE TABLE "FeeSplit" (
    "id" TEXT NOT NULL,
    "intentId" TEXT NOT NULL,
    "liquidityAmount" BIGINT NOT NULL,
    "protocolAmount" BIGINT NOT NULL,
    "bountyAmount" BIGINT NOT NULL,
    "settledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeSplit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeeSplit_intentId_key" ON "FeeSplit"("intentId");

-- AddForeignKey
ALTER TABLE "FeeSplit" ADD CONSTRAINT "FeeSplit_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "TradeIntent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
