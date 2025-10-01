/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { adminApi, Tariff } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { formatKzLocalFromUtc, humanizeLeft } from '@/lib/time';

type AdminSession = {
  mac: string;
  grantedAtUtc: string;
  expiresAtUtc: string;
  expiresAtLocal: string;
  minutesLeft: number;
  timezone: string;
};

function MinutesButtons({ mac, onChanged }: { mac: string; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  async function doExt(m: number) {
    try {
      setBusy(true);
      await adminApi.extend(mac, Number(m));
      await onChanged();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function doTerm() {
    if (!confirm('Завершить доступ прямо сейчас?')) return;
    try {
      setBusy(true);
      await adminApi.terminate(mac);
      await onChanged();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => doExt(15)}
        disabled={busy}
        className="rounded bg-emerald-600 px-3 py-1 text-sm"
      >
        +15 мин
      </button>
      <button
        onClick={() => doExt(60)}
        disabled={busy}
        className="rounded bg-emerald-600 px-3 py-1 text-sm"
      >
        +60 мин
      </button>
      <button onClick={doTerm} disabled={busy} className="rounded bg-red-600 px-3 py-1 text-sm">
        Завершить
      </button>
    </div>
  );
}

function SessionRow({ s, onChanged }: { s: AdminSession; onChanged: () => void }) {
  const [msLeft, setMsLeft] = useState<number>(() =>
    Math.max(0, new Date(s.expiresAtUtc).getTime() - Date.now())
  );
  const timer = useRef<NodeJS.Timeout | null>(null);

  // живой отсчёт
  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setMsLeft((prev) => {
        const next = prev - 1000;
        return next > 0 ? next : 0;
      });
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [s.expiresAtUtc]);

  // красивое "Активно до"
  const prettyUntil = useMemo(
    () => formatKzLocalFromUtc(s.expiresAtUtc, s.timezone),
    [s.expiresAtUtc, s.timezone]
  );

  return (
    <tr className="border-t border-slate-800">
      <td className="py-2">{s.mac}</td>
      <td className="py-2">
        {prettyUntil} <span className="text-slate-400">({s.timezone})</span>
      </td>
      <td className="py-2">{humanizeLeft(msLeft)}</td>
      <td className="py-2">
        <MinutesButtons mac={s.mac} onChanged={onChanged} />
      </td>
    </tr>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [tariffs, setTariffs] = useState<Tariff[]>([]); // оставим список (может пригодиться)
  const [busy, setBusy] = useState(false);

  async function ensureAuth() {
    try {
      const me = await adminApi.me();
      if (!me.ok) throw new Error();
      setAuthed(true);
    } catch {
      setAuthed(false);
      router.replace('/admin/login');
    }
  }

  async function refreshAll() {
    setBusy(true);
    try {
      const [s, t] = await Promise.all([adminApi.sessionsActive(), adminApi.tariffsAll()]);
      setSessions(s);
      setTariffs(t as Tariff[]);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    ensureAuth();
  }, []);

  useEffect(() => {
    if (authed) refreshAll();
  }, [authed]);

  if (authed === null) return null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Админка</h1>
          <button
            onClick={async () => {
              await adminApi.logout();
              router.replace('/admin/login');
            }}
            className="rounded bg-slate-700 px-3 py-2"
          >
            Выйти
          </button>
        </div>

        {/* Активные сессии */}
        <section className="rounded-xl bg-slate-900 ring-1 ring-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium">Активные сессии</h2>
            <button
              onClick={refreshAll}
              disabled={busy}
              className="rounded bg-slate-800 px-3 py-2 ring-1 ring-slate-700 hover:ring-slate-500"
            >
              Обновить
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-300">
                  <th className="py-2">MAC</th>
                  <th className="py-2">Активно до (лок.)</th>
                  <th className="py-2">Осталось</th>
                  <th className="py-2">Действия</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <SessionRow key={s.mac} s={s} onChanged={refreshAll} />
                ))}
                {sessions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      Нет активных сессий
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Блок тарифов (чтение) — можно скрыть, если не нужен */}
        {tariffs.length > 0 && (
          <section className="rounded-xl bg-slate-900 ring-1 ring-slate-800 p-4">
            <h2 className="text-lg font-medium">Тарифы (для справки)</h2>
            <div className="grid md:grid-cols-2 gap-3 mt-3">
              {tariffs.map((t) => (
                <div key={t.id} className="rounded-lg bg-slate-800 p-3 ring-1 ring-slate-700">
                  <div className="font-medium">{t.title}</div>
                  <div className="text-slate-300">
                    {t.durationMin} минут · {Number(t.priceKzt).toLocaleString('ru-RU')} ₸
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
