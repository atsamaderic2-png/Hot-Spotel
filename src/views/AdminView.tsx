import React, { useEffect, useState } from 'react';
import { BedDouble, CalendarCheck, Percent, Plus, QrCode, Search, Trash2, TrendingUp, Users, X } from 'lucide-react';
import { api } from '../api';
import { ROOM_IMAGE_PRESETS } from '../assets/roomImages';
import { ReceiptModal } from '../components/ReceiptModal';
import { SalesAnalytics } from '../components/SalesAnalytics';
import { AMENITY_LABELS, useLanguage } from '../i18n';
import { AdminStats, Reservation, Room, RoomCategory, User } from '../types';

export function AdminView() {
  const { lang, t, formatPrice, formatCategory } = useLanguage();

  const [tab, setTab] = useState<'overview' | 'rooms' | 'reservations' | 'users'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search / filters
  const [resSearch, setResSearch] = useState('');
  const [resStatusFilter, setResStatusFilter] = useState<string>('all');
  const [userSearch, setUserSearch] = useState('');

  // Modals
  const [receiptTarget, setReceiptTarget] = useState<Reservation | null>(null);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Room Form State
  const [roomForm, setRoomForm] = useState({
    room_number: '',
    category: 'deluxe' as RoomCategory,
    name_en: '',
    name_fr: '',
    description_en: '',
    description_fr: '',
    price_per_night: 75000,
    capacity: 2,
    size_sqm: 36,
    bed_type_en: '1 King Bed',
    bed_type_fr: '1 Lit King Size',
    floor: 2,
    amenities: ['wifi', 'ac', 'breakfast'] as string[],
    imagePrimary: ROOM_IMAGE_PRESETS[0].path,
    status: 'available' as 'available' | 'maintenance',
  });

  // User Form State
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'guest' as 'guest' | 'admin',
    status: 'active' as 'active' | 'suspended',
  });

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [sRes, rmRes, resRes, uRes] = await Promise.all([
        api.adminStats(),
        api.searchRooms({ includeMaintenance: true }),
        api.adminReservations(),
        api.adminUsers(),
      ]);
      setStats(sRes.stats);
      setRooms(rmRes.rooms);
      setReservations(resRes.reservations);
      setUsers(uRes.users);
    } catch (err: any) {
      setError(err?.message || 'Failed to load admin console');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openCreateRoom = () => {
    setEditingRoom(null);
    setRoomForm({
      room_number: '',
      category: 'deluxe',
      name_en: '',
      name_fr: '',
      description_en: '',
      description_fr: '',
      price_per_night: 75000,
      capacity: 2,
      size_sqm: 36,
      bed_type_en: '1 King Bed',
      bed_type_fr: '1 Lit King Size',
      floor: 2,
      amenities: ['wifi', 'ac', 'breakfast'],
      imagePrimary: ROOM_IMAGE_PRESETS[0].path,
      status: 'available',
    });
    setRoomModalOpen(true);
  };

  const openEditRoom = (r: Room) => {
    setEditingRoom(r);
    setRoomForm({
      room_number: r.room_number,
      category: r.category,
      name_en: r.name_en,
      name_fr: r.name_fr,
      description_en: r.description_en,
      description_fr: r.description_fr,
      price_per_night: r.price_per_night,
      capacity: r.capacity,
      size_sqm: r.size_sqm,
      bed_type_en: r.bed_type_en,
      bed_type_fr: r.bed_type_fr,
      floor: r.floor,
      amenities: r.amenities,
      imagePrimary: r.images[0] || ROOM_IMAGE_PRESETS[0].path,
      status: r.status,
    });
    setRoomModalOpen(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        room_number: roomForm.room_number,
        category: roomForm.category,
        name_en: roomForm.name_en,
        name_fr: roomForm.name_fr || roomForm.name_en,
        description_en: roomForm.description_en,
        description_fr: roomForm.description_fr || roomForm.description_en,
        price_per_night: Number(roomForm.price_per_night),
        capacity: Number(roomForm.capacity),
        size_sqm: Number(roomForm.size_sqm),
        bed_type_en: roomForm.bed_type_en,
        bed_type_fr: roomForm.bed_type_fr || roomForm.bed_type_en,
        floor: Number(roomForm.floor),
        amenities: roomForm.amenities,
        images: [roomForm.imagePrimary, '/src/assets/images/douala_raw_bath_euro.jpg'],
        status: roomForm.status,
      };
      if (editingRoom) {
        await api.adminUpdateRoom(editingRoom.id, payload);
      } else {
        await api.adminCreateRoom(payload);
      }
      setRoomModalOpen(false);
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Failed to save room');
    }
  };

  const handleDeleteRoom = async (id: number) => {
    try {
      await api.adminDeleteRoom(id);
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete room');
    }
  };

  const handleUpdateReservationStatus = async (id: number, status: string) => {
    try {
      await api.adminUpdateReservation(id, { status });
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Failed to update reservation');
    }
  };

  const handleDeleteReservation = async (id: number) => {
    try {
      await api.adminDeleteReservation(id);
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete reservation');
    }
  };

  const openCreateUser = () => {
    setEditingUser(null);
    setUserForm({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'guest',
      status: 'active',
    });
    setUserModalOpen(true);
  };

  const openEditUser = (u: User) => {
    setEditingUser(u);
    setUserForm({
      name: u.name,
      email: u.email,
      phone: u.phone,
      password: '',
      role: u.role,
      status: u.status,
    });
    setUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editingUser) {
        await api.adminUpdateUser(editingUser.id, {
          name: userForm.name,
          email: userForm.email,
          phone: userForm.phone,
          role: userForm.role,
          status: userForm.status,
          newPassword: userForm.password.trim() || undefined,
        });
      } else {
        await api.adminCreateUser({
          name: userForm.name,
          email: userForm.email,
          phone: userForm.phone,
          password: userForm.password,
          role: userForm.role,
          status: userForm.status,
        });
      }
      setUserModalOpen(false);
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Failed to save user');
    }
  };

  const handleDeleteUser = async (id: number) => {
    try {
      await api.adminDeleteUser(id);
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete user');
    }
  };

  const filteredReservations = reservations.filter((r) => {
    if (resStatusFilter !== 'all' && r.status !== resStatusFilter) return false;
    if (resSearch.trim()) {
      const q = resSearch.toLowerCase();
      const match =
        r.receipt_code.toLowerCase().includes(q) ||
        r.guest_name.toLowerCase().includes(q) ||
        r.guest_email.toLowerCase().includes(q) ||
        (r.room_number || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const statusLabel = (s: Reservation['status']) => {
    if (s === 'confirmed') return t('statusConfirmed');
    if (s === 'checked_in') return t('statusCheckedIn');
    if (s === 'checked_out') return t('statusCheckedOut');
    return t('statusCancelled');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="pb-6 border-b border-slate-200 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-slate-900">{t('adminTitle')}</h1>
          <p className="text-sm text-slate-600 mt-1">{t('adminSubtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
          {(['overview', 'rooms', 'reservations', 'users'] as const).map((key) => {
            const label =
              key === 'overview'
                ? t('adminOverview')
                : key === 'rooms'
                  ? t('adminRooms')
                  : key === 'reservations'
                    ? t('adminReservations')
                    : t('adminUsers');
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  tab === key ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mt-6 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      {loading && !stats ? (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl border border-slate-200 bg-slate-50 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* KPI OVERVIEW & SALES ANALYTICS */}
          {tab === 'overview' && stats && (
            <div className="mt-8 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="p-5 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-500">{t('kpiRevenue')}</p>
                    <TrendingUp className="w-4 h-4 text-brand-primary" />
                  </div>
                  <p className="font-mono-tabular text-2xl font-semibold text-brand-primary mt-2">
                    {formatPrice(stats.totalRevenue)}
                  </p>
                </div>

                <div className="p-5 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-500">{t('avgBookingLabel')}</p>
                    <TrendingUp className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="font-mono-tabular text-2xl font-semibold text-slate-900 mt-2">
                    {formatPrice(stats.averageBookingValue)}
                  </p>
                </div>

                <div className="p-5 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-500">{t('occupancyLabel')}</p>
                    <Percent className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="font-mono-tabular text-2xl font-semibold text-slate-900 mt-2">
                    {stats.occupancyRate}%
                  </p>
                </div>

                <div className="p-5 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-500">{t('kpiActiveBookings')}</p>
                    <CalendarCheck className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="font-mono-tabular text-2xl font-semibold text-slate-900 mt-2">
                    {stats.activeReservations}{' '}
                    <span className="text-sm font-normal text-slate-500">
                      / {stats.totalReservations}
                    </span>
                  </p>
                </div>

                <div className="p-5 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-500">{t('kpiAvailableRooms')}</p>
                    <BedDouble className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="font-mono-tabular text-2xl font-semibold text-slate-900 mt-2">
                    {stats.availableRooms} / {stats.totalRooms}
                  </p>
                </div>

                <div className="p-5 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-500">{t('kpiTotalUsers')}</p>
                    <Users className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="font-mono-tabular text-2xl font-semibold text-slate-900 mt-2">
                    {stats.totalUsers}
                  </p>
                </div>
              </div>

              {/* Sales Curves & Breakdowns */}
              <SalesAnalytics stats={stats} />

              {/* Reservations Placed */}
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-brand-primary">
                    {t('recentBookingsTitle')}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setTab('reservations')}
                    className="text-xs font-semibold text-brand-primary hover:underline cursor-pointer"
                  >
                    {t('viewDetails')}
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
                      <tr>
                        <th className="py-3 px-4 font-medium">{t('receiptCodeLabel')}</th>
                        <th className="py-3 px-4 font-medium">{t('guestCol')}</th>
                        <th className="py-3 px-4 font-medium">{t('roomNameCol')}</th>
                        <th className="py-3 px-4 font-medium">{t('datesCol')}</th>
                        <th className="py-3 px-4 font-medium">{t('paymentCol')}</th>
                        <th className="py-3 px-4 font-medium text-right">{t('totalCol')}</th>
                        <th className="py-3 px-4 font-medium">{t('statusCol')}</th>
                        <th className="py-3 px-4 font-medium text-right">{t('actionsCol')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reservations.slice(0, 8).map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/60">
                          <td className="py-3 px-4 font-mono-tabular text-xs font-semibold text-slate-900">
                            {r.receipt_code}
                          </td>
                          <td className="py-3 px-4 text-slate-800">{r.guest_name}</td>
                          <td className="py-3 px-4 text-slate-600">
                            #{r.room_number} · {lang === 'fr' ? r.room_name_fr : r.room_name_en}
                          </td>
                          <td className="py-3 px-4 font-mono-tabular text-xs text-slate-600 whitespace-nowrap">
                            {r.check_in} → {r.check_out}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                            {r.payment_method === 'orange_money'
                              ? 'Orange Money'
                              : r.payment_method === 'mtn_momo'
                                ? 'MTN MoMo'
                                : 'Visa / Mastercard'}
                          </td>
                          <td className="py-3 px-4 font-mono-tabular text-right font-medium text-slate-900 whitespace-nowrap">
                            {formatPrice(r.total_amount)}
                          </td>
                          <td className="py-3 px-4 text-xs font-medium text-slate-700 whitespace-nowrap">
                            {statusLabel(r.status)}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setReceiptTarget(r)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline cursor-pointer"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              QR
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ROOMS MANAGEMENT */}
          {tab === 'rooms' && (
            <div className="mt-8 space-y-5">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={openCreateRoom}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-brand-primary rounded-lg hover:bg-brand-elevated"
                >
                  <Plus className="w-4 h-4" />
                  {t('addRoom')}
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
                      <tr>
                        <th className="py-3 px-4 font-medium">{t('roomNumberCol')}</th>
                        <th className="py-3 px-4 font-medium">{t('roomNameCol')}</th>
                        <th className="py-3 px-4 font-medium">{t('categoryCol')}</th>
                        <th className="py-3 px-4 font-medium text-right">{t('rateCol')}</th>
                        <th className="py-3 px-4 font-medium text-right">{t('capacityCol')}</th>
                        <th className="py-3 px-4 font-medium">{t('statusCol')}</th>
                        <th className="py-3 px-4 font-medium text-right">{t('actionsCol')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rooms.map((room) => (
                        <tr key={room.id} className="hover:bg-slate-50/60">
                          <td className="py-3 px-4 font-mono-tabular font-semibold text-slate-900">
                            #{room.room_number}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-900">
                            {lang === 'fr' ? room.name_fr : room.name_en}
                          </td>
                          <td className="py-3 px-4 text-slate-600">{formatCategory(room.category)}</td>
                          <td className="py-3 px-4 font-mono-tabular text-right text-slate-900">
                            {formatPrice(room.price_per_night)}
                          </td>
                          <td className="py-3 px-4 font-mono-tabular text-right text-slate-600">
                            {room.capacity}
                          </td>
                          <td className="py-3 px-4 text-xs font-medium">
                            <span
                              className={
                                room.status === 'available' ? 'text-emerald-700' : 'text-amber-700'
                              }
                            >
                              {room.status === 'available'
                                ? t('statusAvailable')
                                : t('statusMaintenance')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => openEditRoom(room)}
                              className="text-xs font-semibold text-brand-primary hover:underline"
                            >
                              {t('editLabel')}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRoom(room.id)}
                              className="text-xs font-semibold text-red-700 hover:underline"
                            >
                              {t('deleteLabel')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* RESERVATIONS MANAGEMENT */}
          {tab === 'reservations' && (
            <div className="mt-8 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="search"
                    value={resSearch}
                    onChange={(e) => setResSearch(e.target.value)}
                    placeholder={t('filterReservationsPlaceholder')}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <select
                  value={resStatusFilter}
                  onChange={(e) => setResStatusFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="all">{t('allStatuses')}</option>
                  <option value="confirmed">{t('statusConfirmed')}</option>
                  <option value="checked_in">{t('statusCheckedIn')}</option>
                  <option value="checked_out">{t('statusCheckedOut')}</option>
                  <option value="cancelled">{t('statusCancelled')}</option>
                </select>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
                      <tr>
                        <th className="py-3 px-4 font-medium">{t('receiptCodeLabel')}</th>
                        <th className="py-3 px-4 font-medium">{t('guestCol')}</th>
                        <th className="py-3 px-4 font-medium">{t('roomNameCol')}</th>
                        <th className="py-3 px-4 font-medium">{t('datesCol')}</th>
                        <th className="py-3 px-4 font-medium">{t('paymentCol')}</th>
                        <th className="py-3 px-4 font-medium text-right">{t('totalCol')}</th>
                        <th className="py-3 px-4 font-medium">{t('statusCol')}</th>
                        <th className="py-3 px-4 font-medium text-right">{t('actionsCol')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredReservations.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/60">
                          <td className="py-3 px-4 font-mono-tabular text-xs font-semibold text-slate-900">
                            {r.receipt_code}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-medium text-slate-900">{r.guest_name}</p>
                            <p className="text-xs text-slate-500">{r.guest_email}</p>
                          </td>
                          <td className="py-3 px-4 text-slate-700">#{r.room_number}</td>
                          <td className="py-3 px-4 font-mono-tabular text-xs text-slate-600 whitespace-nowrap">
                            {r.check_in} → {r.check_out}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600">
                            {r.payment_method === 'orange_money'
                              ? 'Orange Money'
                              : r.payment_method === 'mtn_momo'
                                ? 'MTN MoMo'
                                : 'Visa / Mastercard'}
                          </td>
                          <td className="py-3 px-4 font-mono-tabular text-right font-medium text-slate-900">
                            {formatPrice(r.total_amount)}
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={r.status}
                              onChange={(e) => handleUpdateReservationStatus(r.id, e.target.value)}
                              className="px-2 py-1 text-xs border border-slate-300 rounded-md bg-white"
                            >
                              <option value="confirmed">{t('statusConfirmed')}</option>
                              <option value="checked_in">{t('statusCheckedIn')}</option>
                              <option value="checked_out">{t('statusCheckedOut')}</option>
                              <option value="cancelled">{t('statusCancelled')}</option>
                            </select>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setReceiptTarget(r)}
                              title="View QR Receipt"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              QR
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteReservation(r.id)}
                              className="text-xs font-semibold text-red-700 hover:underline"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* USERS MANAGEMENT */}
          {tab === 'users' && (
            <div className="mt-8 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="search"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder={t('filterUsersPlaceholder')}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
                <button
                  type="button"
                  onClick={openCreateUser}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-brand-primary rounded-lg hover:bg-brand-elevated w-fit"
                >
                  <Plus className="w-4 h-4" />
                  {t('addUser')}
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
                      <tr>
                        <th className="py-3 px-4 font-medium">{t('fullName')}</th>
                        <th className="py-3 px-4 font-medium">{t('emailAddress')}</th>
                        <th className="py-3 px-4 font-medium">{t('phoneNumber')}</th>
                        <th className="py-3 px-4 font-medium">{t('roleCol')}</th>
                        <th className="py-3 px-4 font-medium">{t('statusCol')}</th>
                        <th className="py-3 px-4 font-medium text-right">{t('actionsCol')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/60">
                          <td className="py-3 px-4 font-medium text-slate-900">{u.name}</td>
                          <td className="py-3 px-4 text-slate-600">{u.email}</td>
                          <td className="py-3 px-4 font-mono-tabular text-xs text-slate-600">
                            {u.phone || '—'}
                          </td>
                          <td className="py-3 px-4 text-xs font-semibold text-slate-800">
                            {u.role === 'admin' ? t('roleAdmin') : t('roleGuest')}
                          </td>
                          <td className="py-3 px-4 text-xs font-medium">
                            <span
                              className={u.status === 'active' ? 'text-emerald-700' : 'text-red-700'}
                            >
                              {u.status === 'active' ? t('statusActive') : t('statusSuspended')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-3 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => openEditUser(u)}
                              className="text-xs font-semibold text-brand-primary hover:underline"
                            >
                              {t('editLabel')}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-xs font-semibold text-red-700 hover:underline"
                            >
                              {t('deleteLabel')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Room Create / Edit Modal */}
      {roomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-xl border border-slate-200 shadow-xl my-8 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-slate-900">
                {editingRoom ? t('editRoom') : t('addRoom')}
              </h2>
              <button
                type="button"
                onClick={() => setRoomModalOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveRoom} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {t('roomNumberCol')}
                  </label>
                  <input
                    type="text"
                    required
                    value={roomForm.room_number}
                    onChange={(e) => setRoomForm({ ...roomForm, room_number: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-tabular"
                    placeholder="401"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {t('categoryCol')}
                  </label>
                  <select
                    value={roomForm.category}
                    onChange={(e) =>
                      setRoomForm({ ...roomForm, category: e.target.value as RoomCategory })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="standard">{t('catStandard')}</option>
                    <option value="deluxe">{t('catDeluxe')}</option>
                    <option value="suite">{t('catSuite')}</option>
                    <option value="penthouse">{t('catPenthouse')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {t('statusCol')}
                  </label>
                  <select
                    value={roomForm.status}
                    onChange={(e) =>
                      setRoomForm({
                        ...roomForm,
                        status: e.target.value as 'available' | 'maintenance',
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="available">{t('statusAvailable')}</option>
                    <option value="maintenance">{t('statusMaintenance')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Name (EN)</label>
                  <input
                    type="text"
                    required
                    value={roomForm.name_en}
                    onChange={(e) => setRoomForm({ ...roomForm, name_en: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nom (FR)</label>
                  <input
                    type="text"
                    required
                    value={roomForm.name_fr}
                    onChange={(e) => setRoomForm({ ...roomForm, name_fr: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Description (EN)
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={roomForm.description_en}
                    onChange={(e) => setRoomForm({ ...roomForm, description_en: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Description (FR)
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={roomForm.description_fr}
                    onChange={(e) => setRoomForm({ ...roomForm, description_fr: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {t('rateCol')} (FCFA)
                  </label>
                  <input
                    type="number"
                    required
                    min={5000}
                    step={1000}
                    value={roomForm.price_per_night}
                    onChange={(e) =>
                      setRoomForm({ ...roomForm, price_per_night: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {t('capacityCol')}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={8}
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm({ ...roomForm, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {t('roomSize')} (m²)
                  </label>
                  <input
                    type="number"
                    required
                    min={12}
                    value={roomForm.size_sqm}
                    onChange={(e) => setRoomForm({ ...roomForm, size_sqm: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {t('floorLabel')}
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={roomForm.floor}
                    onChange={(e) => setRoomForm({ ...roomForm, floor: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-tabular"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Photo</label>
                <select
                  value={roomForm.imagePrimary}
                  onChange={(e) => setRoomForm({ ...roomForm, imagePrimary: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {ROOM_IMAGE_PRESETS.map((preset) => (
                    <option key={preset.path} value={preset.path}>
                      {lang === 'fr' ? preset.labelFr : preset.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  {t('amenitiesTitle')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.keys(AMENITY_LABELS).map((key) => {
                    const checked = roomForm.amenities.includes(key);
                    return (
                      <label key={key} className="flex items-center gap-2 text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = checked
                              ? roomForm.amenities.filter((a) => a !== key)
                              : [...roomForm.amenities, key];
                            setRoomForm({ ...roomForm, amenities: next });
                          }}
                        />
                        {AMENITY_LABELS[key][lang]}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRoomModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg"
                >
                  {t('cancelLabel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-brand-primary rounded-lg hover:bg-brand-elevated"
                >
                  {t('saveLabel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Create / Edit Modal */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-slate-900">
                {editingUser ? t('editUser') : t('addUser')}
              </h2>
              <button
                type="button"
                onClick={() => setUserModalOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{t('fullName')}</label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t('emailAddress')}
                </label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t('phoneNumber')}
                </label>
                <input
                  type="tel"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-tabular"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{t('roleCol')}</label>
                  <select
                    value={userForm.role}
                    onChange={(e) =>
                      setUserForm({ ...userForm, role: e.target.value as 'guest' | 'admin' })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="guest">{t('roleGuest')}</option>
                    <option value="admin">{t('roleAdmin')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {t('statusCol')}
                  </label>
                  <select
                    value={userForm.status}
                    onChange={(e) =>
                      setUserForm({ ...userForm, status: e.target.value as 'active' | 'suspended' })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="active">{t('statusActive')}</option>
                    <option value="suspended">{t('statusSuspended')}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {editingUser ? t('newPasswordOptional') : t('passwordLabel')}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  minLength={6}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg"
                >
                  {t('cancelLabel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-brand-primary rounded-lg hover:bg-brand-elevated"
                >
                  {t('saveLabel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ReceiptModal reservation={receiptTarget} onClose={() => setReceiptTarget(null)} />
    </div>
  );
}
