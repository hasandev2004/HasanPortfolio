import {useEffect, useMemo, useRef, useState, type MouseEvent} from 'react';
import {AnimatePresence, m} from 'motion/react';
import {
  ArrowUpRight,
  Code2,
  Home,
  Layers,
  Mail,
  Menu,
  User,
  X,
} from 'lucide-react';
import {
  BRAND_NAME,
  NAV_CTA,
  NAV_ITEMS,
  type SectionId,
} from '@/src/data/hero';
import {
  MagneticDock,
  type DockItemData,
} from '@/src/components/ui/MagneticDock';
import {useMagnetic} from '@/src/hooks/useMagnetic';
import {useReducedMotion} from '@/src/hooks/useReducedMotion';

export interface NavbarProps {
  activeSection: SectionId | null;
  isOverDarkZone?: boolean;
  onNavigate: (target: SectionId, label: string) => void;
}

const SECTION_ICONS: Record<SectionId, typeof Home> = {
  top: Home,
  projects: Layers,
  about: User,
  skills: Code2,
  contact: Mail,
};

function useIsDesktopViewport(): boolean {
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return true;
    }
    return window.matchMedia('(min-width: 1024px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return isDesktop;
}

export function Navbar({
  activeSection,
  isOverDarkZone = false,
  onNavigate,
}: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const isDesktop = useIsDesktopViewport();
  const desktopCtaRef = useMagnetic<HTMLAnchorElement>({strength: 4});

  const toggleButtonRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, {passive: true});
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!isMobileOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 20);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsMobileOpen(false);
        toggleButtonRef.current?.focus();
        return;
      }

      if (event.key === 'Tab' && drawerRef.current) {
        const focusables = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        );
        if (focusables.length === 0) {
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const activeInsideDrawer = drawerRef.current.contains(
          document.activeElement,
        );

        if (!activeInsideDrawer) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileOpen]);

  const handleLinkClick = (
    event: MouseEvent<HTMLElement>,
    target: SectionId,
    label: string,
  ) => {
    event.preventDefault();
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
    onNavigate(target, label);
  };

  const navDestinations = useMemo(
    () => [
      {label: 'Home', target: 'top' as SectionId, href: '#top' as const},
      ...NAV_ITEMS,
    ],
    [],
  );

  const dockItems: DockItemData[] = useMemo(
    () =>
      navDestinations.map((item) => {
        const Icon = SECTION_ICONS[item.target];
        return {
          id: item.target,
          label: item.label,
          href: item.href,
          icon: <Icon className="h-full w-full" strokeWidth={1.75} />,
          isActive: activeSection === item.target,
          ariaCurrent: 'location',
          onClick: (event) => handleLinkClick(event, item.target, item.label),
        };
      }),
    // handleLinkClick only relies on props/state setter
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeSection, navDestinations, onNavigate],
  );

  const navSurfaceClass = isOverDarkZone
    ? 'theme-dark border-[var(--glass-dark-border)] bg-[var(--glass-dark-bg)] shadow-[0_14px_40px_-16px_rgba(0,0,0,0.6)] backdrop-blur-xl'
    : isScrolled
      ? 'border-[var(--border-hairline-strong)] bg-[rgba(250,249,246,0.9)] shadow-[0_12px_36px_-16px_rgba(9,9,11,0.16)] backdrop-blur-xl'
      : 'border-[var(--glass-light-border)] bg-[var(--glass-light-bg)] shadow-[0_8px_28px_-16px_rgba(9,9,11,0.1)] backdrop-blur-lg';

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-3 z-40 px-3 sm:top-4 sm:px-6">
        <div className="mx-auto max-w-[var(--container-max)]">
          <nav
            aria-label="Primary"
            className={`pointer-events-auto mx-auto flex max-w-5xl items-center justify-between gap-4 rounded-full border px-4 py-1.5 transition-[background-color,border-color,box-shadow,color] duration-300 ease-[var(--ease-editorial)] sm:gap-6 sm:px-6 sm:py-2 ${navSurfaceClass}`}
          >
            {/* Brand: exact text only, zero logo/monogram/icon */}
            <a
              href="#top"
              data-cursor="link"
              onClick={(event) => handleLinkClick(event, 'top', BRAND_NAME)}
              className={`shrink-0 whitespace-nowrap py-1 text-[13px] font-semibold tracking-[0.04em] transition-colors duration-200 hover:opacity-75 sm:text-sm ${
                isOverDarkZone ? 'text-on-dark' : 'text-ink'
              }`}
            >
              {BRAND_NAME}
            </a>

            {/* Tablet & Desktop Magnetic Dock */}
            <div className="hidden md:flex md:items-center">
              <MagneticDock
                items={dockItems}
                iconSize={isDesktop ? 36 : 32}
                maxScale={isDesktop ? 1.34 : 1.24}
                magneticDistance={isDesktop ? 128 : 104}
                showLabels={true}
                position="top"
                variant="transparent"
                tone={isOverDarkZone ? 'dark' : 'light'}
                className="inline-flex"
              />
            </div>

            {/* Desktop primary CTA + Mobile controls */}
            <div className="flex shrink-0 items-center gap-2">
              <a
                ref={desktopCtaRef}
                href={NAV_CTA.href}
                data-cursor="button"
                onClick={(event) =>
                  handleLinkClick(event, NAV_CTA.target, NAV_CTA.label)
                }
                className={`hidden min-h-[38px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-colors duration-200 md:inline-flex ${
                  isOverDarkZone
                    ? 'bg-on-dark text-ink hover:bg-surface'
                    : 'bg-obsidian text-on-dark hover:bg-obsidian-elevated'
                }`}
              >
                <span>{NAV_CTA.label}</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>

              <button
                ref={toggleButtonRef}
                type="button"
                onClick={() => setIsMobileOpen((prev) => !prev)}
                aria-expanded={isMobileOpen}
                aria-controls="mobile-navigation-drawer"
                aria-label={
                  isMobileOpen ? 'Close navigation menu' : 'Open navigation menu'
                }
                className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors duration-[var(--duration-fast)] md:hidden ${
                  isOverDarkZone
                    ? 'text-on-dark hover:bg-white/10'
                    : 'text-ink hover:bg-surface-subtle'
                }`}
              >
                {isMobileOpen ? (
                  <X className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Menu className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Accessible Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <m.div
            key="mobile-nav-backdrop"
            initial={prefersReducedMotion ? {opacity: 1} : {opacity: 0}}
            animate={{opacity: 1}}
            exit={prefersReducedMotion ? {opacity: 0} : {opacity: 0}}
            transition={{duration: prefersReducedMotion ? 0.01 : 0.2}}
            className="fixed inset-0 z-50 bg-obsidian/35 backdrop-blur-sm md:hidden"
            onClick={() => {
              setIsMobileOpen(false);
              toggleButtonRef.current?.focus();
            }}
          >
            <m.div
              ref={drawerRef}
              id="mobile-navigation-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
              initial={prefersReducedMotion ? {opacity: 1} : {opacity: 0, y: -12}}
              animate={{opacity: 1, y: 0}}
              exit={prefersReducedMotion ? {opacity: 0} : {opacity: 0, y: -12}}
              transition={{
                duration: prefersReducedMotion ? 0.01 : 0.24,
                ease: [0.16, 1, 0.3, 1],
              }}
              onClick={(event) => event.stopPropagation()}
              className="mx-3 mt-3 rounded-[var(--radius-lg)] border border-[var(--border-hairline-strong)] bg-canvas p-5 shadow-[0_24px_60px_-16px_rgba(9,9,11,0.28)]"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-4">
                <span className="text-sm font-semibold tracking-[0.04em] text-ink">
                  {BRAND_NAME}
                </span>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={() => {
                    setIsMobileOpen(false);
                    toggleButtonRef.current?.focus();
                  }}
                  aria-label="Close navigation menu"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-subtle"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <ul className="mt-3 divide-y divide-[var(--border-hairline)]">
                {navDestinations.map((item) => {
                  const isActive = activeSection === item.target;
                  const Icon = SECTION_ICONS[item.target];
                  return (
                    <li key={item.target}>
                      <a
                        href={item.href}
                        onClick={(event) =>
                          handleLinkClick(event, item.target, item.label)
                        }
                        aria-current={isActive ? 'location' : undefined}
                        className={`flex min-h-[48px] items-center justify-between py-3 text-base font-medium transition-opacity hover:opacity-75 ${
                          isActive ? 'text-ink' : 'text-ink-secondary'
                        }`}
                      >
                        <span className="inline-flex items-center gap-3">
                          <span
                            aria-hidden="true"
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${
                              isActive
                                ? 'border-obsidian bg-obsidian text-on-dark'
                                : 'border-[var(--border-hairline)] bg-surface text-ink-muted'
                            }`}
                          >
                            <Icon className="h-4 w-4" strokeWidth={1.75} />
                          </span>
                          <span>{item.label}</span>
                        </span>
                        <ArrowUpRight
                          className={`h-4 w-4 ${isActive ? 'text-ink' : 'text-ink-muted'}`}
                          aria-hidden="true"
                        />
                      </a>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-5 pt-2">
                <a
                  href={NAV_CTA.href}
                  onClick={(event) =>
                    handleLinkClick(event, NAV_CTA.target, NAV_CTA.label)
                  }
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-obsidian px-5 py-3 text-sm font-medium text-on-dark transition-colors hover:bg-obsidian-elevated"
                >
                  <span>{NAV_CTA.label}</span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
