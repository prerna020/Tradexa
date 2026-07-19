/*
  Warnings:

  - You are about to drop the column `executedAt` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `orderId` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `symbol` on the `Trade` table. All the data in the column will be lost.
  - You are about to alter the column `price` on the `Trade` table. The data in that column could be lost. The data in that column will be cast from `Decimal(18,8)` to `Decimal(18,2)`.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `BalanceLedger` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Order` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Position` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `coin` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `side` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Trade` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."BalanceLedger" DROP CONSTRAINT "BalanceLedger_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Order" DROP CONSTRAINT "Order_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Position" DROP CONSTRAINT "Position_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Trade" DROP CONSTRAINT "Trade_orderId_fkey";

-- AlterTable
ALTER TABLE "public"."Trade" DROP COLUMN "executedAt",
DROP COLUMN "orderId",
DROP COLUMN "symbol",
ADD COLUMN     "coin" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "side" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "createdAt";

-- DropTable
DROP TABLE "public"."BalanceLedger";

-- DropTable
DROP TABLE "public"."Order";

-- DropTable
DROP TABLE "public"."Position";

-- DropEnum
DROP TYPE "public"."LedgerReason";

-- DropEnum
DROP TYPE "public"."OrderSide";

-- DropEnum
DROP TYPE "public"."OrderStatus";

-- CreateTable
CREATE TABLE "public"."Holding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coin" TEXT NOT NULL,
    "quantity" DECIMAL(18,8) NOT NULL,

    CONSTRAINT "Holding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Holding_userId_coin_key" ON "public"."Holding"("userId", "coin");

-- AddForeignKey
ALTER TABLE "public"."Holding" ADD CONSTRAINT "Holding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Trade" ADD CONSTRAINT "Trade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
