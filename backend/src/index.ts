import express from 'express';
import { buy } from './buy';
import { sell } from './sell';
import { latestPrices } from './priceFeed';
import './priceFeed';
import http from 'http'
import { getBids, getAsks, placeLimitOrder } from './orderBook';
import { attachLivePriceSocket } from './livePriceSocket';


import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const app = express();
app.use(express.json());

app.post('/buy', async (req, res) => {
    const { userId, coin, quantity } = req.body;
    console.log(userId, coin, quantity)
    if (!userId || !coin || !quantity) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const price = latestPrices[coin.toUpperCase()];

    if (!price) {
        return res.status(400).json({ success: false, message: `No price feed available for ${coin}` });
    }

    try {
        const result = await buy(userId, coin, quantity, price);
        res.status(result.success ? 200 : 422).json(result);
        return res.json({
            success: true,
            message: `${coin} is bought successfully`
        })
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/sell', async (req, res) => {
    const { userId, coin, quantity } = req.body;

    if (!userId || !coin || !quantity) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const price = latestPrices[coin.toUpperCase()];

    if (!price) {
        return res.status(400).json({ success: false, message: `No price feed available for ${coin}` });
    }

    try {
        const result = await sell(userId, coin, quantity, price);
        res.status(result.success ? 200 : 422);
        return res.json({
            success: true,
            message: `${coin} is sold successfully`
        })
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/portfolio/:userId', async (req, res) => {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    const holdings = await prisma.holding.findMany({ where: { userId } });
    console.log("holdings" ,holdings);

    const enrichedHoldings = await Promise.all(
        holdings.map(async (h) => {
            // pull every BUY trade for this coin, to work out average price paid
            const buyTrades = await prisma.trade.findMany({
                where: { userId, coin: h.coin, side: 'BUY' },
            });
            // console.log("buyTrades" ,buyTrades);
            // reduce : iterate over array and accumulate value 
            // 1. Initialize with sum=0
            // 2. For each trade, add (quantity * price) to sum
            // 3. Return the final sum
            const totalSpent = buyTrades.reduce(
                (sum, t) => sum + Number(t.quantity) * Number(t.price), 0
            );
            console.log("totalSpent" ,totalSpent);

            const totalBought = buyTrades.reduce((sum, t) => sum + Number(t.quantity), 0);
            console.log("totalBought" ,totalBought);
            
            const avgCost = totalBought > 0 ? totalSpent / totalBought : 0;

            const currentPrice = latestPrices[h.coin] ?? 0;
            const currentValue = Number(h.quantity) * currentPrice;
            const unrealizedPnL = currentValue - (Number(h.quantity) * avgCost);

            return {
                coin: h.coin,
                quantity: h.quantity,
                avgCost: avgCost.toFixed(2),
                currentPrice,
                currentValue: currentValue.toFixed(2),
                unrealizedPnL: unrealizedPnL.toFixed(2),
            };
        })
    );

    res.json({
        balance: user.cashBalance,
        holdings : enrichedHoldings
    });
});

app.get('/price/:coin', (req, res) => {
    const coin = req.params.coin.toUpperCase();
    const price = latestPrices[coin];

    if (!price) {
        return res.status(404).json({ message: `No price yet for ${coin}` });
    }

    res.json({ coin, price });
});

app.get('/trades/:userId', async (req, res) => {
    const { userId } = req.params;
    const limit = Number(req.query.limit) || 20; 

    const trades = await prisma.trade.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });

    res.json({ trades });
});

app.post('/limit-order', async (req, res) => {
  const { userId, coin, side, quantity, price } = req.body;
  if (!userId || !coin || !side || !quantity || !price) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const result = await placeLimitOrder(userId, coin.toUpperCase(), side, quantity, price);
  res.json(result);
});

app.get('/orderbook/:coin', (req, res) => {
  const coin = req.params.coin.toUpperCase();
  res.json({ bids: getBids(coin), asks: getAsks(coin) });
});

const server = http.createServer(app);
attachLivePriceSocket(server);
server.listen(3000, () => console.log('Server running on http://localhost:3000'));