// src/app/page.tsx
'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useLivePrices } from '../hooks/useLivePrice';
import { apiFetch } from '../lib/api';

export default function Home() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const prices = useLivePrices();

    const [coin, setCoin] = useState('BTC');
    const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
    const [quantity, setQuantity] = useState('');
    const [orderResult, setOrderResult] = useState<any>(null);
    const [portfolio, setPortfolio] = useState<any>(null);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [loading, user, router]);

    const fetchPortfolio = useCallback(async () => {
        try {
            const data = await apiFetch('/portfolio');
            setPortfolio(data);
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => { if (user) fetchPortfolio(); }, [user, fetchPortfolio]);

    async function handleTrade(e: React.FormEvent) {
        e.preventDefault();
        setOrderResult(null);
        try {
            const endpoint = side === 'BUY' ? '/buy' : '/sell';
            const result = await apiFetch(endpoint, {
                method: 'POST',
                body: JSON.stringify({ coin, quantity: Number(quantity) }),
            });
            setOrderResult(result);
            if (result.success) {
                setQuantity('');
                fetchPortfolio(); // refresh after a successful trade
            }
        } catch (err: any) {
            setOrderResult({ success: false, message: err.message });
        }
    }

    if (loading) return <p className="p-8">Loading...</p>;
    if (!user) return null;

    return (
        <main className="p-8 flex flex-col gap-8">
            <div className="flex justify-between items-center">
                <p>Logged in as {user.email}</p>
                <button onClick={logout}>Log out</button>
            </div>

            <div className="flex gap-4">
                {['BTC', 'ETH'].map((c) => (
                    <button key={c} onClick={() => setCoin(c)} className={coin === c ? 'font-bold' : ''}>
                        {c}: ${prices[c]?.toFixed(2) ?? '...'}
                    </button>
                ))}
            </div>

            <form onSubmit={handleTrade} className="flex flex-col gap-3 max-w-xs">
                <div className="flex gap-2">
                    <button type="button" onClick={() => setSide('BUY')} className={side === 'BUY' ? 'font-bold' : ''}>Buy</button>
                    <button type="button" onClick={() => setSide('SELL')} className={side === 'SELL' ? 'font-bold' : ''}>Sell</button>
                </div>
                <input type="number" step="any" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
                <button type="submit">{side} {coin}</button>
                {orderResult && (
                    <p className={orderResult.success ? 'text-green-500' : 'text-red-500'}>
                        {orderResult.message}
                    </p>
                )}
            </form>

            {portfolio && (
                <div>
                    <p>Cash: ${portfolio.balance}</p>
                    <p>Reserved: ${portfolio.reservedCash}</p>
                    <ul>
                        {portfolio.holdings?.map((h: any) => (
                            <li key={h.coin}>{h.coin}: {h.quantity} (P&L: {h.unrealizedPnL})</li>
                        ))}
                    </ul>
                </div>
            )}
        </main>
    );
}