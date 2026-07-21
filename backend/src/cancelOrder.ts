import { PrismaClient, Prisma } from '@prisma/client';
import { removeOrder } from './orderBook';
import { withCoinLock } from './coin';

const prisma = new PrismaClient();

export async function cancelOrder(userId: string, orderId: string) {
    const order = await prisma.limitOrder.findUnique({ where: { id: orderId } });

    if (!order) {
        return { success: false, message: 'Order not found' };
    }
    if (order.userId !== userId) {
        return { success: false, message: 'This is not your order' };
    }
    if (order.status !== 'OPEN') {
        return { success: false, message: `Cannot cancel an order that is already ${order.status}` };
    }

    return withCoinLock(order.coin, async () => {
        // remove from the in-memory book, so the matching engine can never match it again
        removeOrder(order.coin, orderId);

        // release any reserved cash, if this was a buy order
        if (order.side === 'BUY') {
            const releaseAmount = new Prisma.Decimal(order.quantity).mul(order.price);
            await prisma.user.update({
                where: { id: userId },
                data: { reservedCash: { decrement: releaseAmount } },
            });
        }

        // mark it cancelled in the permanent record
        await prisma.limitOrder.update({
            where: { id: orderId },
            data: { status: 'CANCELLED' },
        });

        return { success: true, message: 'Order cancelled' };
    });
}