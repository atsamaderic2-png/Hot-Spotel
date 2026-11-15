import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import path from 'path';

const DB_PATH = path.resolve(process.cwd(), 'hotel.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const RECEIPT_SECRET = process.env.JWT_SECRET || 'kasbah-nour-hotel-secret-2026';

export function signReceiptPayload(receiptCode: string, totalAmount: number, roomId: number): string {
  return crypto
    .createHmac('sha256', RECEIPT_SECRET)
    .update(`${receiptCode}|${totalAmount}|${roomId}`)
    .digest('hex')
    .slice(0, 16)
    .toUpperCase();
}

export function buildQrPayload(receiptCode: string, signature: string): string {
  return JSON.stringify({
    hotel: 'KASBAH_NOUR_DOUALA',
    code: receiptCode,
    sig: signature,
  });
}

function getRelativeDate(offsetDays: number): string {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return d.toISOString().slice(0, 10);
}

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'guest' CHECK(role IN ('guest', 'admin')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'suspended')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_number TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL CHECK(category IN ('standard', 'deluxe', 'suite', 'penthouse')),
      name_en TEXT NOT NULL,
      name_fr TEXT NOT NULL,
      description_en TEXT NOT NULL,
      description_fr TEXT NOT NULL,
      price_per_night INTEGER NOT NULL,
      capacity INTEGER NOT NULL,
      size_sqm INTEGER NOT NULL,
      bed_type_en TEXT NOT NULL,
      bed_type_fr TEXT NOT NULL,
      floor INTEGER NOT NULL DEFAULT 1,
      amenities_json TEXT NOT NULL DEFAULT '[]',
      images_json TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'maintenance')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_code TEXT NOT NULL UNIQUE,
      qr_signature TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      room_id INTEGER NOT NULL,
      guest_name TEXT NOT NULL,
      guest_email TEXT NOT NULL,
      guest_phone TEXT NOT NULL,
      check_in TEXT NOT NULL,
      check_out TEXT NOT NULL,
      nights INTEGER NOT NULL,
      guests_count INTEGER NOT NULL,
      total_amount INTEGER NOT NULL,
      payment_method TEXT NOT NULL CHECK(payment_method IN ('orange_money', 'mtn_momo', 'visa_mastercard')),
      payment_phone TEXT NOT NULL,
      payment_reference TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'paid' CHECK(payment_status IN ('paid', 'refunded')),
      status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed', 'checked_in', 'checked_out', 'cancelled')),
      special_requests TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
    );
  `);

  // Safe migration if reservations table existed without visa_mastercard constraint
  const resSchema = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'reservations'")
    .get() as { sql?: string } | undefined;
  if (resSchema?.sql && !resSchema.sql.includes('visa_mastercard')) {
    db.pragma('foreign_keys = OFF');
    db.exec(`
      BEGIN TRANSACTION;
      CREATE TABLE reservations_migrated (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        receipt_code TEXT NOT NULL UNIQUE,
        qr_signature TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        room_id INTEGER NOT NULL,
        guest_name TEXT NOT NULL,
        guest_email TEXT NOT NULL,
        guest_phone TEXT NOT NULL,
        check_in TEXT NOT NULL,
        check_out TEXT NOT NULL,
        nights INTEGER NOT NULL,
        guests_count INTEGER NOT NULL,
        total_amount INTEGER NOT NULL,
        payment_method TEXT NOT NULL CHECK(payment_method IN ('orange_money', 'mtn_momo', 'visa_mastercard')),
        payment_phone TEXT NOT NULL,
        payment_reference TEXT NOT NULL,
        payment_status TEXT NOT NULL DEFAULT 'paid' CHECK(payment_status IN ('paid', 'refunded')),
        status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed', 'checked_in', 'checked_out', 'cancelled')),
        special_requests TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
      );
      INSERT INTO reservations_migrated SELECT * FROM reservations;
      DROP TABLE reservations;
      ALTER TABLE reservations_migrated RENAME TO reservations;
      COMMIT;
    `);
    db.pragma('foreign_keys = ON');
  }

  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  if (userCount === 0) {
    const adminHash = bcrypt.hashSync('Admin@1234', 10);
    const guestHash = bcrypt.hashSync('Guest@1234', 10);

    const insertUser = db.prepare(
      'INSERT INTO users (name, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)'
    );
    insertUser.run('Amadou Mbarga', 'admin@kasbahnour.com', '+237 699 10 20 30', adminHash, 'admin', 'active');
    insertUser.run('Claire Nkodo', 'guest@kasbahnour.com', '+237 677 45 82 10', guestHash, 'guest', 'active');
    insertUser.run('Jean-Luc Fotso', 'jeanluc@example.com', '+237 655 12 34 56', guestHash, 'guest', 'active');
  }

  const realDoualaRoomImages: Record<string, string[]> = {
    '101': [
      '/src/assets/images/douala_raw_fan_room.jpg',
      '/src/assets/images/douala_raw_fan_tv.jpg',
    ],
    '204': [
      '/src/assets/images/douala_raw_red_room.jpg',
      '/src/assets/images/douala_raw_red_wall.jpg',
    ],
    '208': [
      '/src/assets/images/douala_raw_superair.jpg',
      '/src/assets/images/douala_raw_kitchenette.jpg',
    ],
    '302': [
      '/src/assets/images/douala_raw_grey_suite.jpg',
      '/src/assets/images/douala_raw_bath_euro.jpg',
    ],
    '306': [
      '/src/assets/images/douala_raw_orange_room.jpg',
      '/src/assets/images/douala_raw_partition_bath.jpg',
    ],
    '501': [
      '/src/assets/images/douala_raw_blueyellow.jpg',
      '/src/assets/images/douala_raw_studio_salon.jpg',
    ],
  };

  const roomCount = (db.prepare('SELECT COUNT(*) as count FROM rooms').get() as { count: number }).count;
  if (roomCount === 0) {
    const insertRoom = db.prepare(`
      INSERT INTO rooms (
        room_number, slug, category, name_en, name_fr, description_en, description_fr,
        price_per_night, capacity, size_sqm, bed_type_en, bed_type_fr, floor,
        amenities_json, images_json, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const seedRooms = [
      {
        room_number: '101',
        slug: 'bonanjo-classic-room',
        category: 'standard',
        name_en: 'Bonanjo Classic Double',
        name_fr: 'Chambre Classique Bonanjo',
        description_en:
          'Bright, serene room in the heart of Douala featuring warm wood furnishings, crisp white linens, and calm courtyard views.',
        description_fr:
          'Chambre lumineuse au cœur de Douala avec mobilier en bois chaleureux, linge blanc immaculé et vue sur cour.',
        price_per_night: 45000,
        capacity: 2,
        size_sqm: 28,
        bed_type_en: '1 Queen Bed',
        bed_type_fr: '1 Lit Queen Size',
        floor: 1,
        amenities: ['wifi', 'ac', 'breakfast', 'workspace', 'safe'],
        images: realDoualaRoomImages['101'],
        status: 'available',
      },
      {
        room_number: '204',
        slug: 'akwa-deluxe-king',
        category: 'deluxe',
        name_en: 'Akwa Deluxe King',
        name_fr: 'Chambre Deluxe King Akwa',
        description_en:
          'Contemporary Douala business sanctuary with leather-trimmed headboard, ambient bedside lighting, armchair lounge, and blackout drapery.',
        description_fr:
          'Sanctuaire contemporain à Douala avec tête de lit capitonnée, éclairage d’ambiance, fauteuil de lecture et rideaux occultants.',
        price_per_night: 75000,
        capacity: 2,
        size_sqm: 38,
        bed_type_en: '1 King Bed',
        bed_type_fr: '1 Lit King Size',
        floor: 2,
        amenities: ['wifi', 'ac', 'breakfast', 'pool', 'minibar', 'safe'],
        images: realDoualaRoomImages['204'],
        status: 'available',
      },
      {
        room_number: '208',
        slug: 'wouri-balcony-deluxe',
        category: 'deluxe',
        name_en: 'Wouri View Deluxe',
        name_fr: 'Chambre Deluxe Vue Wouri',
        description_en:
          'Generously proportioned room with quilted headboard, work desk, and private balcony views toward the Port of Douala.',
        description_fr:
          'Chambre spacieuse avec tête de lit matelassée, bureau et balcon privé orienté vers le fleuve Wouri.',
        price_per_night: 85000,
        capacity: 3,
        size_sqm: 42,
        bed_type_en: '1 King Bed + Sofa',
        bed_type_fr: '1 Lit King + Canapé',
        floor: 2,
        amenities: ['wifi', 'ac', 'breakfast', 'pool', 'terrace', 'minibar'],
        images: realDoualaRoomImages['208'],
        status: 'available',
      },
      {
        room_number: '302',
        slug: 'bonapriso-junior-suite',
        category: 'suite',
        name_en: 'Bonapriso Junior Suite',
        name_fr: 'Suite Junior Bonapriso',
        description_en:
          'Separate sunlit living salon with handcrafted hardwood seating, dedicated writing table, minibar, and sliding balcony access.',
        description_fr:
          'Salon séparé baigné de lumière avec assises en bois massif, bureau dédié, minibar et accès direct au balcon.',
        price_per_night: 125000,
        capacity: 3,
        size_sqm: 64,
        bed_type_en: '1 King Bed + Lounge Salon',
        bed_type_fr: '1 Lit King + Salon Privé',
        floor: 3,
        amenities: ['wifi', 'ac', 'breakfast', 'pool', 'workspace', 'minibar', 'room_service', 'safe'],
        images: realDoualaRoomImages['302'],
        status: 'available',
      },
      {
        room_number: '306',
        slug: 'diplomat-premium-suite',
        category: 'suite',
        name_en: 'Diplomat Premium Suite',
        name_fr: 'Suite Premium Diplomate',
        description_en:
          'Tailored executive suite in Douala designed for extended stays, featuring upholstered accent walls and high-speed fiber workspace.',
        description_fr:
          'Suite exécutive à Douala conçue pour les séjours prolongés avec finitions capitonnées et espace de travail fibre optique.',
        price_per_night: 140000,
        capacity: 4,
        size_sqm: 72,
        bed_type_en: '1 King Bed + 1 Queen Sofa',
        bed_type_fr: '1 Lit King + Canapé-Lit Queen',
        floor: 3,
        amenities: ['wifi', 'ac', 'breakfast', 'pool', 'workspace', 'minibar', 'room_service', 'terrace'],
        images: realDoualaRoomImages['306'],
        status: 'available',
      },
      {
        room_number: '501',
        slug: 'douala-presidential-penthouse',
        category: 'penthouse',
        name_en: 'Douala Presidential Residence',
        name_fr: 'Résidence Présidentielle Douala',
        description_en:
          'Top-floor flagship residence featuring custom architectural bedding, contemporary Cameroonian artwork, and VIP concierge care.',
        description_fr:
          'Résidence phare au dernier étage avec literie architecturale sur mesure, art contemporain camerounais et conciergerie VIP.',
        price_per_night: 210000,
        capacity: 4,
        size_sqm: 110,
        bed_type_en: '1 Emperor King Bed',
        bed_type_fr: '1 Lit Emperor King',
        floor: 5,
        amenities: ['wifi', 'ac', 'breakfast', 'pool', 'terrace', 'workspace', 'minibar', 'room_service', 'safe'],
        images: realDoualaRoomImages['501'],
        status: 'available',
      },
    ];

    for (const r of seedRooms) {
      insertRoom.run(
        r.room_number,
        r.slug,
        r.category,
        r.name_en,
        r.name_fr,
        r.description_en,
        r.description_fr,
        r.price_per_night,
        r.capacity,
        r.size_sqm,
        r.bed_type_en,
        r.bed_type_fr,
        r.floor,
        JSON.stringify(r.amenities),
        JSON.stringify(r.images),
        r.status
      );
    }
  } else {
    // Upgrade seeded room rows to use our verified clean Douala hotel room images
    const updateImg = db.prepare('UPDATE rooms SET images_json = ? WHERE room_number = ?');
    for (const [roomNum, imgs] of Object.entries(realDoualaRoomImages)) {
      updateImg.run(JSON.stringify(imgs), roomNum);
    }
  }

  const resCount = (db.prepare('SELECT COUNT(*) as count FROM reservations').get() as { count: number }).count;
  if (resCount === 0) {
    const guest = db.prepare("SELECT * FROM users WHERE email = 'guest@kasbahnour.com'").get() as any;
    const otherGuest = db.prepare("SELECT * FROM users WHERE email = 'jeanluc@example.com'").get() as any;
    const roomDeluxe = db.prepare("SELECT * FROM rooms WHERE room_number = '204'").get() as any;
    const roomSuite = db.prepare("SELECT * FROM rooms WHERE room_number = '302'").get() as any;

    if (guest && roomDeluxe && roomSuite) {
      const insertRes = db.prepare(`
        INSERT INTO reservations (
          receipt_code, qr_signature, user_id, room_id, guest_name, guest_email, guest_phone,
          check_in, check_out, nights, guests_count, total_amount,
          payment_method, payment_phone, payment_reference, payment_status, status, special_requests
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?, ?)
      `);

      const code1 = 'KBN-2026-8419A2';
      const total1 = roomDeluxe.price_per_night * 2;
      const sig1 = signReceiptPayload(code1, total1, roomDeluxe.id);
      insertRes.run(
        code1,
        sig1,
        guest.id,
        roomDeluxe.id,
        guest.name,
        guest.email,
        guest.phone,
        getRelativeDate(5),
        getRelativeDate(7),
        2,
        2,
        total1,
        'orange_money',
        '+237 699 88 77 66',
        'OM-TXN-904812',
        'confirmed',
        'Late evening check-in around 20:00'
      );

      // Seed a reservation by another guest for tomorrow->+3 days on Room 302
      // so the default search dates immediately demonstrate a room marked unavailable!
      const code2 = 'KBN-2026-5203F9';
      const total2 = roomSuite.price_per_night * 2;
      const sig2 = signReceiptPayload(code2, total2, roomSuite.id);
      const booker = otherGuest || guest;
      insertRes.run(
        code2,
        sig2,
        booker.id,
        roomSuite.id,
        booker.name,
        booker.email,
        booker.phone,
        getRelativeDate(1),
        getRelativeDate(3),
        2,
        2,
        total2,
        'mtn_momo',
        '+237 655 12 34 56',
        'MOMO-TXN-339201',
        'confirmed',
        'Quiet upper floor preferred'
      );
    }
  }

  // Seed historical completed reservations across the past 7 days for Admin Sales Analytics curves
  const currentResCount = (db.prepare('SELECT COUNT(*) as count FROM reservations').get() as { count: number }).count;
  if (currentResCount <= 2) {
    const guest = db.prepare("SELECT * FROM users WHERE role = 'guest' ORDER BY id ASC LIMIT 1").get() as any;
    const allRooms = db.prepare('SELECT * FROM rooms ORDER BY id ASC').all() as any[];
    if (guest && allRooms.length >= 4) {
      const insertHist = db.prepare(`
        INSERT INTO reservations (
          receipt_code, qr_signature, user_id, room_id, guest_name, guest_email, guest_phone,
          check_in, check_out, nights, guests_count, total_amount,
          payment_method, payment_phone, payment_reference, payment_status, status, special_requests, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', 'checked_out', '', datetime('now', ?))
      `);

      const histEntries = [
        { code: 'KBN-2026-1041D1', room: allRooms[0], daysAgo: '-6 days', nights: 2, method: 'mtn_momo', phone: '+237 677 11 22 33', ref: 'MOMO-TXN-112001' },
        { code: 'KBN-2026-2082E4', room: allRooms[2], daysAgo: '-5 days', nights: 3, method: 'orange_money', phone: '+237 699 44 55 66', ref: 'OM-TXN-224019' },
        { code: 'KBN-2026-3063B7', room: allRooms[4] || allRooms[1], daysAgo: '-4 days', nights: 2, method: 'visa_mastercard', phone: 'CARD •••• 4821', ref: 'CARD-TXN-884120' },
        { code: 'KBN-2026-5014C9', room: allRooms[5] || allRooms[3], daysAgo: '-2 days', nights: 2, method: 'visa_mastercard', phone: 'CARD •••• 9012', ref: 'CARD-TXN-992310' },
        { code: 'KBN-2026-2045A8', room: allRooms[1], daysAgo: '-1 days', nights: 3, method: 'orange_money', phone: '+237 691 77 88 99', ref: 'OM-TXN-665104' },
      ];

      for (const h of histEntries) {
        const exists = db.prepare('SELECT id FROM reservations WHERE receipt_code = ?').get(h.code);
        if (!exists) {
          const total = h.room.price_per_night * h.nights;
          const sig = signReceiptPayload(h.code, total, h.room.id);
          const ciOffset = Number.parseInt(h.daysAgo, 10) - h.nights;
          const coOffset = Number.parseInt(h.daysAgo, 10);
          insertHist.run(
            h.code,
            sig,
            guest.id,
            h.room.id,
            guest.name,
            guest.email,
            guest.phone,
            getRelativeDate(ciOffset),
            getRelativeDate(coOffset),
            h.nights,
            2,
            total,
            h.method,
            h.phone,
            h.ref,
            h.daysAgo
          );
        }
      }
    }
  }
}

export default db;
