/**
 * Offer (negotiation) state machine — the single place that defines how
 * bargaining moves. Mirrors the Prisma `OfferState` enum exactly; the DB and
 * this file must never disagree.
 *
 * Model: ONE Offer row per (task, provider) negotiation thread. `round`
 * increments on each counter; whoever countered last is `lastActor`, and the
 * other side may accept, counter, or decline. History rows go to TaskEvent.
 *
 *   PENDING ──▶ COUNTERED ⟲ (either side keeps countering)
 *      │             │
 *      ├─▶ ACCEPTED ◀┤   (terminal — offers.service assigns the task and
 *      ├─▶ DECLINED ◀┤    declines all sibling offers in the same txn)
 *      ├─▶ WITHDRAWN◀┤   (terminal — provider pulls out)
 *      └─▶ EXPIRED  ◀┘   (terminal — TTL job)
 */
export enum OfferState {
  PENDING = 'PENDING',
  COUNTERED = 'COUNTERED',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  WITHDRAWN = 'WITHDRAWN',
  EXPIRED = 'EXPIRED',
}

export enum OfferActor {
  CUSTOMER = 'CUSTOMER',
  PROVIDER = 'PROVIDER',
}

export const ALLOWED_OFFER_TRANSITIONS: Record<OfferState, OfferState[]> = {
  [OfferState.PENDING]: [
    OfferState.COUNTERED,
    OfferState.ACCEPTED,
    OfferState.DECLINED,
    OfferState.WITHDRAWN,
    OfferState.EXPIRED,
  ],
  [OfferState.COUNTERED]: [
    OfferState.COUNTERED, // counter-of-a-counter: rounds keep incrementing
    OfferState.ACCEPTED,
    OfferState.DECLINED,
    OfferState.WITHDRAWN,
    OfferState.EXPIRED,
  ],
  [OfferState.ACCEPTED]: [],
  [OfferState.DECLINED]: [],
  [OfferState.WITHDRAWN]: [],
  [OfferState.EXPIRED]: [],
};

export function canTransitionOffer(from: OfferState, to: OfferState): boolean {
  return ALLOWED_OFFER_TRANSITIONS[from]?.includes(to) ?? false;
}

export class InvalidOfferTransitionError extends Error {
  constructor(from: OfferState, to: OfferState) {
    super(`Invalid offer transition: ${from} -> ${to}`);
    this.name = 'InvalidOfferTransitionError';
  }
}

export function assertOfferTransition(from: OfferState, to: OfferState): void {
  if (!canTransitionOffer(from, to)) throw new InvalidOfferTransitionError(from, to);
}

/**
 * Who is allowed to act on an offer in its current state: only the side whose
 * turn it is (i.e. NOT the lastActor) may accept or counter. Either side may
 * decline; only the provider may withdraw.
 */
export function canAct(
  action: 'accept' | 'counter' | 'decline' | 'withdraw',
  state: OfferState,
  lastActor: OfferActor,
  actor: OfferActor,
): boolean {
  const open = state === OfferState.PENDING || state === OfferState.COUNTERED;
  if (!open) return false;
  switch (action) {
    case 'accept':
    case 'counter':
      return actor !== lastActor; // it's your turn only if the other side moved last
    case 'decline':
      return true;
    case 'withdraw':
      return actor === OfferActor.PROVIDER;
  }
}
