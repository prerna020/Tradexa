// src/trySpend.ts
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export async function trySpend(userId: string, amount: number) {
    return prisma.$transaction(async (tx) => {
        const rows = await tx.$queryRaw<{ id: string; cashBalance: string }[]>`
            SELECT id, "cashBalance" FROM "User" WHERE id = ${userId} FOR UPDATE
        `;
        const user = rows[0];

        if (!user) {
            throw new Error('User not found');
        }

        const currentBalance = new Prisma.Decimal(user.cashBalance);
        if (currentBalance.lessThan(amount)) {
            return { success: false, reason: 'insufficient_balance', balance: currentBalance.toString() };
        }
        const newBalance = currentBalance.minus(amount);
        
        await tx.user.update({
            where: { id: userId },
            data: { cashBalance: newBalance },
        });

        return { success: true, balance: newBalance.toString() };
    });
}