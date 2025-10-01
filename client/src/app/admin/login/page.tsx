/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { adminApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function onLogin() {
    try {
      setBusy(true);
      await adminApi.login(u, p);
      router.replace('/admin');
    } catch (e: any) {
      alert('Ошибка входа');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center">
      <div className="w-full max-w-sm rounded-xl bg-slate-900 ring-1 ring-slate-800 p-6">
        <h1 className="text-xl font-semibold">Вход в админку</h1>
        <div className="mt-4 space-y-3">
          <input
            className="w-full rounded bg-slate-800 px-3 py-2 ring-1 ring-slate-700"
            placeholder="Логин"
            value={u}
            onChange={(e) => setU(e.target.value)}
          />
          <input
            className="w-full rounded bg-slate-800 px-3 py-2 ring-1 ring-slate-700"
            placeholder="Пароль"
            type="password"
            value={p}
            onChange={(e) => setP(e.target.value)}
          />
          <button
            disabled={busy}
            onClick={onLogin}
            className="w-full rounded bg-indigo-500 px-3 py-2 font-medium disabled:opacity-50"
          >
            {busy ? 'Входим…' : 'Войти'}
          </button>
        </div>
      </div>
    </main>
  );
}
