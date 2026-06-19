import { isNtuEmail } from './auth';

// Run with your test runner of choice (vitest/jest). Documents the NTU gate.
describe('isNtuEmail', () => {
  it('accepts NTU student/staff domains', () => {
    expect(isNtuEmail('priya@e.ntu.edu.sg')).toBe(true);
    expect(isNtuEmail('wei@ntu.edu.sg')).toBe(true);
  });
  it('rejects non-NTU domains', () => {
    expect(isNtuEmail('someone@gmail.com')).toBe(false);
    expect(isNtuEmail('hacker@notntu.edu.sg')).toBe(false);
    expect(isNtuEmail('bad@e.ntu.edu.sg.evil.com')).toBe(false);
  });
});
