'use client';
import { useEffect, useState } from 'react';

export function useLivePrice() {
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${protocol}://${window.location.hostname}:3000`);

    ws.onmessage = (event) => {
      try {
        setPrices(JSON.parse(event.data));
      } catch {
        setPrices({});
      }
    };

    ws.onerror = () => {
      setPrices({});
    };

    return () => {
      ws.close();
    };
  }, []);

  return prices;
}
