import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BedDouble,
  Building2,
  Clock,
  Crown,
  Images,
  KeyRound,
  LogIn,
  Mail,
  MapPin,
  Phone,
  QrCode,
  ShieldCheck,
  Star,
  User as UserIcon,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './i18n';
import { AppView, Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { HotelLogo } from './components/HotelLogo';
import { MtnMomoLogo, OrangeMoneyLogo, VisaMastercardLogo } from './components/PaymentLogos';
import { RoomsView } from './views/RoomsView';
import { RoomDetailView } from './views/RoomDetailView';
import { PaymentView } from './views/PaymentView';
import { AccountView } from './views/AccountView';
import { ScannerView } from './views/ScannerView';
import { AdminView } from './views/AdminView';
import { Reservation, Room, RoomCategory } from './types';

function getDefaultDates() {
  const today = new Date();
  const checkInDate = new Date(today.getTime() + 86400000);
  const checkOutDate = new Date(today.getTime() + 3 * 86400000);
  return {
    checkIn: checkInDate.toISOString().slice(0, 10),
    checkOut: checkOutDate.toISOString().slice(0, 10),
  };
}

function WhatsAppIcon({ className = 'w-4 h-4 shrink-0' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="#25D366" />
      <path
        fill="#FFFFFF"
        d="M22.7 19.1c-.3-.2-2-.99-2.3-1.1-.3-.1-.5-.2-.75.2-.22.3-.87 1.1-1.06 1.32-.2.22-.39.25-.72.08-.34-.17-1.42-.52-2.7-1.66-1-.89-1.67-1.99-1.86-2.33-.2-.33-.02-.51.15-.68.15-.15.33-.39.5-.58.17-.2.22-.33.34-.56.11-.22.05-.42-.03-.58-.08-.17-.75-1.81-1.03-2.48-.27-.65-.55-.56-.75-.57h-.64c-.22 0-.58.08-.89.42-.3.33-1.17 1.14-1.17 2.78s1.2 3.22 1.36 3.44c.17.22 2.36 3.6 5.71 5.05.8.35 1.42.55 1.91.71.8.25 1.53.22 2.11.13.64-.1 1.98-.81 2.26-1.59.28-.78.28-1.45.2-1.59-.08-.14-.3-.22-.64-.39z"
      />
    </svg>
  );
}

function HotelAppShell() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const defaults = getDefaultDates();
  const [view, setView] = useState<AppView>('rooms');
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [checkoutState, setCheckoutState] = useState<{
    room: Room;
    nights: number;
    guestsCount: number;
  } | null>(null);
  const [checkIn, setCheckIn] = useState(defaults.checkIn);
  const [checkOut, setCheckOut] = useState(defaults.checkOut);
  const [guests, setGuests] = useState(2);
  const [selectedCategory, setSelectedCategory] = useState<'all' | RoomCategory>('all');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [latestReceipt, setLatestReceipt] = useState<Reservation | null>(null);

  const handleChangeDates = (nextIn: string, nextOut: string) => {
    setCheckIn(nextIn);
    if (nextOut <= nextIn) {
      const d = new Date(`${nextIn}T00:00:00Z`);
      if (!Number.isNaN(d.getTime())) {
        const nextDay = new Date(d.getTime() + 86400000);
        setCheckOut(nextDay.toISOString().slice(0, 10));
        return;
      }
    }
    setCheckOut(nextOut);
  };

  const handleSelectRoom = (room: Room) => {
    setSelectedRoomId(room.id);
    setView('room-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (nextView: AppView) => {
    if (nextView === 'account' && !user) {
      setAuthModalOpen(true);
      return;
    }
    if (nextView === 'admin' && user?.role !== 'admin') {
      setView('rooms');
      return;
    }
    setView(nextView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToCategory = (cat: 'all' | RoomCategory) => {
    setSelectedCategory(cat);
    setView('rooms');
    setTimeout(() => {
      const el = document.getElementById('rooms-catalog');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 60);
  };

  const scrollToGallery = () => {
    setView('rooms');
    setTimeout(() => {
      const el = document.getElementById('hotel-gallery');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 60);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  const whatsappHref =
    'https://wa.me/237233421890?text=Hello%20hotel%20Spot%20Douala';

  return (
    <div className="min-h-screen flex flex-col bg-[var(--theme-page-bg)] text-slate-900">
      <Navbar
        currentView={view}
        onNavigate={handleNavigate}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Perfect-Circle Floating WhatsApp Button at Top Right */}
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        title={t('whatsappLabel')}
        aria-label={t('whatsappLabel')}
        className="fixed top-20 right-4 z-40 w-12 h-12 rounded-full bg-brand-primary border-2 border-[#25D366] shadow-lg flex items-center justify-center hover:bg-brand-elevated hover:scale-105 transition-all no-print"
      >
        <WhatsAppIcon className="w-8 h-8" />
      </a>

      <main className="flex-1">
        {view === 'rooms' && (
          <RoomsView
            checkIn={checkIn}
            checkOut={checkOut}
            guests={guests}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onChangeDates={handleChangeDates}
            onChangeGuests={setGuests}
            onSelectRoom={handleSelectRoom}
          />
        )}

        {view === 'room-detail' && selectedRoomId !== null && (
          <RoomDetailView
            roomId={selectedRoomId}
            checkIn={checkIn}
            checkOut={checkOut}
            guests={guests}
            onChangeDates={handleChangeDates}
            onChangeGuests={setGuests}
            onBack={() => setView('rooms')}
            onRequireAuth={() => setAuthModalOpen(true)}
            onProceedToPayment={(room, nights, guestsCount) => {
              setCheckoutState({ room, nights, guestsCount });
              setView('payment');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {view === 'payment' && checkoutState && user && (
          <PaymentView
            room={checkoutState.room}
            checkIn={checkIn}
            checkOut={checkOut}
            nights={checkoutState.nights}
            guestsCount={checkoutState.guestsCount}
            onBack={() => {
              setView('room-detail');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onConfirmed={(reservation) => {
              setLatestReceipt(reservation);
              setCheckoutState(null);
              setView('account');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {view === 'account' && user && (
          <AccountView
            onBrowseRooms={() => setView('rooms')}
            initialReceipt={latestReceipt}
          />
        )}

        {view === 'scanner' && <ScannerView />}

        {view === 'admin' && user?.role === 'admin' && <AdminView />}
      </main>

      {/* Themed Footer with Icon Links */}
      <footer className="bg-brand-primary text-white border-t border-brand-border no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-brand-border-muted">
            {/* Brand Column */}
            <div className="lg:col-span-4 space-y-4">
              <HotelLogo variant="light" />
              <p className="text-sm text-white/80 leading-relaxed max-w-sm">
                {t('footerTagline')}
              </p>
              <div className="flex items-center gap-2 text-xs text-brand-accent font-medium">
                <Clock className="w-4 h-4 shrink-0" />
                <span>{t('footerConciergeHours')}</span>
              </div>
            </div>

            {/* Explore Links with Icons */}
            <div className="lg:col-span-2">
              <h3 className="text-xs font-semibold text-brand-accent uppercase tracking-wider mb-4">
                {t('footerExplore')}
              </h3>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <button
                    type="button"
                    onClick={() => navigateToCategory('all')}
                    className="inline-flex items-center gap-2 text-white/90 hover:text-brand-accent transition-colors cursor-pointer"
                  >
                    <BedDouble className="w-4 h-4 text-brand-accent shrink-0" />
                    <span>{t('navRooms')}</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={scrollToGallery}
                    className="inline-flex items-center gap-2 text-white/90 hover:text-brand-accent transition-colors cursor-pointer"
                  >
                    <Images className="w-4 h-4 text-brand-accent shrink-0" />
                    <span>{t('hotelGalleryTitle')}</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigate('scanner')}
                    className="inline-flex items-center gap-2 text-white/90 hover:text-brand-accent transition-colors cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-brand-accent shrink-0" />
                    <span>{t('navScanner')}</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => (user ? handleNavigate('account') : setAuthModalOpen(true))}
                    className="inline-flex items-center gap-2 text-white/90 hover:text-brand-accent transition-colors cursor-pointer"
                  >
                    {user ? (
                      <UserIcon className="w-4 h-4 text-brand-accent shrink-0" />
                    ) : (
                      <LogIn className="w-4 h-4 text-brand-accent shrink-0" />
                    )}
                    <span>{user ? t('navAccount') : t('signIn')}</span>
                  </button>
                </li>
                {user?.role === 'admin' && (
                  <li>
                    <button
                      type="button"
                      onClick={() => handleNavigate('admin')}
                      className="inline-flex items-center gap-2 text-white/90 hover:text-brand-accent transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-brand-accent shrink-0" />
                      <span>{t('navAdmin')}</span>
                    </button>
                  </li>
                )}
              </ul>
            </div>

            {/* Accommodations Column with Icons */}
            <div className="lg:col-span-2">
              <h3 className="text-xs font-semibold text-brand-accent uppercase tracking-wider mb-4">
                {t('footerSuitesCol')}
              </h3>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <button
                    type="button"
                    onClick={() => navigateToCategory('standard')}
                    className="inline-flex items-center gap-2 text-white/90 hover:text-brand-accent transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-brand-accent shrink-0" />
                    <span>{t('catStandard')}</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigateToCategory('deluxe')}
                    className="inline-flex items-center gap-2 text-white/90 hover:text-brand-accent transition-colors cursor-pointer"
                  >
                    <Star className="w-4 h-4 text-brand-accent shrink-0" />
                    <span>{t('catDeluxe')}</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigateToCategory('suite')}
                    className="inline-flex items-center gap-2 text-white/90 hover:text-brand-accent transition-colors cursor-pointer"
                  >
                    <Building2 className="w-4 h-4 text-brand-accent shrink-0" />
                    <span>{t('catSuite')}</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigateToCategory('penthouse')}
                    className="inline-flex items-center gap-2 text-white/90 hover:text-brand-accent transition-colors cursor-pointer"
                  >
                    <Crown className="w-4 h-4 text-brand-accent shrink-0" />
                    <span>{t('catPenthouse')}</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Douala Contact & Accepted Payments */}
            <div className="lg:col-span-4 space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-brand-accent uppercase tracking-wider mb-4">
                  {t('footerContact')}
                </h3>
                <ul className="space-y-2.5 text-sm text-white/90">
                  <li className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
                    <span>{t('footerAddress')}</span>
                  </li>
                  <li className="flex items-center gap-2.5 font-mono-tabular text-xs">
                    <Phone className="w-4 h-4 text-brand-accent shrink-0" />
                    <span>+237 233 42 18 90</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs">
                    <Mail className="w-4 h-4 text-brand-accent shrink-0" />
                    <span>reservations@hotelspot.cm</span>
                  </li>
                  <li>
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-semibold text-brand-accent hover:text-white hover:underline"
                    >
                      <WhatsAppIcon className="w-4 h-4 shrink-0" />
                      <span>{t('whatsappLabel')} (+237 233 42 18 90)</span>
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-brand-accent uppercase tracking-wider mb-3">
                  {t('footerPayments')}
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <MtnMomoLogo className="h-7 w-auto" />
                  <OrangeMoneyLogo className="h-7 w-auto" />
                  <VisaMastercardLogo className="h-7 w-auto" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/75">
            <span>
              © {new Date().getFullYear()} {t('brandName')} · {t('footerRights')}
            </span>
            <div className="flex items-center gap-6">
              <span>{t('footerPolicy')}</span>
              <button
                type="button"
                onClick={scrollToTop}
                className="inline-flex items-center gap-1.5 text-brand-accent hover:underline font-medium cursor-pointer"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>{t('scrollTopLabel')}</span>
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Circular Top & End-of-Page Quick Scroll Controls */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-2.5 no-print">
        <button
          type="button"
          onClick={scrollToTop}
          title={t('scrollTopLabel')}
          aria-label={t('scrollTopLabel')}
          className="w-11 h-11 rounded-full bg-brand-primary text-brand-accent border-2 border-brand-accent shadow-lg flex items-center justify-center hover:bg-brand-elevated hover:scale-105 transition-all cursor-pointer"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={scrollToBottom}
          title={t('scrollBottomLabel')}
          aria-label={t('scrollBottomLabel')}
          className="w-11 h-11 rounded-full bg-brand-accent text-brand-primary border-2 border-brand-primary shadow-lg flex items-center justify-center hover:bg-brand-accent-hover hover:scale-105 transition-all cursor-pointer"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      </div>

      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <HotelAppShell />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
