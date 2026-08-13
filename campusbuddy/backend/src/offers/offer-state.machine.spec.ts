import {
  OfferState,
  OfferActor,
  canTransitionOffer,
  assertOfferTransition,
  InvalidOfferTransitionError,
  canAct,
} from '@campusbuddy/shared';

describe('offer state machine', () => {
  it('allows the full bargaining loop: pending -> countered -> countered -> accepted', () => {
    expect(canTransitionOffer(OfferState.PENDING, OfferState.COUNTERED)).toBe(true);
    expect(canTransitionOffer(OfferState.COUNTERED, OfferState.COUNTERED)).toBe(true);
    expect(canTransitionOffer(OfferState.COUNTERED, OfferState.ACCEPTED)).toBe(true);
  });

  it('allows direct acceptance and every open-state exit', () => {
    for (const to of [OfferState.ACCEPTED, OfferState.DECLINED, OfferState.WITHDRAWN, OfferState.EXPIRED]) {
      expect(canTransitionOffer(OfferState.PENDING, to)).toBe(true);
      expect(canTransitionOffer(OfferState.COUNTERED, to)).toBe(true);
    }
  });

  it('terminal states are terminal — no zombie negotiations', () => {
    for (const from of [OfferState.ACCEPTED, OfferState.DECLINED, OfferState.WITHDRAWN, OfferState.EXPIRED]) {
      for (const to of Object.values(OfferState)) {
        expect(canTransitionOffer(from, to)).toBe(false);
      }
    }
  });

  it('assertOfferTransition throws a typed error on illegal moves', () => {
    expect(() => assertOfferTransition(OfferState.ACCEPTED, OfferState.COUNTERED)).toThrow(
      InvalidOfferTransitionError,
    );
    expect(() => assertOfferTransition(OfferState.PENDING, OfferState.ACCEPTED)).not.toThrow();
  });

  describe('turn-taking (canAct)', () => {
    it('only the side that did NOT move last may accept or counter', () => {
      // Provider quoted (lastActor=PROVIDER): customer's turn.
      expect(canAct('accept', OfferState.PENDING, OfferActor.PROVIDER, OfferActor.CUSTOMER)).toBe(true);
      expect(canAct('counter', OfferState.PENDING, OfferActor.PROVIDER, OfferActor.CUSTOMER)).toBe(true);
      expect(canAct('accept', OfferState.PENDING, OfferActor.PROVIDER, OfferActor.PROVIDER)).toBe(false);
      // Customer countered (lastActor=CUSTOMER): provider's turn.
      expect(canAct('accept', OfferState.COUNTERED, OfferActor.CUSTOMER, OfferActor.PROVIDER)).toBe(true);
      expect(canAct('counter', OfferState.COUNTERED, OfferActor.CUSTOMER, OfferActor.CUSTOMER)).toBe(false);
    });

    it('either side may decline; only the provider may withdraw; nobody acts on closed offers', () => {
      expect(canAct('decline', OfferState.COUNTERED, OfferActor.CUSTOMER, OfferActor.CUSTOMER)).toBe(true);
      expect(canAct('withdraw', OfferState.PENDING, OfferActor.PROVIDER, OfferActor.CUSTOMER)).toBe(false);
      expect(canAct('withdraw', OfferState.PENDING, OfferActor.PROVIDER, OfferActor.PROVIDER)).toBe(true);
      expect(canAct('accept', OfferState.ACCEPTED, OfferActor.PROVIDER, OfferActor.CUSTOMER)).toBe(false);
    });
  });
});
