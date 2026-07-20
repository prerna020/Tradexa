import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export async function sell(userId: string, coin: string, quantity: number, price: number) {
    const proceeds = new Prisma.Decimal(quantity).mul(price);

    return prisma.$transaction(async (tx) => {
        const rows = await tx.$queryRaw<{ id: string; quantity: string }[]>`
            SELECT id, quantity FROM "Holding" WHERE "userId" = ${userId} AND coin = ${coin} FOR UPDATE
        `;
        const holding = rows[0];

        const ownedQuantity = holding ? new Prisma.Decimal(holding.quantity) : new Prisma.Decimal(0);

        if (ownedQuantity.lessThan(quantity)) {
            return {
                success: false,
                message: `Insufficient holdings. You own ${ownedQuantity} ${coin}, tried to sell ${quantity}.`,
            };
        }

        // reduce the holding
        await tx.holding.update({
            where: { userId_coin: { userId, coin } },
            data: { quantity: ownedQuantity.minus(quantity) },
        });

        // add money back to the user
        await tx.user.update({
            where: { id: userId },
            data: { cashBalance: { increment: proceeds } },
        });

        // record the event
        await tx.trade.create({
            data: { userId, coin, side: 'SELL', quantity, price },
        });

        return {
            success: true,
            message: `Sold ${quantity} ${coin} at $${price} each. Received: $${proceeds}.`,
        };
    });
}