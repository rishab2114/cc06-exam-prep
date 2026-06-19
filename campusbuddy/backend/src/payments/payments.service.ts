import { Injectable, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { platformFee, providerNet, isValidTaskAmount } from '../common/utils/money';

/**
 * Escrow-like payment flow using Stripe with the **separate charges & transfers**
 * model (the provider is unknown when we place the hold). See docs/10.
 *
 *   create  -> PaymentIntent(manual capture) authorizes a hold on the customer's card
 *   assign  -> capture() moves funds to the platform balance
 *   release -> transfer() sends the provider's net (amount - 15% fee) to their Connect acct
 *
 * Money state is confirmed by webhooks (docs/10); this service only initiates.
 */
@Injectable()
export class PaymentsService {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
    apiVersion: '2023-10-16',
  });

  constructor(private prisma: PrismaService) {}

  /** Step 1: create the hold when a task is created. Returns client secret for Elements. */
  async createHold(taskId: string, customerId: string, amountCents: number) {
    if (!isValidTaskAmount(amountCents)) {
      throw new BadRequestException('Task amount below minimum value');
    }
    const fee = platformFee(amountCents);
    const net = providerNet(amountCents);

    const intent = await this.stripe.paymentIntents.create(
      {
        amount: amountCents,
        currency: 'sgd',
        capture_method: 'manual', // authorize now, capture on assignment
        metadata: { taskId, customerId },
      },
      { idempotencyKey: `hold_${taskId}` },
    );

    await this.prisma.payment.create({
      data: {
        taskId,
        customerId,
        amountCents,
        platformFeeCents: fee,
        providerAmountCents: net,
        status: 'REQUIRES_AUTH',
        stripePaymentIntentId: intent.id,
      },
    });

    return { clientSecret: intent.client_secret };
  }

  /** Step 2: capture the authorized hold when the customer selects a provider. */
  async captureOnAssign(taskId: string) {
    const payment = await this.prisma.payment.findUniqueOrThrow({ where: { taskId } });
    if (!payment.stripePaymentIntentId) throw new BadRequestException('No payment intent');

    await this.stripe.paymentIntents.capture(payment.stripePaymentIntentId, {
      idempotencyKey: `capture_${taskId}`,
    });
    // status -> CAPTURED is set by the webhook handler on payment_intent.succeeded
  }

  /** Step 3: release the provider's net to their Connect account on completion. */
  async releaseToProvider(taskId: string, providerStripeAccountId: string) {
    const payment = await this.prisma.payment.findUniqueOrThrow({ where: { taskId } });
    if (payment.status !== 'CAPTURED') {
      throw new BadRequestException('Funds not captured; cannot release');
    }

    const transfer = await this.stripe.transfers.create(
      {
        amount: payment.providerAmountCents,
        currency: payment.currency,
        destination: providerStripeAccountId,
        metadata: { taskId },
      },
      { idempotencyKey: `release_${taskId}` },
    );

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { taskId },
        data: { status: 'RELEASED', stripeTransferId: transfer.id },
      }),
      // Immutable ledger entries (balances are derived from these — see docs/02).
      this.prisma.ledgerEntry.create({
        data: {
          paymentId: payment.id,
          userId: payment.customerId,
          type: 'PLATFORM_FEE',
          amountCents: payment.platformFeeCents,
          stripeRef: transfer.id,
        },
      }),
      this.prisma.ledgerEntry.create({
        data: {
          paymentId: payment.id,
          type: 'PROVIDER_EARNING',
          amountCents: payment.providerAmountCents,
          stripeRef: transfer.id,
        },
      }),
    ]);

    return transfer.id;
  }

  /** Cancel the hold (task cancelled before capture). */
  async cancelHold(taskId: string) {
    const payment = await this.prisma.payment.findUniqueOrThrow({ where: { taskId } });
    if (payment.stripePaymentIntentId && payment.status === 'REQUIRES_AUTH') {
      await this.stripe.paymentIntents.cancel(payment.stripePaymentIntentId);
      await this.prisma.payment.update({ where: { taskId }, data: { status: 'FAILED' } });
    }
  }
}
