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
  // presenceRequired: customer must be present the whole time — the buddy is never
  // alone in the room. Default for in-room tasks like cleaning (safety redesign).
  presenceRequired: boolean;
  // contactless: doorstep handoff (bag left outside), no room entry. Buddy sends
  // Grab-style status updates. Used for laundry.
  contactless: boolean;
}

export const MOCK_TASKS: MockTask[] = [
  {
    id: 'parcel-pickup',
    icon: '📦',
    title: 'Parcel pickup',
    category: 'Convenience',
    priceCents: 600,
    hall: 'Block 57',
    when: 'now',
    distanceKm: 0.3,
    customerName: 'Jia Hui',
    customerGender: 'F',
    customerRating: 4.8,
    tier: 'T1',
    requiresMatricVerification: false,
    sameGenderOnly: false,
    presenceRequired: false,
    contactless: false,
  },
  {
    id: 'extra-meal',
    icon: '🍱',
    title: 'Spare home-cooked dinner',
    category: 'Food',
    priceCents: 700,
    hall: 'Block 55',
    when: 'tonight 7pm',
    distanceKm: 0.4,
    customerName: 'Arjun',
    customerGender: 'M',
    customerRating: 4.6,
    tier: 'T1',
    requiresMatricVerification: false,
    sameGenderOnly: false,
    presenceRequired: false,
    contactless: false,
  },
  {
    id: 'laundry-pickup',
    icon: '🧺',
    title: 'Laundry pickup & wash',
    category: 'Laundry',
    priceCents: 1000,
    hall: 'Block 59',
    when: '5–7pm',
    distanceKm: 0.5,
    customerName: 'Mei Lin',
    customerGender: 'F',
    customerRating: 5.0,
    tier: 'T2',
    requiresMatricVerification: true,
    sameGenderOnly: true,
    presenceRequired: false,
    contactless: true,
  },
  {
    id: 'room-cleaning',
    icon: '🧹',
    title: 'Room cleaning',
    category: 'Hostel Services',
    priceCents: 2000,
    hall: 'Block 58',
    when: 'today',
    distanceKm: 0.7,
    customerName: 'Sarah',
    customerGender: 'F',
    customerRating: 4.9,
    tier: 'T2',
    requiresMatricVerification: true,
    sameGenderOnly: true,
    presenceRequired: true,
    contactless: false,
  },
  {
    id: 'room-move',
    icon: '🧳',
    title: 'Room shift & storage help',
    category: 'Moving',
    priceCents: 1500,
    hall: 'Block 56',
    when: 'Sat 10am',
    distanceKm: 0.6,
    customerName: 'Daryl',
    customerGender: 'M',
    customerRating: 4.7,
    tier: 'T1',
    requiresMatricVerification: false,
    sameGenderOnly: false,
    presenceRequired: true,
    contactless: false,
  },
  {
    id: 'study-help',
    icon: '📚',
    title: 'Calculus II — exam prep session',
    category: 'Study help',
    priceCents: 2500,
    hall: 'Library / online',
    when: 'this week',
    distanceKm: 0.2,
    customerName: 'Rachel',
    customerGender: 'F',
    customerRating: 4.9,
    tier: 'T1',
    requiresMatricVerification: false,
    sameGenderOnly: false,
    presenceRequired: false,
    contactless: false,
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
  // Same-gender cleaning task for a female customer -> female buddies only.
  'room-cleaning': [
    { id: 'a1', name: 'Nur', gender: 'F', rating: 5.0, completedJobs: 12, matricVerified: true, quoteCents: 1800, message: 'Free now, can start in 15 min.', etaMins: 15 },
    { id: 'a2', name: 'Priya', gender: 'F', rating: 4.7, completedJobs: 23, matricVerified: true, quoteCents: 2000, message: 'Can come right after my 2pm lab.', etaMins: 25 },
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
  campus: 'NTU',
  school: 'School of Computer Science & Engineering',
  hall: 'Hall 9',
  year: 'Year 2',
  rating: 4.9,
  completedJobs: 58,
  availableCents: 8400,
  monthCents: 21000,
  services: ['Laundry', 'Study help', 'Parcel', 'Move/Shift'],
};

// Mock wallet history for the earnings screen.
export const WALLET_HISTORY = [
  { id: 'w1', label: 'Study help · Calculus II', date: 'Jun 18', deltaCents: 2500 },
  { id: 'w2', label: 'Laundry pickup & wash', date: 'Jun 17', deltaCents: 1000 },
  { id: 'w3', label: 'Parcel pickup', date: 'Jun 16', deltaCents: 600 },
  { id: 'w4', label: 'Payout to bank', date: 'Jun 15', deltaCents: -8400 },
  { id: 'w5', label: 'Room shift help', date: 'Jun 14', deltaCents: 1500 },
];

// Grab-style laundry status timeline, shared by the provider (who advances it) and
// the customer (who watches it). `text` is the notification the customer receives.
export const LAUNDRY_STEPS = [
  { label: 'Picked up from door', text: 'Buddy collected your laundry bag 🧺' },
  { label: 'Washing', text: 'Your laundry is in the wash 🫧' },
  { label: 'Drying', text: 'Drying now ☀️' },
  { label: 'On the way back', text: 'On the way back to your door 🚶' },
  { label: 'Left at your door', text: 'Left at your door — all done! ✅' },
];
