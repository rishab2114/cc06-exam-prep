export const NTU_HALLS = [
  'Hall 1',
  'Hall 2',
  'Hall 3',
  'Hall 4',
  'Hall 5',
  'Hall 6',
  'Hall 7',
  'Hall 8',
  'Hall 9',
  'Hall 10',
  'Hall 11',
  'Hall 12',
  'Hall 13',
  'Hall 14',
  'Hall 15',
  'Hall 16',
  'Crescent Hall',
  'Pioneer Hall',
  'Binjai Hall',
  'Tanjong Hall',
  'Banyan Hall',
  'Saraca Hall',
  'Tamarind Hall',
] as const;

export const ROOM_TYPES = ['SINGLE', 'DOUBLE'] as const;
export const AIRCON_PREFERENCES = ['ANY', 'AIRCON', 'NON_AIRCON'] as const;
export const HALL_SWAP_TERMS = ['Semester 1', 'Semester 2', 'Full academic year'] as const;

export type RoomType = (typeof ROOM_TYPES)[number];
export type AirconPreference = (typeof AIRCON_PREFERENCES)[number];

export interface HallSwapPreferences {
  gender: 'MALE' | 'FEMALE';
  term: string;
  haveHall: string;
  haveRoomType: RoomType;
  haveAircon: boolean;
  wantedHalls: string[];
  wantedRoomTypes: RoomType[];
  wantedAircon: AirconPreference;
  isActive: boolean;
}

export interface HallSwapMatch {
  id: string;
  firstName: string;
  haveHall: string;
  haveRoomType: RoomType;
  haveAircon: boolean;
  term: string;
  matchType: 'EXACT' | 'FLEXIBLE';
  matchedOn: string[];
  connectionStatus: 'NONE' | 'SENT' | 'RECEIVED' | 'CONNECTED' | 'DECLINED';
  contact?: { name: string; email: string };
}

export interface HallSwapConnection {
  id: string;
  status: 'PENDING' | 'ACCEPTED';
  direction: 'INCOMING' | 'OUTGOING';
  firstName: string;
  room: string;
  contact?: { name: string; email: string };
}

export function roomLabel(roomType: RoomType, aircon: boolean): string {
  return `${roomType === 'SINGLE' ? 'Single' : 'Double'} · ${aircon ? 'Air-con' : 'Non-air-con'}`;
}

export function airconPreferenceLabel(value: AirconPreference): string {
  if (value === 'AIRCON') return 'Air-con only';
  if (value === 'NON_AIRCON') return 'Non-air-con only';
  return 'Either is fine';
}

export function preferenceAcceptsRoom(
  roomTypes: readonly RoomType[],
  airconPreference: AirconPreference,
  actualRoomType: RoomType,
  actualAircon: boolean,
): boolean {
  if (!roomTypes.includes(actualRoomType)) return false;
  if (airconPreference === 'ANY') return true;
  return actualAircon === (airconPreference === 'AIRCON');
}
