'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const { login, signup } = useAuth();
    const router = useRouter();

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
            // login worked — send the user to the home page
            router.push('/')
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="max-w-sm mx-auto mt-20 p-6 border rounded-lg shadow">
            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setMode('login')}
                    className={mode === 'login' ? 'font-bold underline' : 'text-gray-500'}
                >
                    Login
                </button>
                <button
                    onClick={() => setMode('signup')}
                    className={mode === 'signup' ? 'font-bold underline' : 'text-gray-500'}
                >
                    Sign up
                </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)} // update state as user types
                    required
                    className="border p-2 rounded"
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)} // update state as user types
                    required
                    className="border p-2 rounded"
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                    type="submit"
                    disabled={isLoading} // disable the button while waiting
                    className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {/* Change button text based on loading + mode */}
                    {isLoading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
                </button>

            </form>
        </div>
    );
}