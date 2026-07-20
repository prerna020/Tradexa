import express from 'express';
import { buy } from './buy';
import { sell } from './sell';
import { latestPrices } from './priceFeed';
import './priceFeed';

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

    res.json({
        balance: user.cashBalance,
        holdings,
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


app.listen(process.env.PORT, () => console.log(`Server running on http://localhost:${process.env.PORT}`));