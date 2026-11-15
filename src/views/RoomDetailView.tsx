import React, { useEffect, useState } from 'react';
import { ArrowLeft, BedDouble, Calendar, Check, Maximize2, Users } from 'lucide-react';
import { api } from '../api';
import { resolveHotelImage } from '../assets/roomImages';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n';
import { Room } from '../types';

interface RoomDetailViewProps {
  roomId: number;
  checkIn: string;
  checkOut: string;
  guests: number;
  onChangeDates: (checkIn: string, checkOut: string) => void;
  onChangeGuests: (guests: number) => void;
  onBack: () => void;
  onRequireAuth: () => void;
  onProceedToPayment: (room: Room, nights: number, guestsCount: number) => void;
}

function calcNights(checkIn: string, checkOut: string): number {
  const d1 = new Date(`${checkIn}T00:00:00Z`);
  const d2 = new Date(`${checkOut}T00:00:00Z`);
  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return 0;
  const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export function RoomDetailView({
  roomId,
  checkIn,
  checkOut,
  guests,
  onChangeDates,
  onChangeGuests,
  onBack,
  onRequireAuth,
  onProceedToPayment,
}: RoomDetailViewProps) {
  const { user } = useAuth();
  const { lang, t, formatPrice, formatAmenity, formatCategory } = useLanguage();

  const [room, setRoom] = useState<Room | null>(null);
  const [bookedRanges, setBookedRanges] = useState<{ check_in: string; check_out: string }[]>([]);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setSelectedImageIdx(0);
    api
      .getRoom(roomId)
      .then((res) => {
        setRoom(res.room);
        setBookedRanges(res.bookedRanges);
        setError('');
      })
      .catch((err: any) => setError(err?.message || 'Unable to load room details'))
      .finally(() => setLoading(false));
  }, [roomId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-6 w-36 bg-slate-100 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 aspect-[4/3] bg-slate-100 rounded-xl animate-pulse" />
          <div className="lg:col-span-5 h-96 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-brand-primary hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('backToRooms')}
        </button>
        <div className="p-6 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
          {error || 'Room not found'}
        </div>
      </div>
    );
  }

  const title = lang === 'fr' ? room.name_fr : room.name_en;
  const description = lang === 'fr' ? room.description_fr : room.description_en;
  const bedType = lang === 'fr' ? room.bed_type_fr : room.bed_type_en;
  const images = room.images.length > 0 ? room.images : [''];
  const nights = calcNights(checkIn, checkOut);
  const totalAmount = nights * room.price_per_night;

  const overlappingRange =
    nights > 0
      ? bookedRanges.find((range) => range.check_in < checkOut && range.check_out > checkIn)
      : undefined;

  const hasOverlap = Boolean(overlappingRange);
  const validGuests = Math.min(Math.max(1, guests), room.capacity);

  const handleReserveClick = () => {
    if (!user) {
      onRequireAuth();
      return;
    }
    onProceedToPayment(room, nights, validGuests);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-brand-primary hover:underline mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('backToRooms')}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Gallery + Specs */}
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-3">
            <div className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <img
                src={resolveHotelImage(images[selectedImageIdx] || images[0])}
                alt={`${title} — view ${selectedImageIdx + 1}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`aspect-[4/3] rounded-lg overflow-hidden border transition-all cursor-pointer ${
                      selectedImageIdx === idx
                        ? 'border-brand-primary ring-2 ring-brand-accent'
                        : 'border-slate-200 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={resolveHotelImage(img)}
                      alt={`${title} thumbnail ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2 text-xs text-slate-500 tabular-nums">
              <span>{formatCategory(room.category)}</span>
              <span aria-hidden="true">·</span>
              <span>
                {t('roomNumberLabel')} #{room.room_number}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {t('floorLabel')} {room.floor}
              </span>
            </div>

            <h1 className="font-display text-3xl font-semibold text-brand-primary mt-2 text-balance">
              {title}
            </h1>
            <p className="mt-3 text-base text-slate-600 leading-relaxed">{description}</p>
          </div>

          {/* Room Specifications */}
          <div className="pt-6 border-t border-slate-200">
            <h2 className="text-sm font-semibold text-brand-primary mb-4">{t('roomSpecs')}</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <Maximize2 className="w-4 h-4 text-brand-primary mb-2" />
                <p className="text-xs text-slate-500">{t('roomSize')}</p>
                <p className="text-sm font-semibold text-slate-900 tabular-nums mt-0.5">
                  {room.size_sqm} m²
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <Users className="w-4 h-4 text-brand-primary mb-2" />
                <p className="text-xs text-slate-500">{t('roomCapacity')}</p>
                <p className="text-sm font-semibold text-slate-900 tabular-nums mt-0.5">
                  {room.capacity} {room.capacity === 1 ? t('guestSingular') : t('guestsPlural')}
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <BedDouble className="w-4 h-4 text-brand-primary mb-2" />
                <p className="text-xs text-slate-500">{t('roomBed')}</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{bedType}</p>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="pt-6 border-t border-slate-200">
            <h2 className="text-sm font-semibold text-brand-primary mb-4">{t('amenitiesTitle')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4">
              {room.amenities.map((key) => (
                <div key={key} className="flex items-center gap-2.5 text-sm text-slate-700">
                  <Check className="w-4 h-4 text-brand-primary shrink-0" />
                  <span>{formatAmenity(key)}</span>
                </div>
              ))}
            </div>
          </div>

          {bookedRanges.length > 0 && (
            <div className="pt-6 border-t border-slate-200">
              <h2 className="text-sm font-semibold text-brand-primary mb-3">{t('upcomingBookedDates')}</h2>
              <div className="flex flex-wrap gap-3 text-xs text-red-700 tabular-nums font-medium">
                {bookedRanges.map((r, i) => (
                  <span key={`${r.check_in}-${i}`} className="font-mono-tabular">
                    {t('bookedUntilPrefix')}: {r.check_in} → {r.check_out}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Contiguous Booking Module */}
        <aside className="lg:col-span-5 lg:sticky lg:top-6">
          <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs space-y-5">
            <div className="flex items-baseline justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="font-mono-tabular text-2xl font-semibold text-brand-primary">
                  {formatPrice(room.price_per_night)}
                </span>{' '}
                <span className="text-sm text-slate-500">{t('perNight')}</span>
              </div>
              <span className="text-xs font-medium text-slate-500 tabular-nums">
                #{room.room_number}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{t('checkIn')}</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => onChangeDates(e.target.value, checkOut)}
                    className="w-full pl-9 pr-2.5 py-2 text-sm border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{t('checkOut')}</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="date"
                    value={checkOut}
                    min={checkIn}
                    onChange={(e) => onChangeDates(checkIn, e.target.value)}
                    className="w-full pl-9 pr-2.5 py-2 text-sm border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t('guests')}</label>
              <select
                value={validGuests}
                onChange={(e) => onChangeGuests(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                {Array.from({ length: room.capacity }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? t('guestSingular') : t('guestsPlural')}
                  </option>
                ))}
              </select>
            </div>

            {hasOverlap && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 space-y-1">
                <p className="font-semibold">{t('bookedByAnotherGuest')}</p>
                <p>
                  {t('alreadyBookedWarning')} (
                  <span className="font-mono-tabular">
                    {overlappingRange?.check_in} → {overlappingRange?.check_out}
                  </span>
                  )
                </p>
              </div>
            )}

            {nights > 0 && (
              <div className="pt-4 border-t border-slate-200 space-y-2 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="tabular-nums">
                    {formatPrice(room.price_per_night)} × {nights}{' '}
                    {nights === 1 ? t('nightLabel') : t('nightsLabel')}
                  </span>
                  <span className="font-mono-tabular text-slate-900">{formatPrice(totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-200 font-semibold text-brand-primary">
                  <span>{t('totalAmount')}</span>
                  <span className="font-mono-tabular text-lg">{formatPrice(totalAmount)}</span>
                </div>
                <p className="text-xs text-slate-500">{t('taxesIncluded')}</p>
              </div>
            )}

            <button
              type="button"
              disabled={nights <= 0 || hasOverlap || room.status !== 'available'}
              onClick={handleReserveClick}
              className="w-full py-3 px-4 text-sm font-semibold text-brand-primary bg-brand-accent rounded-lg hover:bg-brand-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {hasOverlap
                ? t('unavailableForDates')
                : user
                  ? t('reserveAndPay')
                  : t('signInToReserve')}
            </button>

            <div className="pt-2 flex items-center justify-center gap-3 text-xs text-slate-500">
              <span>{t('mtnMomo')}</span>
              <span aria-hidden="true">·</span>
              <span>{t('orangeMoney')}</span>
              <span aria-hidden="true">·</span>
              <span>{t('visaMastercard')}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
