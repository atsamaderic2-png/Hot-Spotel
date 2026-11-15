import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db, { initDatabase, signReceiptPayload, buildQrPayload } from './server/db';

initDatabase();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'kasbah-nour-hotel-secret-2026';

app.use(express.json({ limit: '2mb' }));

interface AuthUserPayload {
  id: number;
  email: string;
  role: 'guest' | 'admin';
}

interface AuthenticatedRequest extends Request {
  authUser?: AuthUserPayload;
}

function generateToken(user: { id: number; email: string; role: 'guest' | 'admin' }) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: '7d',
  });
}

function sanitizeUser(row: any) {
  if (!row) return null;
  const { password_hash: _removed, ...rest } = row;
  return rest;
}

function mapRoom(
  row: any,
  availableForDates?: boolean,
  bookedOverlap?: { check_in: string; check_out: string } | null
) {
  return {
    id: row.id,
    room_number: row.room_number,
    slug: row.slug,
    category: row.category,
    name_en: row.name_en,
    name_fr: row.name_fr,
    description_en: row.description_en,
    description_fr: row.description_fr,
    price_per_night: row.price_per_night,
    capacity: row.capacity,
    size_sqm: row.size_sqm,
    bed_type_en: row.bed_type_en,
    bed_type_fr: row.bed_type_fr,
    floor: row.floor,
    amenities: JSON.parse(row.amenities_json || '[]'),
    images: JSON.parse(row.images_json || '[]'),
    status: row.status,
    available_for_dates: availableForDates ?? row.status === 'available',
    booked_overlap: bookedOverlap || null,
    created_at: row.created_at,
  };
}

function mapReservation(row: any) {
  const images = row.room_images_json ? JSON.parse(row.room_images_json) : [];
  return {
    id: row.id,
    receipt_code: row.receipt_code,
    qr_signature: row.qr_signature,
    qr_payload: buildQrPayload(row.receipt_code, row.qr_signature),
    user_id: row.user_id,
    room_id: row.room_id,
    room_number: row.room_number,
    room_name_en: row.room_name_en,
    room_name_fr: row.room_name_fr,
    room_category: row.room_category,
    room_image: images[0] || '',
    guest_name: row.guest_name,
    guest_email: row.guest_email,
    guest_phone: row.guest_phone,
    check_in: row.check_in,
    check_out: row.check_out,
    nights: row.nights,
    guests_count: row.guests_count,
    total_amount: row.total_amount,
    payment_method: row.payment_method,
    payment_phone: row.payment_phone,
    payment_reference: row.payment_reference,
    payment_status: row.payment_status,
    status: row.status,
    special_requests: row.special_requests,
    created_at: row.created_at,
  };
}

function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
    const dbUser = db.prepare('SELECT id, email, role, status FROM users WHERE id = ?').get(decoded.id) as any;
    if (!dbUser || dbUser.status === 'suspended') {
      res.status(403).json({ error: 'Account inactive or suspended' });
      return;
    }
    req.authUser = { id: dbUser.id, email: dbUser.email, role: dbUser.role };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function optionalAuthenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(header.slice(7), JWT_SECRET) as AuthUserPayload;
      const dbUser = db.prepare('SELECT id, email, role, status FROM users WHERE id = ?').get(decoded.id) as any;
      if (dbUser && dbUser.status === 'active') {
        req.authUser = { id: dbUser.id, email: dbUser.email, role: dbUser.role };
      }
    } catch {
      // ignore invalid optional token
    }
  }
  next();
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.authUser || req.authUser.role !== 'admin') {
    res.status(403).json({ error: 'Administrator access required' });
    return;
  }
  next();
}

function calculateNights(checkIn: string, checkOut: string): number {
  const d1 = new Date(`${checkIn}T00:00:00Z`);
  const d2 = new Date(`${checkOut}T00:00:00Z`);
  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return 0;
  const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

// ---------- AUTH ROUTES ----------

app.post('/api/auth/register', (req, res) => {
  const { name, email, phone, password } = req.body || {};
  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email, and password are required' });
    return;
  }
  if (String(password).length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists' });
    return;
  }
  const hash = bcrypt.hashSync(String(password), 10);
  const result = db
    .prepare('INSERT INTO users (name, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)')
    .run(String(name).trim(), normalizedEmail, String(phone || '').trim(), hash, 'guest', 'active');

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as any;
  const token = generateToken(user);
  res.status(201).json({ token, user: sanitizeUser(user) });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail) as any;
  if (!user || !bcrypt.compareSync(String(password), user.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }
  if (user.status === 'suspended') {
    res.status(403).json({ error: 'This account has been suspended. Contact the hotel administrator.' });
    return;
  }
  const token = generateToken(user);
  res.json({ token, user: sanitizeUser(user) });
});

