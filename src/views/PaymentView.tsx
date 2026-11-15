import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, CreditCard, Loader2, ShieldCheck, Smartphone } from 'lucide-react';
import { api } from '../api';
import { resolveHotelImage } from '../assets/roomImages';
import { MtnMomoLogo, OrangeMoneyLogo, VisaMastercardLogo } from '../components/PaymentLogos';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n';
import { PaymentMethod, Reservation, Room } from '../types';

interface PaymentViewProps {
  room: Room;
  checkIn: string;
  checkOut: string;
  nights: number;
  guestsCount: number;
  onBack: () => void;
  onConfirmed: (reservation: Reservation) => void;
}

export function PaymentView({
  room,
  checkIn,
  checkOut,
  nights,
  guestsCount,
  onBack,
  onConfirmed,
}: PaymentViewProps) {
  const { user } = useAuth();
  const { lang, t, formatPrice, formatCategory } = useLanguage();

  const [step, setStep] = useState<'details' | 'authorize'>('details');
  const [provider, setProvider] = useState<PaymentMethod>('mtn_momo');
  const [paymentPhone, setPaymentPhone] = useState(user?.phone || '+237 677 00 00 00');
  const [cardHolder, setCardHolder] = useState(user?.name || '');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [guestName, setGuestName] = useState(user?.name || '');
  const [guestEmail, setGuestEmail] = useState(user?.email || '');
  const [guestPhone, setGuestPhone] = useState(user?.phone || '');
  const [specialRequests, setSpecialRequests] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const totalAmount = room.price_per_night * nights;
  const roomName = lang === 'fr' ? room.name_fr : room.name_en;

  const formatCardInput = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiryInput = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (provider === 'visa_mastercard') {
      const digits = cardNumber.replace(/\D/g, '');
      if (digits.length < 13) {
        setError('Enter a valid 16-digit Visa or Mastercard number.');
        return;
      }
      if (cardExpiry.length < 5 || cardCvv.length < 3) {
        setError('Enter a valid card expiry (MM/YY) and 3-digit CVV.');
        return;
      }
    } else {
      if (paymentPhone.replace(/[\s\-()]/g, '').length < 8) {
        setError('Enter a valid Mobile Money phone number (at least 8 digits).');
        return;
      }
    }
    setStep('authorize');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (pin.trim().length < 4) {
      setError('Enter your 4 to 6-digit verification PIN / OTP to authorize.');
      return;
    }
    setProcessing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 650));
      const cardLast4 = cardNumber.replace(/\D/g, '').slice(-4);
      const paymentAccount =
        provider === 'visa_mastercard' ? `CARD •••• ${cardLast4 || '4242'}` : paymentPhone;

      const res = await api.createReservation({
        roomId: room.id,
        checkIn,
        checkOut,
        guestsCount,
        paymentMethod: provider,
        paymentPhone: paymentAccount,
        guestName,
        guestEmail,
        guestPhone: guestPhone || paymentPhone,
        specialRequests,
      });
      onConfirmed(res.reservation);
    } catch (err: any) {
      setError(err?.message || 'Payment verification failed');
    } finally {
      setProcessing(false);
    }
  };

  const providerDisplayName =
    provider === 'orange_money'
      ? t('orangeMoney')
      : provider === 'mtn_momo'
        ? t('mtnMomo')
        : t('visaMastercard');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-brand-primary hover:underline mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('backStep')}
      </button>

      <div className="pb-6 border-b border-slate-200 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-brand-primary">{t('payTitle')}</h1>
          <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">{t('payPageSubtitle')}</p>
        </div>

        {/* Accepted Payment Brand Logos Banner */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <MtnMomoLogo className="h-8 w-auto" />
          <OrangeMoneyLogo className="h-8 w-auto" />
          <VisaMastercardLogo className="h-8 w-auto" />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Payment Selection & Form */}
        <div className="lg:col-span-7 p-6 rounded-xl border border-slate-200 bg-white">
          {error && (
            <div className="mb-5 px-4 py-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          {step === 'details' ? (
            <form onSubmit={handleNext} className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-brand-primary mb-3">{t('chooseProvider')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* MTN MoMo */}
                  <button
                    type="button"
                    aria-label={t('mtnMomo')}
                    onClick={() => setProvider('mtn_momo')}
                    className={`relative p-4 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                      provider === 'mtn_momo'
                        ? 'border-brand-primary bg-yellow-50/70 ring-2 ring-brand-accent'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <MtnMomoLogo className="h-9 w-auto" />
                    {provider === 'mtn_momo' && (
                      <CheckCircle2 className="w-4 h-4 text-brand-primary absolute top-2 right-2" />
                    )}
                  </button>

                  {/* Orange Money */}
                  <button
                    type="button"
                    aria-label={t('orangeMoney')}
                    onClick={() => setProvider('orange_money')}
                    className={`relative p-4 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                      provider === 'orange_money'
                        ? 'border-[#FF7900] bg-orange-50/60 ring-2 ring-[#FF7900]/40'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <OrangeMoneyLogo className="h-9 w-auto" />
                    {provider === 'orange_money' && (
                      <CheckCircle2 className="w-4 h-4 text-[#FF7900] absolute top-2 right-2" />
                    )}
                  </button>

                  {/* Visa / Mastercard */}
                  <button
                    type="button"
                    aria-label={t('visaMastercard')}
                    onClick={() => setProvider('visa_mastercard')}
                    className={`relative p-4 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                      provider === 'visa_mastercard'
                        ? 'border-brand-primary bg-slate-50 ring-2 ring-brand-primary/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <VisaMastercardLogo className="h-9 w-auto" />
                    {provider === 'visa_mastercard' && (
                      <CheckCircle2 className="w-4 h-4 text-brand-primary absolute top-2 right-2" />
                    )}
                  </button>
                </div>
              </div>

              {provider === 'visa_mastercard' ? (
                <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      {t('cardHolderLabel')}
                    </label>
                    <input
                      type="text"
                      required
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="Claire Nkodo"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      {t('cardNumberLabel')}
                    </label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardInput(e.target.value))}
                        placeholder="4532 8910 2345 6789"
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm font-mono-tabular border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        {t('cardExpiryLabel')}
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiryInput(e.target.value))}
                        placeholder="08/29"
                        className="w-full px-3.5 py-2.5 text-sm font-mono-tabular border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        {t('cardCvvLabel')}
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        required
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        placeholder="123"
                        className="w-full px-3.5 py-2.5 text-sm font-mono-tabular border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    {t('mobileNumberLabel')}
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      required
                      value={paymentPhone}
                      onChange={(e) => setPaymentPhone(e.target.value)}
                      placeholder={t('mobileNumberPlaceholder')}
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-lg font-mono-tabular focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 space-y-3">
                <p className="text-xs font-semibold text-brand-primary">{t('guestDetailsTitle')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">{t('fullName')}</label>
                    <input
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">{t('emailAddress')}</label>
                    <input
                      type="email"
                      required
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">{t('phoneNumber')}</label>
                    <input
                      type="tel"
                      required
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="+237 6XX XX XX XX"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-tabular focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">{t('specialRequests')}</label>
                    <input
                      type="text"
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder={t('specialRequestsPlaceholder')}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 text-sm font-semibold text-brand-primary bg-brand-accent hover:bg-brand-accent-hover rounded-lg transition-colors cursor-pointer"
              >
                {t('proceedToAuthorize')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleConfirmPayment} className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">{t('paymentMethodLabel')}</span>
                  <div className="flex items-center gap-2">
                    {provider === 'mtn_momo' && <MtnMomoLogo className="h-6 w-auto" />}
                    {provider === 'orange_money' && <OrangeMoneyLogo className="h-6 w-auto" />}
                    {provider === 'visa_mastercard' && <VisaMastercardLogo className="h-6 w-auto" />}
                    <span className="text-sm font-semibold text-slate-900">{providerDisplayName}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    {provider === 'visa_mastercard' ? t('cardNumberLabel') : t('mobileNumberLabel')}
                  </span>
                  <span className="font-mono-tabular text-sm text-slate-900">
                    {provider === 'visa_mastercard'
                      ? `•••• •••• •••• ${cardNumber.replace(/\D/g, '').slice(-4) || '4242'}`
                      : paymentPhone}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="text-xs font-semibold text-slate-700">{t('totalAmount')}</span>
                  <span className="font-mono-tabular text-lg font-bold text-brand-primary">
                    {formatPrice(totalAmount)}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs text-slate-600">
                <ShieldCheck className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{t('authorizeTitle')}</p>
                  <p className="mt-1 leading-relaxed">
                    {provider === 'orange_money'
                      ? t('authorizeDescOrange')
                      : provider === 'mtn_momo'
                        ? t('authorizeDescMtn')
                        : t('authorizeDescCard')}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  {provider === 'visa_mastercard' ? t('pinOrOtpLabel') : t('pinLabel')}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  autoFocus
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-4 py-3 text-center text-lg tracking-[0.5em] font-mono-tabular border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => setStep('details')}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  {t('backStep')}
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white bg-brand-primary rounded-lg hover:bg-brand-elevated disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {processing && <Loader2 className="w-4 h-4 animate-spin text-brand-accent" />}
                  {processing ? t('processingPayment') : t('confirmPayment')}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Column: Order Summary */}
        <aside className="lg:col-span-5 p-6 rounded-xl border border-slate-200 bg-slate-50/70 space-y-5">
          <h2 className="font-display text-lg font-semibold text-brand-primary pb-3 border-b border-slate-200">
            {t('orderSummaryTitle')}
          </h2>

          <div className="flex items-start gap-4">
            <div className="w-24 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
              <img
                src={resolveHotelImage(room.images[0])}
                alt={roomName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-xs text-slate-500">
                {formatCategory(room.category)} · #{room.room_number}
              </p>
              <h3 className="font-display text-base font-semibold text-slate-900 mt-0.5">
                {roomName}
              </h3>
              <p className="text-xs text-slate-600 mt-1 tabular-nums">
                {guestsCount} {guestsCount === 1 ? t('guestSingular') : t('guestsPlural')}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">{t('stayDates')}</span>
              <span className="font-mono-tabular text-slate-900 font-medium">
                {checkIn} → {checkOut}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 tabular-nums">
                {formatPrice(room.price_per_night)} × {nights}{' '}
                {nights === 1 ? t('nightLabel') : t('nightsLabel')}
              </span>
              <span className="font-mono-tabular text-slate-900">{formatPrice(totalAmount)}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <span className="font-semibold text-brand-primary">{t('totalAmount')}</span>
              <span className="font-mono-tabular text-xl font-bold text-brand-primary">
                {formatPrice(totalAmount)}
              </span>
            </div>
            <p className="text-xs text-slate-500">{t('taxesIncluded')}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
