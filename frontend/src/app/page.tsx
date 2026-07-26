'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useLivePrice } from '../hooks/useLivePrice';
import { apiFetch } from '../lib/api';

interface PortfolioItem {
  coin: string;
  quantity: string;
  unrealizedPnL: string;
}

interface PortfolioData {
  balance: string;
  reservedCash: string;
  holdings: PortfolioItem[];
}

export default function Home() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const prices = useLivePrice();

  const [coin, setCoin] = useState('BTC');
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState('');
  const [orderResult, setOrderResult] = useState<{ success: boolean; message: string } | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  const fetchPortfolio = useCallback(async () => {
    try {
      const data = await apiFetch('/portfolio');
      setPortfolio(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      void fetchPortfolio();
    }
  }, [user, fetchPortfolio]);

  async function handleTrade(e: React.FormEvent) {
    e.preventDefault();
    setOrderResult(null);

    try {
      const endpoint = side === 'BUY' ? '/buy' : '/sell';
      const result = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ coin, quantity: Number(quantity) }),
      });

      setOrderResult({ success: result.success !== false, message: result.message || 'Trade executed' });
      if (result.success !== false) {
        setQuantity('');
        void fetchPortfolio();
      }
    } catch (err: any) {
      setOrderResult({ success: false, message: err.message || 'Trade failed' });
    }
  }

  if (loading) {
    return <p className="p-8 text-slate-700">Loading...</p>;
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/20 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">Tradexa</p>
            <h1 className="text-2xl font-semibold">Welcome back, {user.email}</h1>
          </div>
          <button
            onClick={() => void logout()}
            className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-cyan-500 hover:text-cyan-400"
          >
            Log out
          </button>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/20">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Live prices</p>
                <h2 className="text-xl font-semibold">Real-time market feed</h2>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {['BTC', 'ETH'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCoin(c)}
                  className={`rounded-2xl border p-4 text-left transition ${coin === c ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-800 bg-slate-950/60'}`}
                >
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{c}</p>
                  <p className="mt-2 text-2xl font-semibold">${prices[c]?.toFixed(2) ?? '...'}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/20">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Portfolio</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-slate-950/70 p-4">
                <p className="text-sm text-slate-400">Cash balance</p>
                <p className="text-2xl font-semibold">${portfolio?.balance ?? '0.00'}</p>
              </div>
              <div className="rounded-2xl bg-slate-950/70 p-4">
                <p className="text-sm text-slate-400">Reserved cash</p>
                <p className="text-2xl font-semibold">${portfolio?.reservedCash ?? '0.00'}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <form onSubmit={handleTrade} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/20">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Place order</p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setSide('BUY')}
                className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition ${side === 'BUY' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
              >
                Buy
              </button>
              <button
                type="button"
                onClick={() => setSide('SELL')}
                className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition ${side === 'SELL' ? 'bg-rose-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
              >
                Sell
              </button>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-sm text-slate-400">Selected asset</p>
              <p className="mt-2 text-2xl font-semibold">{coin}</p>
            </div>
            <input
              type="number"
              step="any"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              className="mt-4 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none ring-0 focus:border-cyan-500"
            />
            <button type="submit" className="mt-4 w-full rounded-2xl bg-cyan-500 px-3 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
              {side} {coin}
            </button>
            {orderResult ? (
              <p className={`mt-4 text-sm ${orderResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                {orderResult.message}
              </p>
            ) : null}
          </form>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Holdings</p>
              <p className="text-sm text-slate-500">Updated live</p>
            </div>
            <div className="mt-4 space-y-3">
              {portfolio?.holdings?.length ? (
                portfolio.holdings.map((item) => (
                  <div key={item.coin} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{item.coin}</p>
                      <p className="text-sm text-slate-400">Qty {item.quantity}</p>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">P&L: {item.unrealizedPnL}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
                  No holdings yet. Start with a buy order.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
