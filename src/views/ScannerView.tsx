import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, CheckCircle2, Clock, FileUp, Keyboard, QrCode, ShieldAlert, XCircle } from 'lucide-react';
import { api } from '../api';
import { useLanguage } from '../i18n';
import { Reservation } from '../types';

export function ScannerView() {
  const { lang, t, formatPrice } = useLanguage();

  const [mode, setMode] = useState<'camera' | 'upload' | 'manual'>('manual');
  const [manualInput, setManualInput] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [result, setResult] = useState<{
    valid: boolean;
    reason?: string;
    searchedCode?: string;
    isCancelled?: boolean;
    isExpired?: boolean;
    expiredReason?: string | null;
    expiredDays?: number;
    expiredHours?: number;
    remainingHours?: number;
    checkOutDeadline?: string;
    reservation?: Reservation;
    canManage?: boolean;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const stopCamera = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (mode !== 'camera') {
      stopCamera();
    }
  }, [mode]);

  const verifyPayload = async (payload: string) => {
    if (!payload.trim()) return;
    setVerifying(true);
    try {
      const res = await api.verifyReceipt(payload.trim());
      setResult(res);
    } catch {
      setResult({ valid: false, reason: 'NETWORK_ERROR' });
    } finally {
      setVerifying(false);
    }
  };

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setCameraActive(true);

      setTimeout(() => {
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const scanLoop = () => {
          const video = videoRef.current;
          if (!video || !streamRef.current) return;

          if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });
            if (code && code.data) {
              stopCamera();
              setManualInput(code.data);
              verifyPayload(code.data);
              return;
            }
          }
          rafRef.current = requestAnimationFrame(scanLoop);
        };

        rafRef.current = requestAnimationFrame(scanLoop);
      }, 80);
    } catch {
      setCameraError(t('cameraError'));
      setCameraActive(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });
        if (decoded && decoded.data) {
          setManualInput(decoded.data);
          verifyPayload(decoded.data);
        } else {
          setUploadError('No valid QR code detected inside this image.');
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyPayload(manualInput);
  };

  const handleQuickStatusUpdate = async (nextStatus: 'checked_in' | 'checked_out') => {
    if (!result?.reservation) return;
    setUpdatingStatus(true);
    try {
      const res = await api.adminUpdateReservation(result.reservation.id, { status: nextStatus });
      setResult((prev) => (prev ? { ...prev, reservation: res.reservation } : prev));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const statusText = (status: Reservation['status']) => {
    if (status === 'confirmed') return t('statusConfirmed');
    if (status === 'checked_in') return t('statusCheckedIn');
    if (status === 'checked_out') return t('statusCheckedOut');
    return t('statusCancelled');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="pb-6 border-b border-slate-200">
        <h1 className="font-display text-3xl font-semibold text-slate-900">{t('scannerTitle')}</h1>
        <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">{t('scannerSubtitle')}</p>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Scanner Input Modes */}
        <div className="lg:col-span-6 p-6 rounded-xl border border-slate-200 bg-white space-y-6">
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                mode === 'manual' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              {t('modeManual')}
            </button>
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                mode === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileUp className="w-3.5 h-3.5" />
              {t('modeUpload')}
            </button>
            <button
              type="button"
              onClick={() => setMode('camera')}
              className={`inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                mode === 'camera' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              {t('modeCamera')}
            </button>
          </div>

          {mode === 'camera' && (
            <div className="space-y-4">
              {cameraError && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  {cameraError}
                </div>
              )}

              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 border border-slate-200 flex items-center justify-center relative">
                {cameraActive ? (
                  <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-6 text-slate-400">
                    <QrCode className="w-10 h-10 mx-auto mb-2 text-slate-500" />
                    <p className="text-xs max-w-xs">{t('cameraHint')}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                {!cameraActive ? (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-brand-primary rounded-lg hover:bg-brand-elevated transition-colors"
                  >
                    {t('startCamera')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="w-full py-2.5 px-4 text-sm font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    {t('stopCamera')}
                  </button>
                )}
              </div>
            </div>
          )}

          {mode === 'upload' && (
            <div className="space-y-4">
              <label className="block border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-brand-primary hover:bg-slate-50/60 transition-colors">
                <FileUp className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-800">{t('uploadQrLabel')}</p>
                <span className="inline-block mt-3 px-4 py-2 text-xs font-semibold text-brand-primary bg-brand-accent rounded-lg">
                  {t('uploadQrButton')}
                </span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>

              {uploadError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  {uploadError}
                </div>
              )}
            </div>
          )}

          {mode === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  {t('manualCodeLabel')}
                </label>
                <input
                  type="text"
                  required
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder={t('manualCodePlaceholder')}
                  className="w-full px-3.5 py-2.5 text-sm font-mono-tabular border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="submit"
                  disabled={verifying}
                  className="flex-1 min-w-[140px] py-2.5 px-4 text-sm font-semibold text-white bg-brand-primary rounded-lg hover:bg-brand-elevated disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {verifying ? '...' : t('verifyButton')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sample = 'KBN-2026-8419A2';
                    setManualInput(sample);
                    verifyPayload(sample);
                  }}
                  className="px-3.5 py-2.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors whitespace-nowrap cursor-pointer"
                >
                  {t('testLatestCode')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const expiredSample = 'KBN-2026-1041D1';
                    setManualInput(expiredSample);
                    verifyPayload(expiredSample);
                  }}
                  className="px-3.5 py-2.5 text-xs font-semibold text-orange-800 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors whitespace-nowrap cursor-pointer"
                >
                  {t('testExpiredCode')}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right: Database Verification Verdict */}
        <div className="lg:col-span-6 p-6 rounded-xl border border-slate-200 bg-white">
          <h2 className="text-sm font-semibold text-slate-900 pb-4 border-b border-slate-200">
            {t('verificationResultTitle')}
          </h2>

          {!result ? (
            <div className="py-14 text-center text-slate-500">
              <QrCode className="w-9 h-9 text-slate-300 mx-auto mb-3" />
              <p className="text-sm">{t('verdictEmptyHint')}</p>
            </div>
          ) : !result.valid ? (
            <div className="py-8 space-y-3">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800">
                <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">{t('verdictInvalid')}</p>
                  {result.searchedCode && (
                    <p className="text-xs font-mono-tabular mt-1">Code: {result.searchedCode}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="pt-5 space-y-5">
              <div
                className={`flex items-start gap-3 p-4 rounded-xl border ${
                  result.isCancelled
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : result.isExpired
                      ? 'bg-orange-50 border-orange-300 text-orange-950'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                {result.isCancelled ? (
                  <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-amber-700" />
                ) : result.isExpired ? (
                  <Clock className="w-5 h-5 shrink-0 mt-0.5 text-orange-600" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-700" />
                )}
                <div className="space-y-1">
                  <p className="text-sm font-semibold">
                    {result.isCancelled
                      ? t('verdictCancelled')
                      : result.isExpired
                        ? t('verdictExpired')
                        : t('verdictValid')}
                  </p>
                  <p className="font-mono-tabular text-xs">
                    {result.reservation?.receipt_code} · SIG {result.reservation?.qr_signature}
                  </p>
                  {result.isExpired && (
                    <div className="pt-1 text-xs text-orange-900 space-y-0.5">
                      <p>{t('expiredBannerDesc')}</p>
                      <p className="font-mono-tabular font-semibold">
                        {t('stayDeadlineLabel')}: {result.checkOutDeadline}
                        {result.expiredHours && result.expiredHours > 0
                          ? ` · ${t('overdueByLabel')}: ${
                              (result.expiredDays || 0) > 0
                                ? `${result.expiredDays}d ${result.expiredHours % 24}h`
                                : `${result.expiredHours}h`
                            }`
                          : ` · ${t('checkedOutAlreadyLabel')}`}
                      </p>
                    </div>
                  )}
                  {!result.isExpired && !result.isCancelled && result.checkOutDeadline && (
                    <p className="text-xs font-mono-tabular text-emerald-800 pt-0.5">
                      {t('activeStayStatus')} · {t('stayDeadlineLabel')}: {result.checkOutDeadline}
                    </p>
                  )}
                </div>
              </div>

              {result.reservation && (
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-200">
                    <div>
                      <p className="text-xs text-slate-500">{t('guestCol')}</p>
                      <p className="font-semibold text-slate-900 mt-0.5">
                        {result.reservation.guest_name}
                      </p>
                      <p className="text-xs text-slate-600">{result.reservation.guest_email}</p>
                      <p className="text-xs text-slate-600 tabular-nums">
                        {result.reservation.guest_phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{t('roomNameCol')}</p>
                      <p className="font-semibold text-slate-900 mt-0.5">
                        {lang === 'fr'
                          ? result.reservation.room_name_fr
                          : result.reservation.room_name_en}
                      </p>
                      <p className="text-xs text-slate-600 tabular-nums">
                        {t('roomNumberLabel')} #{result.reservation.room_number}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-200">
                    <div>
                      <p className="text-xs text-slate-500">{t('stayDates')}</p>
                      <p className="font-medium text-slate-900 mt-0.5 tabular-nums">
                        {result.reservation.check_in} → {result.reservation.check_out}
                      </p>
                      <p className="text-xs text-slate-600 tabular-nums">
                        {result.reservation.nights}{' '}
                        {result.reservation.nights === 1 ? t('nightLabel') : t('nightsLabel')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{t('paymentCol')}</p>
                      <p className="font-mono-tabular font-semibold text-slate-900 mt-0.5">
                        {formatPrice(result.reservation.total_amount)}
                      </p>
                      <p className="text-xs text-slate-600 font-mono-tabular">
                        {result.reservation.payment_reference}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">{t('bookingStatusLabel')}</p>
                      <p className="font-semibold text-slate-900 mt-0.5">
                        {statusText(result.reservation.status)}
                      </p>
                    </div>

                    {result.canManage && result.reservation.status === 'confirmed' && (
                      <button
                        type="button"
                        disabled={updatingStatus}
                        onClick={() => handleQuickStatusUpdate('checked_in')}
                        className="px-4 py-2 text-xs font-semibold text-white bg-brand-primary rounded-lg hover:bg-brand-elevated disabled:opacity-60"
                      >
                        {t('checkInGuestNow')}
                      </button>
                    )}

                    {result.canManage && result.reservation.status === 'checked_in' && (
                      <button
                        type="button"
                        disabled={updatingStatus}
                        onClick={() => handleQuickStatusUpdate('checked_out')}
                        className="px-4 py-2 text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-60"
                      >
                        {t('checkOutGuestNow')}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
