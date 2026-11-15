export type Language = 'en' | 'fr';

export type UserRole = 'guest' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
}

export type RoomCategory = 'standard' | 'deluxe' | 'suite' | 'penthouse';
export type RoomStatus = 'available' | 'maintenance';

export interface Room {
  id: number;
  room_number: string;
  slug: string;
  category: RoomCategory;
  name_en: string;
  name_fr: string;
  description_en: string;
  description_fr: string;
  price_per_night: number;
  capacity: number;
  size_sqm: number;
  bed_type_en: string;
  bed_type_fr: string;
  floor: number;
  amenities: string[];
  images: string[];
  status: RoomStatus;
  available_for_dates?: boolean;
  booked_overlap?: { check_in: string; check_out: string } | null;
  created_at: string;
}

export type PaymentMethod = 'orange_money' | 'mtn_momo' | 'visa_mastercard';
export type ReservationStatus = 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';

export interface Reservation {
  id: number;
  receipt_code: string;
  qr_signature: string;
  qr_payload: string;
  user_id: number;
  room_id: number;
  room_number?: string;
  room_name_en?: string;
  room_name_fr?: string;
  room_category?: RoomCategory;
  room_image?: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  nights: number;
  guests_count: number;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_phone: string;
  payment_reference: string;
  payment_status: 'paid' | 'refunded';
  status: ReservationStatus;
  special_requests: string;
  created_at: string;
}

export interface SalesSeriesPoint {
  label: string;
  date: string;
  revenue: number;
  bookings: number;
}

export interface PaymentBreakdownItem {
  method: PaymentMethod;
  count: number;
  revenue: number;
}

export interface CategorySalesItem {
  category: RoomCategory;
  count: number;
  revenue: number;
}

export interface AdminStats {
  totalRevenue: number;
  averageBookingValue: number;
  occupancyRate: number;
  activeReservations: number;
  totalReservations: number;
  availableRooms: number;
  totalRooms: number;
  totalUsers: number;
  salesSeries: SalesSeriesPoint[];
  paymentBreakdown: PaymentBreakdownItem[];
  categorySales: CategorySalesItem[];
}

