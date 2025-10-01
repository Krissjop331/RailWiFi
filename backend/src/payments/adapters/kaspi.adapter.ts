import { randomUUID } from 'crypto';

export class KaspiStubAdapter {
  async createOrder(amountKzt: number, meta: Record<string, any>) {
    const providerOrderId = 'stub_' + randomUUID();
    const payUrl = `http://localhost:5001/api/payments/${providerOrderId}/fake-pay`;
    return { providerOrderId, payUrl, qrUrl: payUrl };
  }
}
