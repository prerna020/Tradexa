import { withCoinLock } from "./coin";
import { OrderSide, Prisma, PrismaClient } from "@prisma/client";
import { OrderStatus } from '@prisma/client'
const prisma = new PrismaClient()

interface RestingOrder {
    orderId: string;
    userId: string;
    price: number;
    quantity: number;
}

const bids: Record<string, RestingOrder[]> = {};
const asks: Record<string, RestingOrder[]> = {};

export function getBids(coin: string) {
    if (!bids[coin]) bids[coin] = [];
    return bids[coin];
}

export function getAsks(coin: string) {
    if (!asks[coin]) asks[coin] = [];
    return asks[coin];
}

export function addBid(coin: string, order: RestingOrder) {
    getBids(coin).push(order);
    bids[coin]?.sort((a, b) => b.price - a.price);
}

export function addAsk(coin: string, order: RestingOrder) {
    getAsks(coin).push(order);
    asks[coin]?.sort((a, b) => a.price - b.price);
}

export async function placeLimitOrder(
    userId: string,
    coin: string,
    side: OrderSide,
    quantity: number,
    price: number
) {
    return withCoinLock(coin, async () => {

        // Balance check happens BEFORE creating any row — since there's no
        // REJECTED status, a failed check simply never becomes a database row.
        if (side === OrderSide.BUY) {
            const cost = new Prisma.Decimal(quantity).mul(price);

            const canProceed = await prisma.$transaction(async (tx) => {
                const rows = await tx.$queryRaw<{ cashBalance: string; reservedCash: string }[]>`
                    SELECT "cashBalance", "reservedCash" FROM "User" WHERE id = ${userId} FOR UPDATE
                `;
                const user = rows[0];
                if (!user) {
                    return {
                        success: false,
                        message: "User not found"
                    }
                }
                const available = new Prisma.Decimal(user.cashBalance).minus(user.reservedCash);
                if (available.lessThan(cost)) return false;

                await tx.user.update({
                    where: { id: userId },
                    data: { reservedCash: { increment: cost } },
                });
                return true;
            });

            if (!canProceed) {
                return { success: false, message: 'Insufficient available balance' };
            }
        }

        const order = await prisma.limitOrder.create({
            data: { userId, coin, side, quantity, price, status: OrderStatus.OPEN },
        });

        let remaining = quantity;
        const oppositeBook = side === OrderSide.BUY ? getAsks(coin) : getBids(coin);

        while (remaining > 0 && oppositeBook.length > 0) {
            const best = oppositeBook[0];
            if (!best) {
                break;
            }
            const crosses = side === OrderSide.BUY ? price >= best.price : price <= best.price;
            if (!crosses) break;

            const tradeQty = Math.min(remaining, best.quantity);
            const tradePrice = best.price; // maker's price

            const buyerId = side === OrderSide.BUY ? userId : best.userId;
            const sellerId = side === OrderSide.BUY ? best.userId : userId;

            await settleTrade(buyerId, sellerId, coin, tradeQty, tradePrice);

            remaining -= tradeQty;
            best.quantity -= tradeQty;
            if (best.quantity <= 0) oppositeBook.shift();
        }

        if (remaining > 0) {
            const restingOrder = { orderId: order.id, userId, price, quantity: remaining };
            side === OrderSide.BUY ? addBid(coin, restingOrder) : addAsk(coin, restingOrder);
        }

        await prisma.limitOrder.update({
            where: { id: order.id },
            data: { status: remaining > 0 ? OrderStatus.OPEN : OrderStatus.FILLED },
        });

        return { success: true, orderId: order.id, filled: quantity - remaining, remaining };
    });
}

async function settleTrade(
    buyerId: string,
    sellerId: string,
    coin: string,
    quantity: number,
    price: number
) {
    const cost = new Prisma.Decimal(quantity).mul(price);

    await prisma.$transaction(async (tx) => {
        await tx.user.update({
            where: { id: buyerId },
            data: { cashBalance: { decrement: cost }, reservedCash: { decrement: cost } },
        });
        const buyerHolding = await tx.holding.findUnique({ where: { userId_coin: { userId: buyerId, coin } } });
        if (buyerHolding) {
            await tx.holding.update({
                where: { userId_coin: { userId: buyerId, coin } },
                data: { quantity: { increment: quantity } },
            });
        } else {
            await tx.holding.create({ data: { userId: buyerId, coin, quantity } });
        }
        await tx.trade.create({ data: { userId: buyerId, coin, side: OrderSide.BUY, quantity, price } });

        await tx.user.update({ where: { id: sellerId }, data: { cashBalance: { increment: cost } } });
        await tx.holding.update({
            where: { userId_coin: { userId: sellerId, coin } },
            data: { quantity: { decrement: quantity } },
        });
        await tx.trade.create({ data: { userId: sellerId, coin, side: OrderSide.SELL, quantity, price } });
    });
}