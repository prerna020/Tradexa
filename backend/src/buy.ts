import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export async function buy(userId: string, coin: string, quantity: number, price: number) {
    const cost = new Prisma.Decimal(quantity).mul(price);

    return prisma.$transaction(async (tx) => {
        const rows = await tx.$queryRaw<{ id: string; cashBalance: string }[]>`
            SELECT id, "cashBalance" FROM "User" WHERE id = ${userId} FOR UPDATE
        `;
        const user = rows[0];
        if (!user) throw new Error('User not found');

        const currentBalance = new Prisma.Decimal(user.cashBalance);
        if (currentBalance.lessThan(cost)) {
            return {
                success: false,
                message: `Insufficient balance. You have $${currentBalance}, need $${cost}.`,
            };
        }
        await tx.user.update({
            where: { id: userId },
            data: { cashBalance: currentBalance.minus(cost) },
        });

        await tx.trade.create({
            data: { userId, coin, side: 'BUY', quantity, price },
        });

        const existing = await tx.holding.findUnique({
            where: { userId_coin: { userId, coin } },
        });

        if (existing) {
            const newQuantity = new Prisma.Decimal(existing.quantity).plus(quantity);
            await tx.holding.update({
                where: { userId_coin: { userId, coin } },
                data: { quantity: newQuantity },
            });
        } else {
            await tx.holding.create({
                data: { userId, coin, quantity },
            });
        }

        return {
            success: true,
            message: `Bought ${quantity} ${coin} at $${price} each. Total cost: $${cost}.`,
        };
    });
}