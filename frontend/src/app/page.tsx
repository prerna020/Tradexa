'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login'); // only redirect once we KNOW they're not logged in
  }, [loading, user, router]);

  if (loading) return <p className="p-8">Loading...</p>;
  if (!user) return null; // brief moment before the redirect kicks in

  return (
    <main className="p-8">
      <p>hello </p>
      {/* <p>Welcome, {user.email}. Balance: ${user.balance}</p> */}
      {/* trading UI goes here next */}
    </main>
  );
}