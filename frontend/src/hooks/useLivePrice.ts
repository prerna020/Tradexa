'use client';
import { useEffect, useRef, useState } from 'react';

export function useLivePrices() {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000'); // no credentials needed — public data
    wsRef.current = ws;

    ws.onmessage = (event) => {
      setPrices(JSON.parse(event.data));
    };

    return () => ws.close();
  }, []);

  return prices;
}