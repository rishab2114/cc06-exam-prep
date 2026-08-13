import { platformFee, providerNet, isValidTaskAmount, formatSgd } from './money';

describe('money', () => {
  it('charges a progressive fee (S$20 -> 1% of first $10 + 3% of next $10 = S$0.40)', () => {
    // 0.01*1000 + 0.03*1000 = 10 + 30 = 40 cents
    expect(platformFee(2000)).toBe(40);
    expect(providerNet(2000)).toBe(1960);
  });

  it('charges only 1% within the first bracket (S$5 -> S$0.05)', () => {
    expect(platformFee(500)).toBe(5);
    expect(providerNet(500)).toBe(495);
  });

  it('reaches toward 5% on large tasks (S$100 -> S$4.20, ~4.2%)', () => {
    // 0.01*1000 + 0.03*2000 + 0.05*7000 = 10 + 60 + 350 = 420
    expect(platformFee(10000)).toBe(420);
  });

  it('accepts any positive task amount (no minimum)', () => {
    expect(isValidTaskAmount(0)).toBe(false);
    expect(isValidTaskAmount(100)).toBe(true);
    expect(isValidTaskAmount(2000)).toBe(true);
  });

  it('formats cents as SGD', () => {
    expect(formatSgd(1700)).toBe('S$17.00');
    expect(formatSgd(40)).toBe('S$0.40');
  });
});
