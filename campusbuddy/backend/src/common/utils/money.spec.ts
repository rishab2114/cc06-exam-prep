import { platformFee, providerNet, isValidTaskAmount, formatSgd } from './money';

describe('money', () => {
  it('charges 15% on the brief example (S$20 -> fee S$3, provider S$17)', () => {
    expect(platformFee(2000)).toBe(300);
    expect(providerNet(2000)).toBe(1700);
  });

  it('applies the fee floor on small tasks', () => {
    // 15% of S$5 = S$0.75, but floor is S$1.00
    expect(platformFee(500)).toBe(100);
    expect(providerNet(500)).toBe(400);
  });

  it('rejects tasks below the minimum value', () => {
    expect(isValidTaskAmount(499)).toBe(false);
    expect(isValidTaskAmount(500)).toBe(true);
    expect(isValidTaskAmount(2000)).toBe(true);
  });

  it('formats cents as SGD', () => {
    expect(formatSgd(1700)).toBe('S$17.00');
    expect(formatSgd(300)).toBe('S$3.00');
  });
});
