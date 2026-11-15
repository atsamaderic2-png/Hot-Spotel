import React, { useEffect, useState } from 'react';
import { QrCode, Receipt, UserCog } from 'lucide-react';
import { api } from '../api';
import { resolveHotelImage } from '../assets/roomImages';
import { ReceiptModal } from '../components/ReceiptModal';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n';
import { Reservation } from '../types';

interface AccountViewProps {
  onBrowseRooms: () => void;
  initialReceipt?: Reservation | null;
}

export function AccountView({ onBrowseRooms, initialReceipt }: AccountViewProps) {
  const { user, updateProfile } = useAuth();
  const { lang, t, formatPrice } = useLanguage();

  const [tab, setTab] = useState<'reservations' | 'profile'>('reservations');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<Reservation | null>(initialReceipt || null);
  const [error, setError] = useState('');

  // Profile form state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [newPassword, setNewPassword] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const loadReservations = () => {
    setLoading(true);
    api
      .getMyReservations()
      .then((res) => {
        setReservations(res.reservations);
        setError('');
      })
      .catch((err: any) => setError(err?.message || 'Failed to load reservations'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReservations();
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone);
    }
  }, [user]);

  useEffect(() => {
    if (initialReceipt) {
      setSelectedReceipt(initialReceipt);
      loadReservations();
    }
  }, [initialReceipt]);

  const handleCancel = async (id: number) => {
    try {
      const res = await api.cancelReservation(id);
      setReservations((prev) => prev.map((r) => (r.id === id ? res.reservation : r)));
    } catch (err: any) {
      setError(err?.message || 'Unable to cancel reservation');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage('');
    setProfileError('');
    setSavingProfile(true);
    try {
      await updateProfile({
        name,
        email,
        phone,
        newPassword: newPassword.trim() || undefined,
      });
      setNewPassword('');
      setProfileMessage(t('profileSaved'));
    } catch (err: any) {
      setProfileError(err?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const statusText = (status: Reservation['status']) => {
    if (status === 'confirmed') return t('statusConfirmed');
    if (status === 'checked_in') return t('statusCheckedIn');
    if (status === 'checked_out') return t('statusCheckedOut');
    return t('statusCancelled');
  };

  const statusColor = (status: Reservation['status']) => {
    if (status === 'confirmed') return 'text-emerald-700';
    if (status === 'checked_in') return 'text-brand-primary';
    if (status === 'checked_out') return 'text-slate-600';
    return 'text-red-700';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="pb-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-slate-900">{t('accountTitle')}</h1>
          <p className="text-sm text-slate-600 mt-1">{t('accountSubtitle')}</p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
          <button
            type="button"
            onClick={() => setTab('reservations')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              tab === 'reservations'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            {t('tabReservations')}
          </button>
          <button
            type="button"
            onClick={() => setTab('profile')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              tab === 'profile'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCog className="w-3.5 h-3.5" />
            {t('tabProfile')}
          </button>
        </div>
      </div>

      {tab === 'reservations' ? (
        <div className="mt-8">
          {error && (
            <div className="mb-5 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 rounded-xl border border-slate-200 bg-slate-50 animate-pulse" />
              ))}
            </div>
          ) : reservations.length === 0 ? (
            <div className="py-16 text-center rounded-xl border border-slate-200 bg-slate-50/60">
              <QrCode className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <p className="text-sm text-slate-600 mb-4">{t('noReservationsYet')}</p>
              <button
                type="button"
                onClick={onBrowseRooms}
                className="px-4 py-2 text-xs font-semibold text-brand-primary bg-brand-accent rounded-lg hover:bg-brand-accent-hover"
              >
                {t('browseRoomsCta')}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {reservations.map((res) => {
                const roomName = lang === 'fr' ? res.room_name_fr : res.room_name_en;
                const providerName =
                  res.payment_method === 'orange_money'
                    ? t('orangeMoney')
                    : res.payment_method === 'mtn_momo'
                      ? t('mtnMomo')
                      : t('visaMastercard');

                return (
                  <div
                    key={res.id}
                    className="p-5 rounded-xl border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-24 h-20 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        <img
                          src={resolveHotelImage(res.room_image)}
                          alt={roomName || 'Room'}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 tabular-nums">
                          <span className="font-mono-tabular font-semibold text-slate-900">
                            {res.receipt_code}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className={`font-semibold ${statusColor(res.status)}`}>
                            {statusText(res.status)}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {providerName} ({res.payment_reference})
                          </span>
                        </div>

                        <h3 className="font-display text-lg font-semibold text-slate-900 mt-1">
                          {roomName} — #{res.room_number}
                        </h3>

                        <p className="text-sm text-slate-600 mt-1 tabular-nums">
                          {res.check_in} → {res.check_out} ({res.nights}{' '}
                          {res.nights === 1 ? t('nightLabel') : t('nightsLabel')})
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between gap-3 shrink-0">
                      <p className="font-mono-tabular text-lg font-semibold text-slate-900">
                        {formatPrice(res.total_amount)}
                      </p>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedReceipt(res)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-brand-primary bg-brand-accent rounded-lg hover:bg-brand-accent-hover transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          {t('viewReceiptBtn')}
                        </button>
                        {res.status === 'confirmed' && (
                          <button
                            type="button"
                            onClick={() => handleCancel(res.id)}
                            className="px-3 py-2 text-xs font-semibold text-red-700 border border-red-200 rounded-lg hover:bg-red-50 transition-colors whitespace-nowrap"
                          >
                            {t('cancelBookingBtn')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-8 max-w-xl">
          <form
            onSubmit={handleSaveProfile}
            className="p-6 rounded-xl border border-slate-200 bg-white space-y-4"
          >
            {profileMessage && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800">
                {profileMessage}
              </div>
            )}
            {profileError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                {profileError}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">{t('fullName')}</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">{t('emailAddress')}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">{t('phoneNumber')}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg font-mono-tabular focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                {t('newPasswordOptional')}
              </label>
              <input
                type="password"
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-5 py-2.5 text-sm font-semibold text-brand-primary bg-brand-accent rounded-lg hover:bg-brand-accent-hover disabled:opacity-60 transition-colors cursor-pointer"
              >
                {savingProfile ? '...' : t('saveProfile')}
              </button>
            </div>
          </form>
        </div>
      )}

      <ReceiptModal reservation={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
    </div>
  );
}
