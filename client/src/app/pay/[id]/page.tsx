/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { api, PaymentStatusRes } from '@/lib/api';
import { useParams, useSearchParams, useRouter } from 'next/navigation';

export default function PayPage() {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const mac = sp.get('mac') || '';
  const router = useRouter();

  const [status, setStatus] = useState<PaymentStatusRes | null>(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef<NodeJS.Timeout | null>(null);

  // polling статуса
  useEffect(() => {
    let stopped = false;
    async function pollOnce() {
      try {
        const s = await api.paymentStatus(id);
        if (stopped) return;
        setStatus(s);
        if (s.status === 'paid') {
          // Авторизуем по MAC и переходим на success
          const auth = await api.authorize(mac);
          // Можно передать даты в query, а можно снова дергать /portal/authorize на success — сделаем так
          router.replace(`/success?mac=${encodeURIComponent(mac)}`);
          return;
        }
      } catch (e) {
        console.error(e);
      }
      timer.current = setTimeout(pollOnce, 2000);
    }
    pollOnce();
    return () => {
      stopped = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [id, mac, router]);

  async function confirmStub() {
    try {
      setBusy(true);
      await api.mockConfirm(id);
      // Следующий цикл poll подхватит paid
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-xl px-4 py-10">
        <h1 className="text-xl font-semibold">Оплата</h1>
        <p className="text-sm text-slate-300 mt-2">Платёж #{id}</p>

        <div className="mt-6 rounded-xl bg-slate-900 ring-1 ring-slate-800 p-4">
          <div className="text-sm text-slate-300">Статус:</div>
          <div className="text-base mt-1">{status?.status ?? 'ожидание…'}</div>

          {status?.paidUntilLocal && (
            <div className="text-sm text-slate-300 mt-3">
              Доступ будет активен до:{' '}
              <span className="text-slate-100">{status.paidUntilLocal}</span> ({status.timezone})
            </div>
          )}
        </div>

        <div className="mt-6">
          <button
            onClick={confirmStub}
            disabled={busy}
            className="rounded-lg bg-emerald-500 px-5 py-3 font-medium disabled:opacity-50"
          >
            {busy ? 'Подтверждаем…' : 'Подтвердить оплату (заглушка)'}
          </button>
          <p className="text-xs text-slate-400 mt-2">
            В проде здесь будет QR/страница оплаты Kaspi. На MVP жмём кнопку заглушки.
          </p>
        </div>
      </div>
    </main>
  );
}
