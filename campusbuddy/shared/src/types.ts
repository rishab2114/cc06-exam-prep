/**
 * Domain types shared across web and api. The frontend's former `MockTask`
 * interface is now `Task` here — the API's response DTOs conform to this shape,
 * so integration is a data-source swap rather than a type migration.
 */
export type TaskTier = 'T1' | 'T2' | 'T3';

export interface StudyRequest {
  module: string;
  topics: string[];
  level: string;
  helpTypes: string[];
  goal: string;
  format: string;
}

export interface Task {
  id: string;
  icon: string;
  title: string;
  category: string;
  priceCents: number;
  hall: string;
  when: string;
  customerName: string;
  description?: string;
  // Real customer geo/gender/reputation don't exist until the profile +
  // reviews flows land — these are optional so the API never fabricates them.
  distanceKm?: number;
  customerGender?: 'M' | 'F';
  customerRating?: number | null;
  tier: TaskTier;
  requiresMatricVerification: boolean;
  sameGenderOnly: boolean;
  // Customer must be present the whole time (in-room tasks like cleaning).
  presenceRequired: boolean;
  // Doorstep handoff, no room entry, Grab-style status updates (laundry).
  contactless: boolean;
  study?: StudyRequest;
}
