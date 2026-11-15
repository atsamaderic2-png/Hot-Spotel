import React, { useEffect, useState } from 'react';
import { BedDouble, Calendar, CalendarSearch, Search, SlidersHorizontal, Users, X } from 'lucide-react';
import { api } from '../api';
import { HOTEL_HERO_IMAGE, resolveHotelImage } from '../assets/roomImages';
import { AMENITY_LABELS, useLanguage } from '../i18n';
import { HotelGallery } from '../components/HotelGallery';
import { Room, RoomCategory } from '../types';

interface RoomsViewProps {
  checkIn: string;
  checkOut: string;
  guests: number;
  selectedCategory?: 'all' | RoomCategory;
  onCategoryChange?: (category: 'all' | RoomCategory) => void;
  onChangeDates: (checkIn: string, checkOut: string) => void;
  onChangeGuests: (guests: number) => void;
  onSelectRoom: (room: Room) => void;
}

export function RoomsView({
  checkIn,
  checkOut,
  guests,
  selectedCategory,
  onCategoryChange,
  onChangeDates,
  onChangeGuests,
  onSelectRoom,
}: RoomsViewProps) {
  const { lang, t, formatPrice, formatCategory } = useLanguage();

  const [query, setQuery] = useState('');
  const [internalCategory, setInternalCategory] = useState<'all' | RoomCategory>(
    selectedCategory ?? 'all'
  );
  const category = selectedCategory ?? internalCategory;
  const setCategory = (next: 'all' | RoomCategory) => {
    setInternalCategory(next);
    onCategoryChange?.(next);
  };
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [amenity, setAmenity] = useState<string>('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});
  const [showSearchForm, setShowSearchForm] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      api
        .searchRooms({
          q: query,
          category,
          checkIn,
          checkOut,
          guests,
          maxPrice,
          amenity,
        })
        .then((res) => {
          if (active) {
            setRooms(res.rooms);
            setError('');
          }
        })
        .catch((err: any) => {
          if (active) setError(err?.message || 'Failed to load rooms');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 120);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, category, checkIn, checkOut, guests, maxPrice, amenity]);

  const resetFilters = () => {
    setQuery('');
    setCategory('all');
    setMaxPrice(0);
    setAmenity('');
    onChangeGuests(1);
  };

  const categories: { id: 'all' | RoomCategory; label: string }[] = [
    { id: 'all', label: t('allCategories') },
    { id: 'standard', label: t('catStandard') },
    { id: 'deluxe', label: t('catDeluxe') },
    { id: 'suite', label: t('catSuite') },
    { id: 'penthouse', label: t('catPenthouse') },
  ];

  return (
    <div>
      {/* Editorial Hero */}
      <section className="border-b border-brand-border bg-brand-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <div className="lg:col-span-5 flex flex-col justify-center">
              <p className="text-xs font-semibold tracking-wide text-brand-accent mb-3">
                {t('brandName')} · Douala, Cameroon
              </p>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-semibold tracking-tight text-white leading-[1.14] text-balance">
                {t('heroTitle')}
              </h1>
              <p className="mt-4 text-base text-slate-300 leading-relaxed max-w-xl">
                {t('heroSubtitle')}
              </p>

              {/* Hero CTA Button / Toggleable Booking Search Form */}
              {!showSearchForm ? (
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSearchForm(true)}
                    className="inline-flex items-center gap-2.5 px-5 py-3 text-sm font-semibold text-brand-primary bg-brand-accent rounded-lg hover:bg-brand-accent-hover transition-colors cursor-pointer"
                  >
                    <CalendarSearch className="w-4 h-4" />
                    {t('openAvailabilityForm')}
                  </button>
                  <a
                    href="#rooms-catalog"
                    className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-brand-elevated border border-brand-border-strong rounded-lg hover:bg-brand-elevated-hover transition-colors"
                  >
                    <BedDouble className="w-4 h-4 text-brand-accent" />
                    {t('browseRoomsCta')}
                  </a>
                </div>
              ) : (
                <div className="mt-8 p-4 bg-white text-slate-900 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-brand-primary">
                      <CalendarSearch className="w-4 h-4 text-brand-accent" />
                      {t('openAvailabilityForm')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSearchForm(false)}
                      aria-label={t('closeAvailabilityForm')}
                      title={t('closeAvailabilityForm')}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        {t('checkIn')}
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                        <input
                          type="date"
                          value={checkIn}
                          onChange={(e) => onChangeDates(e.target.value, checkOut)}
                          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        {t('checkOut')}
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                        <input
                          type="date"
                          value={checkOut}
                          min={checkIn}
                          onChange={(e) => onChangeDates(checkIn, e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        {t('guests')}
                      </label>
                      <div className="relative">
                        <Users className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                        <select
                          value={guests}
                          onChange={(e) => onChangeGuests(Number(e.target.value))}
                          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        >
                          {[1, 2, 3, 4].map((num) => (
                            <option key={num} value={num}>
                              {num} {num === 1 ? t('guestSingular') : t('guestsPlural')}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-end">
                      <a
                        href="#rooms-catalog"
                        className="w-full py-2 px-4 text-center text-sm font-semibold text-brand-primary bg-brand-accent rounded-lg hover:bg-brand-accent-hover transition-colors whitespace-nowrap"
                      >
                        {t('searchRooms')}
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-7">
              <div className="h-64 sm:h-80 lg:h-full min-h-[360px] rounded-xl overflow-hidden border border-brand-border-strong bg-brand-elevated">
                <img
                  src={HOTEL_HERO_IMAGE}
                  alt={t('brandName')}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Search & Catalog Section */}
      <section id="rooms-catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          {/* Category Segmented Tabs */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  category === cat.id
                    ? 'bg-brand-primary text-brand-accent shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search & Secondary Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div className="relative">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <select
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                aria-label={t('maxPrice')}
                className="pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg bg-white tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value={0}>{t('anyPrice')}</option>
                <option value={60000}>≤ 60 000 FCFA</option>
                <option value={100000}>≤ 100 000 FCFA</option>
                <option value={150000}>≤ 150 000 FCFA</option>
              </select>
            </div>

            <select
              value={amenity}
              onChange={(e) => setAmenity(e.target.value)}
              aria-label={t('amenityFilter')}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="">{t('allAmenities')}</option>
              {Object.keys(AMENITY_LABELS).map((key) => (
                <option key={key} value={key}>
                  {AMENITY_LABELS[key][lang]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Result Count */}
        <div className="py-5 flex items-center justify-between text-xs text-slate-500">
          <span className="tabular-nums">
            {rooms.length} {rooms.length === 1 ? t('roomAvailableCount') : t('roomsAvailableCount')}
          </span>
          {(query || category !== 'all' || maxPrice > 0 || amenity || guests > 1) && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-brand-primary font-semibold hover:underline cursor-pointer"
            >
              {t('clearFilters')}
            </button>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 mb-6">
            {error}
          </div>
        )}

        {/* Rooms Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                <div className="aspect-[4/3] bg-slate-100 animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-28 bg-slate-100 rounded animate-pulse" />
                  <div className="h-5 w-48 bg-slate-100 rounded animate-pulse" />
                  <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="py-16 text-center border border-slate-200 rounded-xl bg-slate-50/50">
            <BedDouble className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="text-sm text-slate-600 mb-4">{t('noRoomsMatch')}</p>
            <button
              type="button"
              onClick={resetFilters}
              className="px-4 py-2 text-xs font-semibold text-brand-primary bg-brand-accent rounded-lg hover:bg-brand-accent-hover"
            >
              {t('clearFilters')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {rooms.map((room) => {
              const title = lang === 'fr' ? room.name_fr : room.name_en;
              const desc = lang === 'fr' ? room.description_fr : room.description_en;
              const bedType = lang === 'fr' ? room.bed_type_fr : room.bed_type_en;
              const isAvailable = room.available_for_dates !== false;

              return (
                <article
                  key={room.id}
                  className={`group rounded-xl border bg-white overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    isAvailable ? 'border-slate-200' : 'border-red-200 bg-slate-50/40'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectRoom(room)}
                    className="block w-full aspect-[4/3] bg-slate-100 overflow-hidden text-left cursor-pointer relative"
                  >
                    {!imgErrors[room.id] ? (
                      <img
                        src={resolveHotelImage(room.images[0])}
                        alt={title}
                        referrerPolicy="no-referrer"
                        onError={() => setImgErrors((prev) => ({ ...prev, [room.id]: true }))}
                        className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02] ${
                          !isAvailable ? 'grayscale-[35%] opacity-90' : ''
                        }`}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-500 p-4">
                        <BedDouble className="w-8 h-8 mb-2 text-slate-400" />
                        <span className="text-xs font-medium text-center">{title}</span>
                      </div>
                    )}
                  </button>

                  <div className="p-5 flex-1 flex flex-col">
                    {/* Unboxed Metadata Line (Zero-Pill Discipline) */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 tabular-nums">
                      <span>{formatCategory(room.category)}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {t('floorLabel')} {room.floor}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{room.size_sqm} m²</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {room.capacity} {room.capacity === 1 ? t('guestSingular') : t('guestsPlural')}
                      </span>
                    </div>

                    <h3 className="font-display text-lg font-semibold text-brand-primary mt-2">
                      <button
                        type="button"
                        onClick={() => onSelectRoom(room)}
                        className="text-left hover:underline transition-colors cursor-pointer"
                      >
                        {title}
                      </button>
                    </h3>

                    <p className="text-sm text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">{desc}</p>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-xs text-slate-500">{bedType}</p>
                        <p className="mt-0.5">
                          <span className="font-mono-tabular text-base font-semibold text-brand-primary">
                            {formatPrice(room.price_per_night)}
                          </span>{' '}
                          <span className="text-xs text-slate-500">{t('perNight')}</span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectRoom(room)}
                        className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          isAvailable
                            ? 'text-brand-primary bg-brand-accent hover:bg-brand-accent-hover'
                            : 'text-slate-700 border border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {t('viewDetails')}
                      </button>
                    </div>

                    {isAvailable ? (
                      <p className="mt-3 text-xs font-medium text-emerald-700">
                        {t('availableForDates')}
                      </p>
                    ) : (
                      <p className="mt-3 text-xs font-semibold text-red-700 tabular-nums">
                        {t('bookedByAnotherGuest')}
                        {room.booked_overlap
                          ? ` (${room.booked_overlap.check_in} → ${room.booked_overlap.check_out})`
                          : ''}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Hotel Amenities & Common Areas Gallery */}
      <HotelGallery />
    </div>
  );
}
