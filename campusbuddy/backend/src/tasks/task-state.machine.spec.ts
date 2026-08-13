import { canTransition, assertTransition, InvalidTransitionError } from './task-state.machine';

describe('task-state.machine', () => {
  it('allows the happy path', () => {
    expect(canTransition('OPEN', 'ASSIGNED')).toBe(true);
    expect(canTransition('ASSIGNED', 'IN_PROGRESS')).toBe(true);
    expect(canTransition('IN_PROGRESS', 'COMPLETED')).toBe(true);
    expect(canTransition('COMPLETED', 'CLOSED')).toBe(true);
  });

  it('rejects illegal jumps', () => {
    expect(canTransition('OPEN', 'COMPLETED')).toBe(false);
    expect(canTransition('CLOSED', 'OPEN')).toBe(false);
    expect(() => assertTransition('OPEN', 'COMPLETED')).toThrow(InvalidTransitionError);
  });

  it('allows dispute branches and admin resolution', () => {
    expect(canTransition('IN_PROGRESS', 'DISPUTED')).toBe(true);
    expect(canTransition('DISPUTED', 'CLOSED')).toBe(true);
  });
});