app.get('/api/auth/me', authenticate, (req: AuthenticatedRequest, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.authUser!.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user: sanitizeUser(user) });
});

app.put('/api/auth/profile', authenticate, (req: AuthenticatedRequest, res) => {
  const { name, email, phone, newPassword } = req.body || {};
  if (!name || !email) {
    res.status(400).json({ error: 'Name and email are required' });
    return;
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const conflict = db
    .prepare('SELECT id FROM users WHERE email = ? AND id != ?')
    .get(normalizedEmail, req.authUser!.id);
  if (conflict) {
    res.status(409).json({ error: 'Email is already used by another account' });
    return;
  }

  if (newPassword && String(newPassword).trim().length > 0) {
    if (String(newPassword).length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters' });
      return;
    }
    const hash = bcrypt.hashSync(String(newPassword), 10);
    db.prepare('UPDATE users SET name = ?, email = ?, phone = ?, password_hash = ? WHERE id = ?').run(
      String(name).trim(),
      normalizedEmail,
      String(phone || '').trim(),
      hash,
      req.authUser!.id
    );
  } else {
    db.prepare('UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?').run(
      String(name).trim(),
      normalizedEmail,
      String(phone || '').trim(),
      req.authUser!.id
    );
  }

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.authUser!.id) as any;
  const token = generateToken(updated);
  res.json({ token, user: sanitizeUser(updated) });
});

// ---------- PUBLIC ROOMS SEARCH & DETAILS ----------

