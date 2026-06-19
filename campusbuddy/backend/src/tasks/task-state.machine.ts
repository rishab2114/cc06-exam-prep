import { TaskStatus } from '@prisma/client';

/**
 * The single place that defines the task lifecycle. Every transition the app
 * performs must be validated here, and each one writes a row to task_events.
 * Side-effects (capture/release/notify) are wired in tasks.service per edge.
 *
 *   DRAFT -> OPEN -> ASSIGNED -> IN_PROGRESS -> COMPLETED -> CLOSED
 * with branches CANCELLED and DISPUTED. See docs/04 and docs/06.
 */
export const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  DRAFT: ['OPEN', 'CANCELLED'],
  OPEN: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['IN_PROGRESS', 'CANCELLED', 'DISPUTED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED', 'DISPUTED'],
  COMPLETED: ['CLOSED', 'DISPUTED'],
  CLOSED: [],
  CANCELLED: [],
  DISPUTED: ['CLOSED', 'CANCELLED'], // resolved by admin
};

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export class InvalidTransitionError extends Error {
  constructor(from: TaskStatus, to: TaskStatus) {
    super(`Invalid task transition: ${from} -> ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

export function assertTransition(from: TaskStatus, to: TaskStatus): void {
  if (!canTransition(from, to)) throw new InvalidTransitionError(from, to);
}
