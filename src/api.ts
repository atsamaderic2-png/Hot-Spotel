import { AdminStats, Reservation, Room, User } from './types';

const TOKEN_KEY = 'kbn_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiFetch<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: { name: string; email: string; phone: string; password: string }) =>
    apiFetch<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  me: () => apiFetch<{ user: User }>('/api/auth/me'),

  updateProfile: (payload: { name: string; email: string; phone: string; newPassword?: string }) =>
    apiFetch<{ token: string; user: User }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Rooms
  searchRooms: (params: {
    q?: string;
    category?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    maxPrice?: number;
    amenity?: string;
    includeMaintenance?: boolean;
  }) => {
    const sp = new URLSearchParams();
    if (params.q) sp.set('q', params.q);
    if (params.category && params.category !== 'all') sp.set('category', params.category);
    if (params.checkIn) sp.set('checkIn', params.checkIn);
    if (params.checkOut) sp.set('checkOut', params.checkOut);
    if (params.guests && params.guests > 0) sp.set('guests', String(params.guests));
    if (params.maxPrice && params.maxPrice > 0) sp.set('maxPrice', String(params.maxPrice));
    if (params.amenity) sp.set('amenity', params.amenity);
    if (params.includeMaintenance) sp.set('includeMaintenance', 'true');
    const qs = sp.toString();
    return apiFetch<{ rooms: Room[] }>(`/api/rooms${qs ? `?${qs}` : ''}`);
  },

  getRoom: (id: number) =>
    apiFetch<{ room: Room; bookedRanges: { check_in: string; check_out: string; status: string }[] }>(
      `/api/rooms/${id}`
    ),

  // Reservations
  createReservation: (payload: {
    roomId: number;
    checkIn: string;
    checkOut: string;
    guestsCount: number;
    paymentMethod: 'orange_money' | 'mtn_momo' | 'visa_mastercard';
    paymentPhone: string;
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    specialRequests: string;
  }) =>
    apiFetch<{ reservation: Reservation }>('/api/reservations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMyReservations: () => apiFetch<{ reservations: Reservation[] }>('/api/reservations/my'),

  cancelReservation: (id: number) =>
    apiFetch<{ reservation: Reservation }>(`/api/reservations/${id}/cancel`, { method: 'POST' }),

  // Receipt Verification Scanner
  verifyReceipt: (rawPayload: string) =>
    apiFetch<{
      valid: boolean;
      reason?: string;
      searchedCode?: string;
      signatureVerified?: boolean;
      isCancelled?: boolean;
      reservation?: Reservation;
      canManage?: boolean;
    }>('/api/receipts/verify', {
      method: 'POST',
      body: JSON.stringify({ rawPayload }),
    }),

  // Admin
  adminStats: () => apiFetch<{ stats: AdminStats }>('/api/admin/stats'),
  adminUsers: () => apiFetch<{ users: User[] }>('/api/admin/users'),
  adminCreateUser: (payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: 'guest' | 'admin';
    status: 'active' | 'suspended';
  }) =>
    apiFetch<{ user: User }>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  adminUpdateUser: (
    id: number,
    payload: {
      name: string;
      email: string;
      phone: string;
      role: 'guest' | 'admin';
      status: 'active' | 'suspended';
      newPassword?: string;
    }
  ) =>
    apiFetch<{ user: User }>(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  adminDeleteUser: (id: number) =>
    apiFetch<{ deleted: boolean }>(`/api/admin/users/${id}`, { method: 'DELETE' }),

  adminCreateRoom: (payload: Partial<Room>) =>
    apiFetch<{ room: Room }>('/api/admin/rooms', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  adminUpdateRoom: (id: number, payload: Partial<Room>) =>
    apiFetch<{ room: Room }>(`/api/admin/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  adminDeleteRoom: (id: number) =>
    apiFetch<{ deleted: boolean }>(`/api/admin/rooms/${id}`, { method: 'DELETE' }),

  adminReservations: () => apiFetch<{ reservations: Reservation[] }>('/api/admin/reservations'),
  adminUpdateReservation: (id: number, payload: { status?: string; payment_status?: string }) =>
    apiFetch<{ reservation: Reservation }>(`/api/admin/reservations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  adminDeleteReservation: (id: number) =>
    apiFetch<{ deleted: boolean }>(`/api/admin/reservations/${id}`, { method: 'DELETE' }),
};