app.get('/api/rooms', optionalAuthenticate, (req: AuthenticatedRequest, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const category = String(req.query.category || '').trim();
  const guests = Number(req.query.guests || 0);
  const maxPrice = Number(req.query.maxPrice || 0);
  const amenity = String(req.query.amenity || '').trim();
  const checkIn = String(req.query.checkIn || '').trim();
  const checkOut = String(req.query.checkOut || '').trim();
  const includeMaintenance =
    req.query.includeMaintenance === 'true' && req.authUser?.role === 'admin';

  let rows = db.prepare('SELECT * FROM rooms ORDER BY price_per_night ASC, room_number ASC').all() as any[];

  if (!includeMaintenance) {
    rows = rows.filter((r) => r.status === 'available');
  }

  const hasValidDateRange = Boolean(checkIn && checkOut && calculateNights(checkIn, checkOut) > 0);
  const bookedRoomOverlaps = new Map<number, { check_in: string; check_out: string }>();

  if (hasValidDateRange) {
    const overlapping = db
      .prepare(
        `SELECT room_id, check_in, check_out FROM reservations
         WHERE status != 'cancelled'
           AND check_in < ?
           AND check_out > ?
         ORDER BY check_in ASC`
      )
      .all(checkOut, checkIn) as { room_id: number; check_in: string; check_out: string }[];
    for (const o of overlapping) {
      if (!bookedRoomOverlaps.has(o.room_id)) {
        bookedRoomOverlaps.set(o.room_id, { check_in: o.check_in, check_out: o.check_out });
      }
    }
  }

  const filtered = rows
    .map((row) => {
      const overlap = bookedRoomOverlaps.get(row.id) || null;
      const availableForDates = row.status === 'available' && !overlap;
      return mapRoom(row, availableForDates, overlap);
    })
    .filter((room) => {
      if (category && category !== 'all' && room.category !== category) return false;
      if (guests > 0 && room.capacity < guests) return false;
      if (maxPrice > 0 && room.price_per_night > maxPrice) return false;
      if (amenity && !room.amenities.includes(amenity)) return false;
      if (q) {
        const haystack = [
          room.name_en,
          room.name_fr,
          room.description_en,
          room.description_fr,
          room.room_number,
          room.category,
          room.bed_type_en,
          room.bed_type_fr,
          ...room.amenities,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

  res.json({ rooms: filtered });
});

app.get('/api/rooms/:id', (req, res) => {
  const id = Number(req.params.id);
  const row = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id) as any;
  if (!row) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  const bookedRanges = db
    .prepare(
      `SELECT check_in, check_out, status FROM reservations
       WHERE room_id = ? AND status != 'cancelled' AND check_out >= date('now')
       ORDER BY check_in ASC`
    )
    .all(id);

  res.json({ room: mapRoom(row), bookedRanges });
});

// ---------- RESERVATIONS & MOBILE MONEY PAYMENT ----------

app.post('/api/reservations', authenticate, (req: AuthenticatedRequest, res) => {
  const {
    roomId,
    checkIn,
    checkOut,
    guestsCount,
    paymentMethod,
    paymentPhone,
    guestName,
    guestEmail,
    guestPhone,
    specialRequests,
  } = req.body || {};

  if (!roomId || !checkIn || !checkOut || !paymentMethod || !paymentPhone) {
    res.status(400).json({ error: 'Missing required booking or payment details' });
    return;
  }
  if (
    paymentMethod !== 'orange_money' &&
    paymentMethod !== 'mtn_momo' &&
    paymentMethod !== 'visa_mastercard'
  ) {
    res.status(400).json({
      error: 'Unsupported payment method. Choose Orange Money, MTN MoMo, or Visa / Mastercard.',
    });
    return;
  }
  const cleanedPaymentIdentifier = String(paymentPhone).replace(/[\s\-()]/g, '');
  if (cleanedPaymentIdentifier.length < 4) {
    res.status(400).json({ error: 'Enter valid payment account or card details' });
    return;
  }

  const nights = calculateNights(String(checkIn), String(checkOut));
  if (nights <= 0 || nights > 60) {
    res.status(400).json({ error: 'Check-out date must be after check-in date (1–60 nights)' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.authUser!.id) as any;
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(Number(roomId)) as any;

  if (!room || room.status !== 'available') {
    res.status(404).json({ error: 'Room is currently unavailable for booking' });
    return;
  }

  const count = Number(guestsCount || 1);
  if (count < 1 || count > room.capacity) {
    res.status(400).json({ error: `Room supports up to ${room.capacity} guests` });
    return;
  }

  const createTx = db.transaction(() => {
    const conflict = db
      .prepare(
        `SELECT id FROM reservations
         WHERE room_id = ? AND status != 'cancelled'
           AND check_in < ? AND check_out > ?`
      )
      .get(room.id, checkOut, checkIn);

    if (conflict) {
      throw new Error('DATE_CONFLICT');
    }

    const totalAmount = room.price_per_night * nights;
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const year = new Date().getFullYear();
    const receiptCode = `KBN-${year}-${randomHex}`;
    const signature = signReceiptPayload(receiptCode, totalAmount, room.id);
    const paymentPrefix =
      paymentMethod === 'orange_money'
        ? 'OM'
        : paymentMethod === 'mtn_momo'
          ? 'MOMO'
          : 'CARD';
    const paymentRef = `${paymentPrefix}-TXN-${crypto.randomInt(100000, 999999)}`;

    const insert = db.prepare(`
      INSERT INTO reservations (
        receipt_code, qr_signature, user_id, room_id, guest_name, guest_email, guest_phone,
        check_in, check_out, nights, guests_count, total_amount,
        payment_method, payment_phone, payment_reference, payment_status, status, special_requests
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', 'confirmed', ?)
    `);

    const result = insert.run(
      receiptCode,
      signature,
      user.id,
      room.id,
      String(guestName || user.name).trim(),
      String(guestEmail || user.email).trim(),
      String(guestPhone || user.phone || paymentPhone).trim(),
      String(checkIn),
      String(checkOut),
      nights,
      count,
      totalAmount,
      paymentMethod,
      String(paymentPhone).trim(),
      paymentRef,
      String(specialRequests || '').trim()
    );

    return result.lastInsertRowid;
  });

  try {
    const newId = createTx();
    const created = db
      .prepare(
        `SELECT r.*, rm.room_number, rm.name_en as room_name_en, rm.name_fr as room_name_fr,
                rm.category as room_category, rm.images_json as room_images_json
         FROM reservations r
         JOIN rooms rm ON r.room_id = rm.id
         WHERE r.id = ?`
      )
      .get(newId);

    res.status(201).json({ reservation: mapReservation(created) });
  } catch (err: any) {
    if (err?.message === 'DATE_CONFLICT') {
      res.status(409).json({ error: 'This room is already booked for the selected dates' });
      return;
    }
    res.status(500).json({ error: 'Unable to complete reservation' });
  }
});

app.get('/api/reservations/my', authenticate, (req: AuthenticatedRequest, res) => {
  const rows = db
    .prepare(
      `SELECT r.*, rm.room_number, rm.name_en as room_name_en, rm.name_fr as room_name_fr,
              rm.category as room_category, rm.images_json as room_images_json
       FROM reservations r
       JOIN rooms rm ON r.room_id = rm.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC, r.id DESC`
    )
    .all(req.authUser!.id);

  res.json({ reservations: rows.map(mapReservation) });
});

app.post('/api/reservations/:id/cancel', authenticate, (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM reservations WHERE id = ?').get(id) as any;
  if (!existing) {
    res.status(404).json({ error: 'Reservation not found' });
    return;
  }
  if (existing.user_id !== req.authUser!.id && req.authUser!.role !== 'admin') {
    res.status(403).json({ error: 'Not authorized to cancel this reservation' });
    return;
  }
  if (existing.status === 'checked_out') {
    res.status(400).json({ error: 'Completed reservations cannot be cancelled' });
    return;
  }

  db.prepare("UPDATE reservations SET status = 'cancelled', payment_status = 'refunded' WHERE id = ?").run(id);
  const updated = db
    .prepare(
      `SELECT r.*, rm.room_number, rm.name_en as room_name_en, rm.name_fr as room_name_fr,
              rm.category as room_category, rm.images_json as room_images_json
       FROM reservations r
       JOIN rooms rm ON r.room_id = rm.id
       WHERE r.id = ?`
    )
    .get(id);
  res.json({ reservation: mapReservation(updated) });
});

// ---------- RECEIPT QR VERIFICATION SCANNER ----------

app.post('/api/receipts/verify', optionalAuthenticate, (req: AuthenticatedRequest, res) => {
  const { rawPayload } = req.body || {};
  if (!rawPayload || !String(rawPayload).trim()) {
    res.status(400).json({ valid: false, reason: 'EMPTY_PAYLOAD' });
    return;
  }

  let receiptCode = String(rawPayload).trim();
  let providedSig: string | null = null;

  if (receiptCode.startsWith('{')) {
    try {
      const parsed = JSON.parse(receiptCode);
      if (parsed.code) receiptCode = String(parsed.code).trim();
      if (parsed.sig) providedSig = String(parsed.sig).trim();
    } catch {
      res.json({ valid: false, reason: 'MALFORMED_QR' });
      return;
    }
  } else if (receiptCode.includes(':')) {
    const parts = receiptCode.split(':');
    if (parts.length >= 2) {
      receiptCode = parts[1].trim();
      providedSig = parts[2]?.trim() || null;
    }
  }

  receiptCode = receiptCode.toUpperCase();

  const row = db
    .prepare(
      `SELECT r.*, rm.room_number, rm.name_en as room_name_en, rm.name_fr as room_name_fr,
              rm.category as room_category, rm.images_json as room_images_json
       FROM reservations r
       JOIN rooms rm ON r.room_id = rm.id
       WHERE UPPER(r.receipt_code) = ?`
    )
    .get(receiptCode) as any;

  if (!row) {
    res.json({ valid: false, reason: 'NOT_FOUND', searchedCode: receiptCode });
    return;
  }

  const expectedSig = signReceiptPayload(row.receipt_code, row.total_amount, row.room_id);
  if (providedSig && providedSig.toUpperCase() !== expectedSig && providedSig.toUpperCase() !== row.qr_signature) {
    res.json({ valid: false, reason: 'SIGNATURE_MISMATCH', searchedCode: receiptCode });
    return;
  }

  const reservation = mapReservation(row);
  const checkOutDeadlineIso = `${row.check_out}T12:00:00+01:00`;
  const checkOutDeadlineMs = new Date(checkOutDeadlineIso).getTime();
  const nowMs = Date.now();
  const isPeriodEnded = Number.isFinite(checkOutDeadlineMs) && nowMs > checkOutDeadlineMs;
  const isExpired = row.status !== 'cancelled' && (row.status === 'checked_out' || isPeriodEnded);
  const diffMs = Number.isFinite(checkOutDeadlineMs) ? nowMs - checkOutDeadlineMs : 0;
  const expiredHours = isExpired && diffMs > 0 ? Math.max(1, Math.floor(diffMs / 3600000)) : 0;
  const expiredDays = Math.floor(expiredHours / 24);
  const remainingHours = !isExpired && Number.isFinite(checkOutDeadlineMs)
    ? Math.max(0, Math.ceil((checkOutDeadlineMs - nowMs) / 3600000))
    : 0;

  res.json({
    valid: true,
    signatureVerified: true,
    isCancelled: row.status === 'cancelled',
    isExpired,
    expiredReason: isExpired ? (isPeriodEnded ? 'PERIOD_ENDED' : 'CHECKED_OUT') : null,
    expiredDays,
    expiredHours,
    remainingHours,
    checkOutDeadline: `${row.check_out} 12:00 WAT`,
    reservation,
    canManage: req.authUser?.role === 'admin',
  });
});

// ---------- ADMIN MANAGEMENT ROUTES ----------

app.get('/api/admin/stats', authenticate, requireAdmin, (_req, res) => {
  const revenueRow = db
    .prepare("SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as paidCount FROM reservations WHERE status != 'cancelled'")
    .get() as { total: number; paidCount: number };
  const activeRes = db
    .prepare("SELECT COUNT(*) as count FROM reservations WHERE status IN ('confirmed', 'checked_in')")
    .get() as { count: number };
  const totalRes = db.prepare('SELECT COUNT(*) as count FROM reservations').get() as { count: number };
  const availRooms = db
    .prepare("SELECT COUNT(*) as count FROM rooms WHERE status = 'available'")
    .get() as { count: number };
  const totalRooms = db.prepare('SELECT COUNT(*) as count FROM rooms').get() as { count: number };
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

  // Build 7-day sales curve series from reservation created_at dates
  const dailyRows = db
    .prepare(
      `SELECT date(created_at) as day, COALESCE(SUM(total_amount), 0) as revenue, COUNT(*) as bookings
       FROM reservations
       WHERE status != 'cancelled'
         AND date(created_at) >= date('now', '-6 days')
       GROUP BY date(created_at)
       ORDER BY day ASC`
    )
    .all() as { day: string; revenue: number; bookings: number }[];

  const dayMap = new Map(dailyRows.map((d) => [d.day, d]));
  const salesSeries: { label: string; date: string; revenue: number; bookings: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const dt = new Date(Date.now() - i * 86400000);
    const iso = dt.toISOString().slice(0, 10);
    const shortLabel = iso.slice(5); // MM-DD
    const found = dayMap.get(iso);
    salesSeries.push({
      label: shortLabel,
      date: iso,
      revenue: found?.revenue || 0,
      bookings: found?.bookings || 0,
    });
  }

  const paymentBreakdown = db
    .prepare(
      `SELECT payment_method as method, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
       FROM reservations
       WHERE status != 'cancelled'
       GROUP BY payment_method
       ORDER BY revenue DESC`
    )
    .all();

  const categorySales = db
    .prepare(
      `SELECT rm.category as category, COUNT(*) as count, COALESCE(SUM(r.total_amount), 0) as revenue
       FROM reservations r
       JOIN rooms rm ON r.room_id = rm.id
       WHERE r.status != 'cancelled'
       GROUP BY rm.category
       ORDER BY revenue DESC`
    )
    .all();

  const averageBookingValue =
    revenueRow.paidCount > 0 ? Math.round(revenueRow.total / revenueRow.paidCount) : 0;
  const occupancyRate =
    availRooms.count > 0 ? Math.min(100, Math.round((activeRes.count / availRooms.count) * 100)) : 0;

  res.json({
    stats: {
      totalRevenue: revenueRow.total,
      averageBookingValue,
      occupancyRate,
      activeReservations: activeRes.count,
      totalReservations: totalRes.count,
      availableRooms: availRooms.count,
      totalRooms: totalRooms.count,
      totalUsers: totalUsers.count,
      salesSeries,
      paymentBreakdown,
      categorySales,
    },
  });
});

// Admin: Users
app.get('/api/admin/users', authenticate, requireAdmin, (_req, res) => {
  const rows = db.prepare('SELECT * FROM users ORDER BY created_at DESC, id DESC').all() as any[];
  res.json({ users: rows.map(sanitizeUser) });
});

app.post('/api/admin/users', authenticate, requireAdmin, (req, res) => {
  const { name, email, phone, password, role, status } = req.body || {};
  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email, and password are required' });
    return;
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail)) {
    res.status(409).json({ error: 'Email already exists' });
    return;
  }
  const hash = bcrypt.hashSync(String(password), 10);
  const resInsert = db
    .prepare('INSERT INTO users (name, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)')
    .run(
      String(name).trim(),
      normalizedEmail,
      String(phone || '').trim(),
      hash,
      role === 'admin' ? 'admin' : 'guest',
      status === 'suspended' ? 'suspended' : 'active'
    );
  const created = db.prepare('SELECT * FROM users WHERE id = ?').get(resInsert.lastInsertRowid);
  res.status(201).json({ user: sanitizeUser(created) });
});

app.put('/api/admin/users/:id', authenticate, requireAdmin, (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
  if (!existing) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const { name, email, phone, role, status, newPassword } = req.body || {};
  const normalizedEmail = String(email || existing.email).trim().toLowerCase();
  const conflict = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(normalizedEmail, id);
  if (conflict) {
    res.status(409).json({ error: 'Email already used by another user' });
    return;
  }
  if (id === req.authUser!.id && status === 'suspended') {
    res.status(400).json({ error: 'You cannot suspend your own administrator account' });
    return;
  }

  const nextRole = role === 'admin' ? 'admin' : role === 'guest' ? 'guest' : existing.role;
  const nextStatus = status === 'suspended' ? 'suspended' : status === 'active' ? 'active' : existing.status;

  if (newPassword && String(newPassword).trim().length >= 6) {
    const hash = bcrypt.hashSync(String(newPassword), 10);
    db.prepare('UPDATE users SET name = ?, email = ?, phone = ?, role = ?, status = ?, password_hash = ? WHERE id = ?').run(
      String(name || existing.name).trim(),
      normalizedEmail,
      String(phone ?? existing.phone).trim(),
      nextRole,
      nextStatus,
      hash,
      id
    );
  } else {
    db.prepare('UPDATE users SET name = ?, email = ?, phone = ?, role = ?, status = ? WHERE id = ?').run(
      String(name || existing.name).trim(),
      normalizedEmail,
      String(phone ?? existing.phone).trim(),
      nextRole,
      nextStatus,
      id
    );
  }

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  res.json({ user: sanitizeUser(updated) });
});

app.delete('/api/admin/users/:id', authenticate, requireAdmin, (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  if (id === req.authUser!.id) {
    res.status(400).json({ error: 'You cannot delete your own active account' });
    return;
  }
  const info = db.prepare('DELETE FROM users WHERE id = ?').run(id);
  if (info.changes === 0) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ deleted: true });
});

// Admin: Rooms
app.post('/api/admin/rooms', authenticate, requireAdmin, (req, res) => {
  const {
    room_number,
    category,
    name_en,
    name_fr,
    description_en,
    description_fr,
    price_per_night,
    capacity,
    size_sqm,
    bed_type_en,
    bed_type_fr,
    floor,
    amenities,
    images,
    status,
  } = req.body || {};

  if (!room_number || !name_en || !price_per_night) {
    res.status(400).json({ error: 'Room number, English name, and nightly rate are required' });
    return;
  }

  if (db.prepare('SELECT id FROM rooms WHERE room_number = ?').get(String(room_number).trim())) {
    res.status(409).json({ error: 'A room with this room number already exists' });
    return;
  }

  const slug = `${String(name_en).toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${String(room_number).trim()}`;
  const result = db
    .prepare(
      `INSERT INTO rooms (
        room_number, slug, category, name_en, name_fr, description_en, description_fr,
        price_per_night, capacity, size_sqm, bed_type_en, bed_type_fr, floor,
        amenities_json, images_json, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      String(room_number).trim(),
      slug,
      ['standard', 'deluxe', 'suite', 'penthouse'].includes(category) ? category : 'deluxe',
      String(name_en).trim(),
      String(name_fr || name_en).trim(),
      String(description_en || '').trim(),
      String(description_fr || description_en || '').trim(),
      Number(price_per_night),
      Number(capacity || 2),
      Number(size_sqm || 32),
      String(bed_type_en || '1 King Bed').trim(),
      String(bed_type_fr || bed_type_en || '1 Lit King Size').trim(),
      Number(floor || 1),
      JSON.stringify(Array.isArray(amenities) ? amenities : ['wifi', 'ac']),
      JSON.stringify(
        Array.isArray(images) && images.length > 0
          ? images
          : ['/src/assets/images/room_deluxe_king_1794699885655.jpg']
      ),
      status === 'maintenance' ? 'maintenance' : 'available'
    );

  const created = db.prepare('SELECT * FROM rooms WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ room: mapRoom(created) });
});

app.put('/api/admin/rooms/:id', authenticate, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id) as any;
  if (!existing) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }

  const body = req.body || {};
  const nextNumber = String(body.room_number ?? existing.room_number).trim();
  const conflict = db.prepare('SELECT id FROM rooms WHERE room_number = ? AND id != ?').get(nextNumber, id);
  if (conflict) {
    res.status(409).json({ error: 'Another room already uses this room number' });
    return;
  }

  db.prepare(
    `UPDATE rooms SET
      room_number = ?, category = ?, name_en = ?, name_fr = ?,
      description_en = ?, description_fr = ?, price_per_night = ?,
      capacity = ?, size_sqm = ?, bed_type_en = ?, bed_type_fr = ?,
      floor = ?, amenities_json = ?, images_json = ?, status = ?
     WHERE id = ?`
  ).run(
    nextNumber,
    body.category ?? existing.category,
    String(body.name_en ?? existing.name_en).trim(),
    String(body.name_fr ?? existing.name_fr).trim(),
    String(body.description_en ?? existing.description_en).trim(),
    String(body.description_fr ?? existing.description_fr).trim(),
    Number(body.price_per_night ?? existing.price_per_night),
    Number(body.capacity ?? existing.capacity),
    Number(body.size_sqm ?? existing.size_sqm),
    String(body.bed_type_en ?? existing.bed_type_en).trim(),
    String(body.bed_type_fr ?? existing.bed_type_fr).trim(),
    Number(body.floor ?? existing.floor),
    Array.isArray(body.amenities) ? JSON.stringify(body.amenities) : existing.amenities_json,
    Array.isArray(body.images) ? JSON.stringify(body.images) : existing.images_json,
    body.status === 'maintenance' ? 'maintenance' : body.status === 'available' ? 'available' : existing.status,
    id
  );

  const updated = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
  res.json({ room: mapRoom(updated) });
});

app.delete('/api/admin/rooms/:id', authenticate, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const info = db.prepare('DELETE FROM rooms WHERE id = ?').run(id);
  if (info.changes === 0) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  res.json({ deleted: true });
});

// Admin: Reservations
app.get('/api/admin/reservations', authenticate, requireAdmin, (_req, res) => {
  const rows = db
    .prepare(
      `SELECT r.*, rm.room_number, rm.name_en as room_name_en, rm.name_fr as room_name_fr,
              rm.category as room_category, rm.images_json as room_images_json
       FROM reservations r
       JOIN rooms rm ON r.room_id = rm.id
       ORDER BY r.created_at DESC, r.id DESC`
    )
    .all();
  res.json({ reservations: rows.map(mapReservation) });
});

app.put('/api/admin/reservations/:id', authenticate, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM reservations WHERE id = ?').get(id) as any;
  if (!existing) {
    res.status(404).json({ error: 'Reservation not found' });
    return;
  }
  const { status, payment_status } = req.body || {};
  const validStatuses = ['confirmed', 'checked_in', 'checked_out', 'cancelled'];
  const nextStatus = validStatuses.includes(status) ? status : existing.status;
  const nextPaymentStatus =
    payment_status === 'refunded' || nextStatus === 'cancelled'
      ? 'refunded'
      : payment_status === 'paid'
        ? 'paid'
        : existing.payment_status;

  db.prepare('UPDATE reservations SET status = ?, payment_status = ? WHERE id = ?').run(
    nextStatus,
    nextPaymentStatus,
    id
  );

  const updated = db
    .prepare(
      `SELECT r.*, rm.room_number, rm.name_en as room_name_en, rm.name_fr as room_name_fr,
              rm.category as room_category, rm.images_json as room_images_json
       FROM reservations r
       JOIN rooms rm ON r.room_id = rm.id
       WHERE r.id = ?`
    )
    .get(id);
  res.json({ reservation: mapReservation(updated) });
});

app.delete('/api/admin/reservations/:id', authenticate, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const info = db.prepare('DELETE FROM reservations WHERE id = ?').run(id);
  if (info.changes === 0) {
    res.status(404).json({ error: 'Reservation not found' });
    return;
  }
  res.json({ deleted: true });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`hotel Spot server running at http://localhost:${PORT}`);
  });
}

startServer();
