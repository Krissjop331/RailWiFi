export type Tariff = {
  id: string;
  title: string;
  durationMin: number;
  // Prisma Decimal сериализуется строкой
  priceKzt: string;
  active: boolean;
};

export type PaymentCreateRes = {
  paymentId: string;
  providerOrderId: string;
  payUrl: string;
  qrUrl: string;
  status: 'created' | 'pending' | 'paid' | 'failed' | 'expired' | 'refunded';
};

export type PaymentStatusRes = {
  status: 'created' | 'pending' | 'paid' | 'failed' | 'expired' | 'refunded';
  paidUntilUtc: string | null;
  paidUntilLocal: string | null;
  timezone: string;
};

export type PaymentConfirmRes = {
  status: string; // 'paid'
  paidUntilUtc: string;
  paidUntilLocal: string;
  timezone: string;
  already?: boolean;
};

export type AuthorizeRes = {
  allowed: boolean;
  expiresAtUtc: string | null;
  expiresAtLocal: string | null;
  timezone: string;
};

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

async function http<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    cache: 'no-store',
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${txt}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  tariffs: () => http<Tariff[]>(`${BASE}/tariffs`),

  createPayment: (mac: string, tariffId: string) =>
    http<PaymentCreateRes>(`${BASE}/payments`, {
      method: 'POST',
      body: JSON.stringify({ mac, tariffId }),
    }),

  paymentStatus: (paymentId: string) =>
    http<PaymentStatusRes>(`${BASE}/payments/${paymentId}/status`),

  mockConfirm: (paymentId: string) =>
    http<PaymentConfirmRes>(`${BASE}/payments/${paymentId}/mock-confirm`, { method: 'POST' }),

  authorize: (mac: string) =>
    http<AuthorizeRes>(`${BASE}/portal/authorize`, {
      method: 'POST',
      body: JSON.stringify({ mac }),
    }),
};

async function httpAdmin<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    credentials: 'include', // <— ключ: отправляем/получаем cookie
    cache: 'no-store',
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${txt}`);
  }
  return res.json() as Promise<T>;
}

export const adminApi = {
  login: (username: string, password: string) =>
    httpAdmin<{ ok: true }>(`${BASE}/admin/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  logout: () => httpAdmin<{ ok: true }>(`${BASE}/admin/auth/logout`, { method: 'POST' }),
  me: () => httpAdmin<{ ok: boolean; role?: string }>(`${BASE}/admin/auth/me`),

  sessionsActive: () =>
    httpAdmin<
      Array<{
        mac: string;
        grantedAtUtc: string;
        expiresAtUtc: string;
        expiresAtLocal: string;
        minutesLeft: number;
        timezone: string;
      }>
    >(`${BASE}/admin/sessions?active=true`),

  extend: (mac: string, minutes: number) =>
    httpAdmin<{
      ok: true;
      mac: string;
      expiresAtUtc: string;
      expiresAtLocal: string;
      timezone: string;
    }>(`${BASE}/admin/sessions/${encodeURIComponent(mac)}/extend`, {
      method: 'POST',
      body: JSON.stringify({ minutes }),
    }),

  terminate: (mac: string) =>
    httpAdmin<{ ok: true; mac: string; changed: number }>(
      `${BASE}/admin/sessions/${encodeURIComponent(mac)}`,
      { method: 'DELETE' }
    ),

  tariffsAll: () => httpAdmin(`${BASE}/admin/tariffs`),

  createTariff: (t: { title: string; durationMin: number; priceKzt: number; active?: boolean }) =>
    httpAdmin(`${BASE}/admin/tariffs`, {
      method: 'POST',
      body: JSON.stringify(t),
    }),

  updateTariff: (
    id: string,
    t: Partial<{ title: string; durationMin: number; priceKzt: number; active: boolean }>
  ) =>
    httpAdmin(`${BASE}/admin/tariffs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(t),
    }),

  deleteTariff: (id: string) => httpAdmin(`${BASE}/admin/tariffs/${id}`, { method: 'DELETE' }),
};
