// src/priceFeed.ts
import WebSocket from 'ws';

export const latestPrices: Record<string, number> = {};

function connect() {
    const ws = new WebSocket(process.env.BINANCE_WS_URL!);

    ws.on('open', () => {
        console.log('Connected to Binance price feed');
    });
    
    ws.on('message', (raw) => {
        const parsed = JSON.parse(raw.toString());
        const symbol = parsed.data.s;
        const price = parseFloat(parsed.data.p);

        const coin = symbol.replace('USDT', ''); 
        latestPrices[coin] = price;
    });

    ws.on('close', () => {
        console.log('Price feed disconnected, reconnecting in 3 seconds...');
        setTimeout(connect, 3000);
    });

    ws.on('error', (err) => {
        console.error('Price feed error:', err.message);
        ws.close();
    });
}

connect();