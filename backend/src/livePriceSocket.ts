import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { latestPrices } from './priceFeed';

export function attachLivePriceSocket(server: http.Server) {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (client) => {
        console.log('A client connected for live prices');

        // send a fresh update every second to this client, for as long as it's connected
        const interval = setInterval(() => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(latestPrices));
            }
        }, 1000);
        client.on('close', () => {
            clearInterval(interval);
            console.log('Client disconnected');
        });
    });
}