import React, { useEffect, useRef, useState } from 'react';
import {
  BedDouble,
  Check,
  LogIn,
  LogOut,
  Menu,
  Palette,
  QrCode,
  ShieldCheck,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../i18n';
import { HotelLogo } from './HotelLogo';

export type AppView = 'rooms' | 'room-detail' | 'payment' | 'scanner' | 'account' | 'admin';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onOpenAuth: () => void;
}

export function Navbar({ currentView, onNavigate, onOpenAuth }: NavbarProps) {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const { theme, setTheme, themes, currentThemeOption } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const themeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setThemeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNav = (view: AppView) => {
    onNavigate(view);
    setMobileOpen(false);
  };

  const navLinkClass = (active: boolean) =>
    `inline-flex items-center gap-2 text-sm font-medium whitespace-nowrap shrink-0 pb-1 transition-colors border-b-2 cursor-pointer ${
      active
        ? 'text-brand-accent border-brand-accent'
        : 'text-white/90 border-transparent hover:text-white hover:border-brand-accent/60'
    }`;

  return (
    <header className="relative bg-brand-primary text-white border-b border-brand-border no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Emblem & Wordmark */}
        <button
          type="button"
          onClick={() => handleNav('rooms')}
          className="whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent"
        >
          <HotelLogo variant="light" />
        </button>

        {/* Zone 2: Single-line navigation links with crisp icon logos */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Primary navigation">
          <button
            type="button"
            onClick={() => handleNav('rooms')}
            className={navLinkClass(
              currentView === 'rooms' || currentView === 'room-detail' || currentView === 'payment'
            )}
          >
            <BedDouble className="w-4 h-4 shrink-0 text-brand-accent" />
            <span>{t('navRooms')}</span>
          </button>
          <button
            type="button"
            onClick={() => handleNav('scanner')}
            className={navLinkClass(currentView === 'scanner')}
          >
            <QrCode className="w-4 h-4 shrink-0 text-brand-accent" />
            <span>{t('navScanner')}</span>
          </button>
          {user && (
            <button
              type="button"
              onClick={() => handleNav('account')}
              className={navLinkClass(currentView === 'account')}
            >
              <UserIcon className="w-4 h-4 shrink-0 text-brand-accent" />
              <span>{t('navAccount')}</span>
            </button>
          )}
          {user?.role === 'admin' && (
            <button
              type="button"
              onClick={() => handleNav('admin')}
              className={navLinkClass(currentView === 'admin')}
            >
              <ShieldCheck className="w-4 h-4 shrink-0 text-brand-accent" />
              <span>{t('navAdmin')}</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Theme Switcher, Language Switcher & Primary Auth Action */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          {/* Theme Picker Dropdown */}
          <div className="relative" ref={themeRef}>
            <button
              type="button"
              onClick={() => setThemeOpen((prev) => !prev)}
              aria-expanded={themeOpen}
              aria-label={t('themeLabel')}
              title={t('themeLabel')}
              className="inline-flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold bg-brand-elevated text-white rounded-md border border-brand-border-strong hover:bg-brand-elevated-hover transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5 text-brand-accent shrink-0" />
              <span className="hidden lg:inline">
                {lang === 'fr' ? currentThemeOption.labelFr : currentThemeOption.labelEn}
              </span>
            </button>

            {themeOpen && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-xl bg-white text-slate-900 border border-slate-200 shadow-xl py-1.5 z-50"
                role="menu"
                aria-label={t('themeLabel')}
              >
                <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  {t('themeLabel')}
                </div>
                {themes.map((opt) => {
                  const active = opt.id === theme;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="menuitemradio"
                      aria-checked={active}
                      onClick={() => {
                        setTheme(opt.id);
                        setThemeOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        active ? 'bg-slate-100 text-slate-950 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="inline-flex items-center gap-2.5">
                        <span className="inline-flex items-center -space-x-1 shrink-0">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white shadow-xs"
                            style={{ backgroundColor: opt.primaryHex }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white shadow-xs"
                            style={{ backgroundColor: opt.accentHex }}
                          />
                        </span>
                        <span>{lang === 'fr' ? opt.labelFr : opt.labelEn}</span>
                      </span>
                      {active && <Check className="w-3.5 h-3.5 text-brand-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div
            className="flex items-center bg-brand-elevated p-0.5 rounded-md border border-brand-border-strong"
            role="group"
            aria-label="Language"
          >
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                lang === 'en' ? 'bg-brand-accent text-brand-primary' : 'text-white/90 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('fr')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                lang === 'fr' ? 'bg-brand-accent text-brand-primary' : 'text-white/90 hover:text-white'
              }`}
            >
              FR
            </button>
          </div>

          {user ? (
            <button
              type="button"
              onClick={() => {
                logout();
                if (currentView === 'account' || currentView === 'admin') {
                  handleNav('rooms');
                }
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white border border-white/40 rounded-lg hover:bg-brand-elevated transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('signOut')}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-brand-primary bg-brand-accent rounded-lg hover:bg-brand-accent-hover transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t('signIn')}</span>
            </button>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
            className="px-2.5 py-1.5 text-xs font-semibold bg-brand-elevated text-brand-accent rounded-md border border-brand-border-strong whitespace-nowrap"
          >
            {lang.toUpperCase()}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            className="p-2 text-white hover:bg-brand-elevated rounded-lg"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-brand-border bg-brand-primary px-4 py-4 space-y-2">
          <button
            type="button"
            onClick={() => handleNav('rooms')}
            className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 text-sm font-medium text-white rounded-lg hover:bg-brand-elevated"
          >
            <BedDouble className="w-4 h-4 text-brand-accent" />
            <span>{t('navRooms')}</span>
          </button>
          <button
            type="button"
            onClick={() => handleNav('scanner')}
            className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 text-sm font-medium text-white rounded-lg hover:bg-brand-elevated"
          >
            <QrCode className="w-4 h-4 text-brand-accent" />
            <span>{t('navScanner')}</span>
          </button>
          {user && (
            <button
              type="button"
              onClick={() => handleNav('account')}
              className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 text-sm font-medium text-white rounded-lg hover:bg-brand-elevated"
            >
              <UserIcon className="w-4 h-4 text-brand-accent" />
              <span>{t('navAccount')}</span>
            </button>
          )}
          {user?.role === 'admin' && (
            <button
              type="button"
              onClick={() => handleNav('admin')}
              className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 text-sm font-medium text-white rounded-lg hover:bg-brand-elevated"
            >
              <ShieldCheck className="w-4 h-4 text-brand-accent" />
              <span>{t('navAdmin')}</span>
            </button>
          )}

          {/* Mobile Theme Selector */}
          <div className="pt-2 pb-1 border-t border-brand-border">
            <p className="px-3 py-1 text-xs font-semibold text-brand-accent flex items-center gap-2">
              <Palette className="w-3.5 h-3.5" />
              <span>{t('themeLabel')}</span>
            </p>
            <div className="grid grid-cols-2 gap-2 px-1 mt-1.5">
              {themes.map((opt) => {
                const active = opt.id === theme;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTheme(opt.id)}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      active
                        ? 'bg-brand-elevated border-brand-accent text-white'
                        : 'border-brand-border-strong text-white/80 hover:bg-brand-elevated'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-white/60 shrink-0"
                      style={{ backgroundColor: opt.accentHex }}
                    />
                    <span className="truncate">{lang === 'fr' ? opt.labelFr : opt.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-brand-border">
            {user ? (
              <button
                type="button"
                onClick={() => {
                  logout();
                  handleNav('rooms');
                }}
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-white border border-white/40 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('signOut')}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onOpenAuth();
                }}
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-brand-primary bg-brand-accent rounded-lg"
              >
                <LogIn className="w-4 h-4" />
                <span>{t('signIn')}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
