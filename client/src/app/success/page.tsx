'use client';

import { useEffect, useState } from 'react';
import { api, AuthorizeRes } from '@/lib/api';
import { useSearchParams, useRouter } from 'next/navigation';

export default function SuccessPage() {
  const sp = useSearchParams();
  const mac = sp.get('mac') || '';
  const router = useRouter();
  const [res, setRes] = useState<AuthorizeRes | null>(null);

  useEffect(() => {
    if (!mac) return;
    api.authorize(mac).then(setRes).catch(console.error);
  }, [mac]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-xl px-4 py-10">
        <h1 className="text-xl font-semibold">Доступ активирован</h1>

        {res?.allowed ? (
          <div className="mt-6 rounded-xl bg-slate-900 ring-1 ring-slate-800 p-4">
            <div className="text-sm text-slate-300">
              Устройство: <span className="text-slate-100">{mac.toUpperCase()}</span>
            </div>
            <div className="text-sm text-slate-300 mt-2">
              Активно до: <span className="text-slate-100">{res.expiresAtLocal}</span> (
              {res.timezone})
            </div>
          </div>
        ) : (
          <div className="mt-6 text-slate-300">
            Права доступа не найдены. Вернуться на главную и оплатить тариф.
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <button
            onClick={() => router.push('/')}
            className="rounded-lg bg-indigo-500 px-5 py-3 font-medium"
          >
            На главную
          </button>
        </div>
      </div>
    </main>
  );
}
