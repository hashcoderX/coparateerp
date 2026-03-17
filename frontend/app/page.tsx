'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/login', {
        email,
        password,
      });
      const nextToken = response.data.token;
      localStorage.setItem('token', nextToken);

      try {
        const userRes = await axios.get('http://localhost:8000/api/user', {
          headers: { Authorization: `Bearer ${nextToken}` },
        });

        const userData = userRes.data || {};
        const roleNames = [
          String(userData?.role || ''),
          ...(Array.isArray(userData?.roles)
            ? userData.roles.map((role: any) => String(role?.name || role || ''))
            : []),
        ]
          .map((role) => role.trim().toLowerCase())
          .filter(Boolean);

        const isOutletUser = roleNames.some((role) => role.includes('outlet_user'));
        const nextPath = params.get('next');

        if (isOutletUser) {
          if (nextPath && nextPath.startsWith('/')) {
            router.push(nextPath);
          } else {
            router.push('/outlet-pos');
          }
          return;
        }

        if (nextPath && nextPath.startsWith('/dashboard')) {
          router.push(nextPath);
          return;
        }
      } catch (profileError) {
        console.error('Error loading user profile after login:', profileError);
      }

      router.push('/dashboard');
    } catch (error: any) {
      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data?.errors?.email?.[0] ||
        'Login failed. Please check your credentials.';
      alert(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-red-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-red-600">
            Welcome back! Please enter your credentials.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-red-300 placeholder-red-500 text-red-900 rounded-t-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-red-300 placeholder-red-500 text-red-900 rounded-b-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
