"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trySpend = trySpend;
// src/trySpend.ts
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function trySpend(userId, amount) {
    return prisma.$transaction(async (tx) => {
        const rows = await tx.$queryRaw `
            SELECT id, cashBalance FROM "User" WHERE id = ${userId} FOR UPDATE
        `;
        const user = rows[0];
        if (!user) {
            throw new Error('User not found');
        }
        const currentBalance = new client_1.Prisma.Decimal(user.cashBalance);
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
//# sourceMappingURL=trySpend.js.map