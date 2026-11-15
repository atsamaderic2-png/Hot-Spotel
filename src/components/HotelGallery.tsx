import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { HOTEL_GALLERY_SLIDES } from '../assets/roomImages';
import { useLanguage } from '../i18n';

export function HotelGallery() {
  const { lang, t } = useLanguage();
  const [activeIdx, setActiveIdx] = useState(0);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const slides = HOTEL_GALLERY_SLIDES;
  const total = slides.length;
  const current = slides[activeIdx];

  const handlePrev = () => {
    setActiveIdx((prev) => (prev - 1 + total) % total);
  };

  const handleNext = () => {
    setActiveIdx((prev) => (prev + 1) % total);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'ArrowRight') handleNext();
  };

  const area = lang === 'fr' ? current.areaFr : current.areaEn;
  const title = lang === 'fr' ? current.titleFr : current.titleEn;
  const desc = lang === 'fr' ? current.descFr : current.descEn;

  return (
    <section
      id="hotel-gallery"
      aria-label={t('hotelGalleryTitle')}
      onKeyDown={handleKeyDown}
      className="border-t border-slate-200 bg-slate-50/70"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-slate-900 text-balance">
              {t('hotelGalleryTitle')}
            </h2>
            <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
              {t('hotelGallerySubtitle')}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="font-mono-tabular text-xs font-medium text-slate-500">
              {String(activeIdx + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrev}
                aria-label={t('previousSlide')}
                className="w-10 h-10 inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label={t('nextSlide')}
                className="w-10 h-10 inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Carousel Viewport */}
        <div className="relative aspect-[16/9] max-h-[540px] w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
          {!imgErrors[current.id] ? (
            <img
              key={current.id}
              src={current.image}
              alt={title}
              referrerPolicy="no-referrer"
              onError={() => setImgErrors((prev) => ({ ...prev, [current.id]: true }))}
              className="w-full h-full object-cover transition-opacity duration-200"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-500 p-6">
              <ImageIcon className="w-10 h-10 mb-2 text-slate-400" />
              <p className="text-sm font-medium">{title}</p>
            </div>
          )}

          {/* Contrast Scrim & Caption */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent p-6 sm:p-8 pt-16 text-white">
            <p className="text-xs font-medium text-white/85">{area}</p>
            <h3 className="font-display text-xl sm:text-2xl font-semibold text-white mt-1">
              {title}
            </h3>
            <p className="text-sm text-white/85 mt-1 max-w-2xl leading-relaxed">{desc}</p>
          </div>
        </div>

        {/* Thumbnail Strip */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
          {slides.map((slide, idx) => {
            const isSelected = idx === activeIdx;
            const slideTitle = lang === 'fr' ? slide.titleFr : slide.titleEn;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveIdx(idx)}
                className={`group text-left rounded-lg overflow-hidden border transition-all cursor-pointer bg-white ${
                  isSelected
                    ? 'border-brand-primary ring-2 ring-brand-accent'
                    : 'border-slate-200 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="aspect-[16/9] bg-slate-100 overflow-hidden">
                  {!imgErrors[slide.id] ? (
                    <img
                      src={slide.image}
                      alt={slideTitle}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="px-2.5 py-2">
                  <p className="text-xs font-medium text-slate-900 truncate">{slideTitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
