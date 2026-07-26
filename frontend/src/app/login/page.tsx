'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const { user, loading, login, signup } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [loading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      router.replace('/');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-black/30 lg:flex-row lg:items-center">
        <section className="flex-1">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">Tradexa</p>
          <h1 className="text-4xl font-semibold">Trade crypto with a polished, real-time experience.</h1>
          <p className="mt-4 text-lg text-slate-400">
            Sign in to see your portfolio, live prices, and place buy or sell orders instantly.
          </p>
        </section>

        <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
          <div className="mb-6 flex gap-2 rounded-full bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition ${mode === 'login' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300'}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition ${mode === 'signup' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300'}`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none ring-0 focus:border-cyan-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm outline-none ring-0 focus:border-cyan-500"
            />
            {error ? <p className="text-sm text-rose-400">{error}</p> : null}
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-xl bg-cyan-500 px-3 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
