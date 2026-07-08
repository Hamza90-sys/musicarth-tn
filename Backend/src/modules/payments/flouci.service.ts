import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const FLOUCI_API_BASE = 'https://developers.flouci.com/api/v2';

export interface FlouciVerifyResult {
  success: boolean;
  status: string; // SUCCESS | PENDING | EXPIRED | FAILURE | PREAUTH_SUCCESS | SYSTEM_FAILURE
  amount: number; // millimes
}

/**
 * Thin client for the Flouci payment gateway (Tunisia). Auth is a single header:
 *   Authorization: Bearer <PUBLIC_TOKEN>:<PRIVATE_TOKEN>
 * The public token doubles as the app identifier.
 */
@Injectable()
export class FlouciService {
  private readonly logger = new Logger(FlouciService.name);
  private readonly publicToken: string;
  private readonly privateToken: string;

  constructor(private readonly config: ConfigService) {
    this.publicToken = this.config.get<string>('FLOUCI_PUBLIC_TOKEN', '');
    this.privateToken = this.config.get<string>('FLOUCI_PRIVATE_TOKEN', '');
  }

  get isConfigured(): boolean {
    return Boolean(this.publicToken && this.privateToken);
  }

  private authHeader(): string {
    return `Bearer ${this.publicToken}:${this.privateToken}`;
  }

  async generatePayment(params: {
    amountMillimes: number;
    successLink: string;
    failLink: string;
    trackingId: string;
    webhook?: string;
  }): Promise<{ paymentId: string; link: string }> {
    if (!this.isConfigured) {
      throw new ServiceUnavailableException('Payments are not configured');
    }
    const res = await fetch(`${FLOUCI_API_BASE}/generate_payment`, {
      method: 'POST',
      headers: { Authorization: this.authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: String(params.amountMillimes),
        accept_card: true,
        session_timeout_secs: 1200,
        success_link: params.successLink,
        fail_link: params.failLink,
        developer_tracking_id: params.trackingId,
        ...(params.webhook ? { webhook: params.webhook } : {}),
      }),
    });
    const data = await res.json().catch(() => null);
    const body = data?.result ?? data;
    const paymentId = body?.payment_id ?? body?.paymentId;
    const link = body?.link;
    if (!res.ok || !paymentId || !link) {
      this.logger.error(
        `Flouci generate_payment failed (${res.status}): ${JSON.stringify(data)}`,
      );
      throw new ServiceUnavailableException('Could not start the payment');
    }
    return { paymentId: String(paymentId), link: String(link) };
  }

  /** Full refund of a completed payment. Flouci only supports refund-by-payment-id. */
  async refundPayment(providerPaymentId: string): Promise<{ ok: boolean; message?: string }> {
    if (!this.isConfigured) {
      throw new ServiceUnavailableException('Payments are not configured');
    }
    const res = await fetch(`${FLOUCI_API_BASE}/refund_payment`, {
      method: 'POST',
      headers: { Authorization: this.authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_id: providerPaymentId }),
    });
    const data = await res.json().catch(() => null);
    const body = data?.result ?? data;
    const ok = res.ok && String(body?.status ?? data?.status ?? '').toLowerCase() !== 'error';
    if (!ok) {
      this.logger.error(`Flouci refund failed (${res.status}): ${JSON.stringify(data)}`);
    }
    return { ok, message: body?.message ?? data?.message };
  }

  async verifyPayment(providerPaymentId: string): Promise<FlouciVerifyResult> {
    if (!this.isConfigured) {
      throw new ServiceUnavailableException('Payments are not configured');
    }
    const res = await fetch(
      `${FLOUCI_API_BASE}/verify_payment/${encodeURIComponent(providerPaymentId)}`,
      { headers: { Authorization: this.authHeader() } },
    );
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) {
      this.logger.error(
        `Flouci verify_payment failed (${res.status}): ${JSON.stringify(data)}`,
      );
      throw new ServiceUnavailableException('Could not verify the payment');
    }
    const body = data.result ?? data;
    return {
      success: Boolean(data.success ?? body.success),
      status: String(body.status ?? data.status ?? 'PENDING'),
      amount: Number(body.amount ?? data.amount ?? 0),
    };
  }
}
