import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Printer, X } from 'lucide-react';
import { Reservation } from '../types';
import { useLanguage } from '../i18n';
import { HotelLogo } from './HotelLogo';

interface ReceiptModalProps {
  reservation: Reservation | null;
  onClose: () => void;
}

export function ReceiptModal({ reservation, onClose }: ReceiptModalProps) {
  const { lang, t, formatPrice } = useLanguage();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (!reservation) return;
    QRCode.toDataURL(reservation.qr_payload, {
      width: 240,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, [reservation]);

  if (!reservation) return null;

  const statusText =
    reservation.status === 'confirmed'
      ? t('statusConfirmed')
      : reservation.status === 'checked_in'
        ? t('statusCheckedIn')
        : reservation.status === 'checked_out'
          ? t('statusCheckedOut')
          : t('statusCancelled');

  const paymentLabel =
    reservation.payment_method === 'orange_money'
      ? t('orangeMoney')
      : reservation.payment_method === 'mtn_momo'
        ? t('mtnMomo')
        : t('visaMastercard');

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${reservation.receipt_code}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 receipt-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[85vh] bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col receipt-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Action Bar (Pinned & Hidden in Print) */}
        <div className="px-4 py-3 bg-brand-primary border-b border-brand-border flex items-center justify-between gap-3 shrink-0 no-print">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-brand-primary bg-brand-accent rounded-lg hover:bg-brand-accent-hover transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              {t('printReceipt')}
            </button>
            <button
              type="button"
              onClick={handleDownloadQr}
              disabled={!qrDataUrl}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-brand-elevated border border-brand-border-strong rounded-lg hover:bg-brand-elevated-hover transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              {t('downloadQr')}
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('closeModal')}
            className="p-1.5 text-blue-100 hover:text-white rounded-lg hover:bg-brand-elevated cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Printable Receipt Body */}
        <div id="printable-receipt" className="p-5 sm:p-6 bg-white text-slate-900 overflow-y-auto flex-1">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <HotelLogo variant="dark" />
              <p className="text-xs font-semibold text-slate-700 mt-1.5">{t('receiptTitle')}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs">{t('receiptSubtitle')}</p>
            </div>

            <div className="flex flex-col items-start sm:items-end shrink-0">
              <span className="text-[11px] text-slate-500">{t('receiptCodeLabel')}</span>
              <span className="font-mono-tabular text-sm font-semibold text-slate-900 mt-0.5">
                {reservation.receipt_code}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                {t('issuedOn')}: {reservation.created_at.slice(0, 10)}
              </span>
            </div>
          </div>

          <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center border-b border-slate-200">
            <div className="sm:col-span-2 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                <div>
                  <p className="text-[11px] text-slate-500">{t('guestCol')}</p>
                  <p className="font-semibold text-slate-900 mt-0.5">{reservation.guest_name}</p>
                  <p className="text-[11px] text-slate-600 mt-0.5 break-all">{reservation.guest_email}</p>
                  <p className="text-[11px] text-slate-600 tabular-nums">{reservation.guest_phone}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">{t('roomNameCol')}</p>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {lang === 'fr' ? reservation.room_name_fr : reservation.room_name_en}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5 tabular-nums">
                    {t('roomNumberLabel')} #{reservation.room_number}
                  </p>
                  <p className="text-[11px] text-slate-600 tabular-nums">
                    {reservation.guests_count}{' '}
                    {reservation.guests_count === 1 ? t('guestSingular') : t('guestsPlural')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm pt-1">
                <div>
                  <p className="text-[11px] text-slate-500">{t('stayDates')}</p>
                  <p className="font-medium text-slate-900 mt-0.5 tabular-nums">
                    {reservation.check_in} → {reservation.check_out}
                  </p>
                  <p className="text-[11px] text-slate-600 tabular-nums">
                    {reservation.nights} {reservation.nights === 1 ? t('nightLabel') : t('nightsLabel')}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">{t('bookingStatusLabel')}</p>
                  <p className="font-semibold text-slate-900 mt-0.5">{statusText}</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {paymentLabel} · {reservation.payment_phone}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-2.5 border border-slate-200 rounded-lg bg-slate-50/50">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR code for receipt ${reservation.receipt_code}`}
                  className="w-28 h-28 object-contain bg-white p-1 rounded border border-slate-200"
                />
              ) : (
                <div className="w-28 h-28 bg-slate-100 rounded flex items-center justify-center text-xs text-slate-500">
                  QR
                </div>
              )}
              <span className="font-mono-tabular text-[10px] text-slate-600 mt-1.5">
                {reservation.qr_signature}
              </span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-[11px] text-slate-500 space-y-0.5">
              <p>
                {t('paymentRefLabel')}:{' '}
                <span className="font-mono-tabular text-slate-800 font-medium">
                  {reservation.payment_reference}
                </span>
              </p>
              <p>{t('taxesIncluded')}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-[11px] text-slate-500">{t('totalAmount')}</p>
              <p className="font-mono-tabular text-xl font-semibold text-slate-900">
                {formatPrice(reservation.total_amount)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
