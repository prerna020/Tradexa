'use client';
import { useState } from 'react';
import { apiFetch } from '../lib/api';

interface Props {
  coin: string;
  onOrderPlaced: () => void; // parent refreshes portfolio + open orders after this fires
}

export function TradeForm({ coin, onOrderPlaced }: Props) {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [quantity, setQuantity] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      let response;
      if (orderType === 'MARKET') {
        response = await apiFetch(side === 'BUY' ? '/buy' : '/sell', {
          method: 'POST',
          body: JSON.stringify({ coin, quantity: Number(quantity) }),
        });
      } else {
        response = await apiFetch('/limit-order', {
          method: 'POST',
          body: JSON.stringify({ coin, side, quantity: Number(quantity), price: Number(limitPrice) }),
        });
      }

      setResult(response);
      if (response.success) {
        setQuantity('');
        setLimitPrice('');
        onOrderPlaced();
      }
    } catch (err: any) {
      setResult({ success: false, message: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-xs">
      <div className="flex gap-2">
        <button type="button" onClick={() => setSide('BUY')} className={side === 'BUY' ? 'font-bold' : ''}>Buy</button>
        <button type="button" onClick={() => setSide('SELL')} className={side === 'SELL' ? 'font-bold' : ''}>Sell</button>
      </div>

      <div className="flex gap-2 text-sm">
        <button type="button" onClick={() => setOrderType('MARKET')} className={orderType === 'MARKET' ? 'font-bold' : ''}>Market</button>
        <button type="button" onClick={() => setOrderType('LIMIT')} className={orderType === 'LIMIT' ? 'font-bold' : ''}>Limit</button>
      </div>

      <input
        type="number" step="any" placeholder="Quantity"
        value={quantity} onChange={(e) => setQuantity(e.target.value)} required
      />

      {/* only show a price field at all when it's actually needed —
          a market order has no price input, since the backend decides that */}
      {orderType === 'LIMIT' && (
        <input
          type="number" step="any" placeholder="Limit price"
          value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} required
        />
      )}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Placing...' : `${side} ${coin} (${orderType.toLowerCase()})`}
      </button>

      {result && (
        <p className={result.success ? 'text-green-500' : 'text-red-500'}>
          {result.message ?? (result.success ? 'Order placed' : 'Order failed')}
        </p>
      )}
    </form>
  );
}