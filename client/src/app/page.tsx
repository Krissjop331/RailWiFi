/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { api, Tariff, AuthorizeRes } from '@/lib/api';
import { loadMac, saveMac, macPretty } from '@/lib/mac';
import { useRouter } from 'next/navigation';
import { formatKzLocalFromUtc, humanizeLeft } from '@/lib/time';

export default function HomePage() {
  const [mac, setMac] = useState('');
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [tariffId, setTariffId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // блок активного доступа
  const [auth, setAuth] = useState<AuthorizeRes | null>(null);
  const [msLeft, setMsLeft] = useState<number>(0);
  const timer = useRef<NodeJS.Timeout | undefined>(undefined);
  const router = useRouter();

  // первоначальная загрузка тарифов и MAC
  useEffect(() => {
    setMac(loadMac());
    api.tariffs().then(setTariffs).catch(console.error);
  }, []);

  // как только появился MAC — проверим активный доступ
  useEffect(() => {
    if (!mac) {
      setAuth(null);
      setMsLeft(0);
      return;
    }
    let stopped = false;

    async function fetchAuth() {
      try {
        const r = await api.authorize(mac);
        if (stopped) return;
        setAuth(r);

        // считаем «сколько осталось» по UTC (наиболее корректно)
        if (r.allowed && r.expiresAtUtc) {
          const ends = new Date(r.expiresAtUtc).getTime();
          setMsLeft(ends - Date.now());

          // запускаем тиканье
          if (timer.current) clearInterval(timer.current);
          timer.current = setInterval(() => {
            setMsLeft((prev) => {
              const next = prev - 1000;
              return next > 0 ? next : 0;
            });
          }, 1000);
        } else {
          setMsLeft(0);
          if (timer.current) {
            clearInterval(timer.current);
            timer.current = undefined;
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    fetchAuth();

    return () => {
      stopped = true;
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = undefined;
      }
    };
  }, [mac]);

  const selected = useMemo(() => tariffs.find((t) => t.id === tariffId), [tariffs, tariffId]);

  async function onPay() {
    if (!mac.trim()) {
      alert('Введите MAC-адрес устройства');
      return;
    }
    if (!tariffId) {
      alert('Выберите тариф');
      return;
    }
    try {
      setLoading(true);
      saveMac(mac);
      const res = await api.createPayment(mac, tariffId);
      router.push(`/pay/${encodeURIComponent(res.paymentId)}?mac=${encodeURIComponent(mac)}`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  const ActiveCard = () => {
    if (!auth) return null;
    if (!auth.allowed) {
      return (
        <div className="rounded-xl bg-slate-900 ring-1 ring-slate-800 p-4">
          <div className="text-sm text-slate-300">
            Для устройства <span className="text-slate-100">{macPretty(mac)}</span> активный доступ
            не найден.
          </div>
        </div>
      );
    }

    const pretty = auth.expiresAtUtc
      ? formatKzLocalFromUtc(auth.expiresAtUtc, auth.timezone)
      : null;

    return (
      <div className="rounded-xl bg-gradient-to-br from-indigo-600/20 to-emerald-500/10 ring-1 ring-slate-800 p-5">
        <div className="text-sm text-slate-300">
          Устройство: <span className="text-slate-100">{macPretty(mac)}</span>
        </div>
        <div className="mt-2 text-base">
          Доступ активен до: <span className="font-semibold">{pretty}</span>
          <span className="text-slate-400"> ({auth.timezone})</span>
        </div>
        <div className="mt-1 text-sm text-slate-300">
          Осталось: <span className="text-slate-100">{humanizeLeft(msLeft)}</span>
        </div>
        <button
          onClick={() => setMac((prev) => prev.trim())} // триггернём повторную проверку (см. useEffect)
          className="mt-3 inline-flex items-center rounded-lg bg-slate-800 px-3 py-2 text-sm ring-1 ring-slate-700 hover:ring-slate-500"
        >
          Обновить статус
        </button>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
        <h1 className="text-2xl font-semibold">Train Wi-Fi — оплата доступа</h1>

        {/* Блок активного доступа */}
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Мой доступ</h2>
          <ActiveCard />
        </section>

        {/* Ввод MAC */}
        <section className="space-y-3">
          <label className="block text-sm text-slate-300">MAC-адрес устройства</label>
          <input
            className="w-full rounded-lg bg-slate-800 px-4 py-2 outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-indigo-500"
            placeholder="AA-BB-CC-11-22-33"
            value={mac}
            onChange={(e) => setMac(e.target.value)}
            onBlur={() => saveMac(mac)}
          />
          <p className="text-xs text-slate-400">
            Сохраняется локально, чтобы не вводить каждый раз.
          </p>
        </section>

        {/* Тарифы */}
        <section>
          <h2 className="text-lg font-medium mb-3">Выберите тариф</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {tariffs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTariffId(t.id)}
                className={`rounded-xl p-4 text-left ring-1 transition
                  ${
                    tariffId === t.id
                      ? 'ring-indigo-500 bg-slate-800'
                      : 'ring-slate-800 hover:ring-slate-700'
                  }`}
              >
                <div className="text-base font-semibold">{t.title}</div>
                <div className="text-sm text-slate-300 mt-1">{t.durationMin} минут</div>
                <div className="text-sm text-slate-200 mt-2">
                  {Number(t.priceKzt).toLocaleString('ru-RU')} ₸
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Кнопка «Оплатить» */}
        <section>
          <button
            disabled={loading}
            onClick={onPay}
            className="rounded-lg bg-indigo-500 px-5 py-3 font-medium disabled:opacity-50"
          >
            {loading ? 'Создание платежа…' : 'Оплатить'}
          </button>
          {selected && mac && (
            <div className="mt-3 text-xs text-slate-400">
              Вы платите за тариф «{selected.title}» для устройства {macPretty(mac)}.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
