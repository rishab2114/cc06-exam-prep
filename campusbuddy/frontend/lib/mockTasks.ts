// Mock data for the demo (no backend needed yet). In production these come from
// the API. The fields encode the safety model from docs/16:
//  - requiresMatricVerification: task enters a private room or handles personal
//    belongings (cleaning, laundry) -> provider must be matric-verified.
//  - sameGenderOnly: customer opted into a same-gender buddy for an intimate
//    task (laundry / room cleaning). Framed as a comfort/safety PREFERENCE.
export type TaskTier = 'T1' | 'T2';

export interface MockTask {
  id: string;
  icon: string;
  title: string;
  category: string;
  priceCents: number;
  hall: string;
  when: string;
  distanceKm: number;
  customerName: string;
  customerGender: 'M' | 'F';
  customerRating: number;
  tier: TaskTier;
  requiresMatricVerification: boolean;
  sameGenderOnly: boolean;
}

export const MOCK_TASKS: MockTask[] = [
  {
    id: 'parcel-pickup',
    icon: '📦',
    title: 'Parcel pickup',
    category: 'Convenience',
    priceCents: 600,
    hall: 'Hall 10',
    when: 'now',
    distanceKm: 0.3,
    customerName: 'Jia Hui',
    customerGender: 'F',
    customerRating: 4.8,
    tier: 'T1',
    requiresMatricVerification: false,
    sameGenderOnly: false,
  },
  {
    id: 'laundry-pickup',
    icon: '🧺',
    title: 'Laundry pickup & wash',
    category: 'Laundry',
    priceCents: 1000,
    hall: 'Hall 9',
    when: '5–7pm',
    distanceKm: 0.5,
    customerName: 'Mei Lin',
    customerGender: 'F',
    customerRating: 5.0,
    tier: 'T2',
    requiresMatricVerification: true,
    sameGenderOnly: true,
  },
  {
    id: 'room-cleaning',
    icon: '🧹',
    title: 'Room cleaning',
    category: 'Hall Services',
    priceCents: 2000,
    hall: 'Hall 8',
    when: 'today',
    distanceKm: 0.7,
    customerName: 'Sarah',
    customerGender: 'F',
    customerRating: 4.9,
    tier: 'T2',
    requiresMatricVerification: true,
    sameGenderOnly: false,
  },
];

export function getTask(id: string): MockTask | undefined {
  return MOCK_TASKS.find((t) => t.id === id);
}

// Applicants who have offered to do a task. quoteCents is THEIR price — it can be
// above or below what the customer listed (open bidding). The customer browses the
// list and picks on price + rating + ETA, not just lowest price.
export interface Applicant {
  id: string;
  name: string;
  gender: 'M' | 'F';
  rating: number;
  completedJobs: number;
  matricVerified: boolean;
  quoteCents: number;
  message: string;
  etaMins: number;
}

const APPLICANTS: Record<string, Applicant[]> = {
  'room-cleaning': [
    { id: 'a1', name: 'Wei', gender: 'M', rating: 5.0, completedJobs: 12, matricVerified: true, quoteCents: 1800, message: 'Free now, can start in 15 min.', etaMins: 15 },
    { id: 'a2', name: 'Daniel', gender: 'M', rating: 4.7, completedJobs: 23, matricVerified: true, quoteCents: 2000, message: 'Can come right after my 2pm lab.', etaMins: 25 },
    { id: 'a3', name: 'Aisha', gender: 'F', rating: 4.9, completedJobs: 58, matricVerified: true, quoteCents: 2500, message: 'I bring my own supplies + do windows and skirting.', etaMins: 40 },
  ],
};

export function applicantsFor(taskId: string): Applicant[] {
  return APPLICANTS[taskId] ?? [];
}

// The signed-in provider, for the demo. matricVerified = account was verified
// at ONBOARDING (proves real NTU student). The per-task arrival scan is separate
// (see /app/task/[id]) and proves the assigned person actually showed up.
export const CURRENT_PROVIDER = {
  name: 'Priya',
  gender: 'F' as 'M' | 'F',
  matricVerified: true,
};
