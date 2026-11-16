import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react';
import {
  AnimatePresence,
  m,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react';
import {useReducedMotion} from '@/src/hooks/useReducedMotion';

export interface DockItemData {
  /** Unique identifier */
  id: string;
  /** Accessible & tooltip display label */
  label: string;
  /** Rendered icon element */
  icon: ReactNode;
  /** Optional hash/route href for semantic link rendering */
  href?: string;
  /** Optional click handler */
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  /** Active destination indicator */
  isActive?: boolean;
  /** Accessible current indicator value */
  ariaCurrent?: 'location' | 'page';
}

export interface MagneticDockProps {
  /** Array of dock items */
  items: readonly DockItemData[];
  /** Base square icon slot size in pixels (default: 36) */
  iconSize?: number;
  /** Maximum scale on pointer proximity (default: 1.34) */
  maxScale?: number;
  /** Magnetic falloff radius in pixels (default: 128) */
  magneticDistance?: number;
  /** Show tooltip labels on hover and keyboard focus (default: true) */
  showLabels?: boolean;
  /** Edge alignment of the dock inside the viewport (default: 'bottom') */
  position?: 'bottom' | 'top' | 'left' | 'right';
  /** Surface chrome style (default: 'glass') */
  variant?: 'glass' | 'solid' | 'transparent';
  /** Surface tone synced with underlying page band (default: 'light') */
  tone?: 'light' | 'dark';
  /** Additional container classes */
  className?: string;
}

const SPRING_CONFIG = {
  damping: 22,
  stiffness: 320,
  mass: 0.45,
};

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

function useSupportsFineHover(): boolean {
  const [supportsFineHover, setSupportsFineHover] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return true;
    }
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    setSupportsFineHover(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setSupportsFineHover(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return supportsFineHover;
}

interface DockItemProps {
  item: DockItemData;
  pointerAxis: MotionValue<number>;
  iconSize: number;
  maxScale: number;
  magneticDistance: number;
  showLabels: boolean;
  position: 'bottom' | 'top' | 'left' | 'right';
  tone: 'light' | 'dark';
  enableMagnetic: boolean;
  supportsFineHover: boolean;
  prefersReducedMotion: boolean;
}

function DockItem({
  item,
  pointerAxis,
  iconSize,
  maxScale,
  magneticDistance,
  showLabels,
  position,
  tone,
  enableMagnetic,
  supportsFineHover,
  prefersReducedMotion,
}: DockItemProps) {
  const slotRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isVertical = position === 'left' || position === 'right';
  const showTooltip = showLabels && (isHovered || isFocused);

  // Measure proximity along primary axis without triggering React state updates
  const rawScale = useTransform(pointerAxis, (pointerCoord: number) => {
    if (!enableMagnetic || !Number.isFinite(pointerCoord) || !slotRef.current) {
      return 1;
    }
    const rect = slotRef.current.getBoundingClientRect();
    const center = isVertical
      ? rect.top + rect.height / 2
      : rect.left + rect.width / 2;
    const dist = Math.abs(pointerCoord - center);
    if (dist >= magneticDistance) {
      return 1;
    }
    // Smooth cosine curve peaking directly under pointer
    const normalized = dist / magneticDistance;
    const falloff = 0.5 * (1 + Math.cos(Math.PI * normalized));
    return 1 + (maxScale - 1) * falloff;
  });

  // Subtle magnetic parting on neighboring icons so scaled tiles never collide
  const rawSpread = useTransform(pointerAxis, (pointerCoord: number) => {
    if (!enableMagnetic || !Number.isFinite(pointerCoord) || !slotRef.current) {
      return 0;
    }
    const rect = slotRef.current.getBoundingClientRect();
    const center = isVertical
      ? rect.top + rect.height / 2
      : rect.left + rect.width / 2;
    const delta = center - pointerCoord;
    const absDelta = Math.abs(delta);
    if (absDelta >= magneticDistance || absDelta < 1) {
      return 0;
    }
    const norm = absDelta / magneticDistance;
    const wave = Math.sin(norm * Math.PI) * (1 - norm * 0.35);
    const maxSpread = iconSize * (maxScale - 1) * 0.42;
    return Math.sign(delta) * wave * maxSpread;
  });

  const smoothScale = useSpring(rawScale, SPRING_CONFIG);
  const smoothSpread = useSpring(rawSpread, SPRING_CONFIG);

  // Direction-aware micro-float keeping dock bounds calm without viewport clipping
  const rawPerpFloat = useTransform(smoothScale, (scaleValue: number) => {
    if (!enableMagnetic) {
      return 0;
    }
    const delta = scaleValue - 1;
    if (position === 'top') {
      return delta * 5;
    }
    if (position === 'bottom') {
      return delta * -8;
    }
    if (position === 'left') {
      return delta * 6;
    }
    return delta * -6;
  });

  const isDarkTone = tone === 'dark';
  const isActive = Boolean(item.isActive);

  const visualTileClass = cn(
    'relative flex h-full w-full items-center justify-center rounded-full border transition-colors duration-200',
    isDarkTone
      ? isActive
        ? 'border-on-dark bg-on-dark text-ink shadow-[0_6px_18px_-8px_rgba(0,0,0,0.6)]'
        : 'border-[var(--border-dark-hairline)] bg-white/[0.06] text-on-dark-muted hover:border-[var(--border-dark-hairline-strong)] hover:bg-white/[0.12] hover:text-on-dark'
      : isActive
        ? 'border-obsidian bg-obsidian text-on-dark shadow-[0_6px_18px_-8px_rgba(9,9,11,0.38)]'
        : 'border-[var(--border-hairline)] bg-canvas/85 text-ink-muted hover:border-[var(--border-hairline-strong)] hover:bg-surface hover:text-ink',
  );

  const tooltipClass = cn(
    'pointer-events-none absolute z-50 whitespace-nowrap rounded-lg border px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] shadow-[0_10px_24px_-8px_rgba(9,9,11,0.28)]',
    position === 'top' && 'top-full left-1/2 mt-2.5 -translate-x-1/2',
    position === 'bottom' && 'bottom-full left-1/2 mb-2.5 -translate-x-1/2',
    position === 'left' && 'top-1/2 left-full ml-2.5 -translate-y-1/2',
    position === 'right' && 'top-1/2 right-full mr-2.5 -translate-y-1/2',
    isDarkTone
      ? 'border-[var(--border-hairline-strong)] bg-canvas text-ink'
      : 'border-white/15 bg-obsidian text-on-dark',
  );

  const tooltipArrowClass = cn(
    'absolute h-2 w-2 rotate-45',
    position === 'top' && '-top-1 left-1/2 -translate-x-1/2 border-t border-l',
    position === 'bottom' &&
      '-bottom-1 left-1/2 -translate-x-1/2 border-r border-b',
    position === 'left' && '-left-1 top-1/2 -translate-y-1/2 border-b border-l',
    position === 'right' &&
      '-right-1 top-1/2 -translate-y-1/2 border-t border-r',
    isDarkTone
      ? 'border-[var(--border-hairline-strong)] bg-canvas'
      : 'border-white/15 bg-obsidian',
  );

  const indicatorClass = cn(
    'pointer-events-none absolute rounded-full transition-colors duration-200',
    isVertical
      ? '-left-1.5 top-1/2 h-3 w-[2px] -translate-y-1/2'
      : '-bottom-1.5 left-1/2 h-[2px] w-3 -translate-x-1/2',
    isDarkTone ? 'bg-on-dark' : 'bg-obsidian',
  );

  const sharedInteractiveProps = {
    'aria-label': item.label,
    'aria-current': isActive ? (item.ariaCurrent ?? 'location') : undefined,
    'data-cursor': 'link' as const,
    onClick: (event: MouseEvent<HTMLElement>) => {
      item.onClick?.(event);
    },
    onMouseEnter: () => {
      if (supportsFineHover) {
        setIsHovered(true);
      }
    },
    onMouseLeave: () => setIsHovered(false),
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key === 'Escape') {
        setIsHovered(false);
        setIsFocused(false);
      }
    },
    className:
      'group relative flex h-full w-full items-center justify-center rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-3',
  };

  const visualContent = (
    <>
      <m.div
        style={
          enableMagnetic
            ? {
                scale: smoothScale,
                x: isVertical ? rawPerpFloat : smoothSpread,
                y: isVertical ? smoothSpread : rawPerpFloat,
              }
            : undefined
        }
        whileTap={
          prefersReducedMotion ? undefined : {scale: 0.92}
        }
        className={visualTileClass}
      >
        <span
          aria-hidden="true"
          className="flex h-[46%] w-[46%] items-center justify-center"
        >
          {item.icon}
        </span>
      </m.div>

      {/* Active Navigation Indicator */}
      <AnimatePresence initial={false}>
        {isActive && (
          <m.span
            aria-hidden="true"
            initial={prefersReducedMotion ? false : {opacity: 0, scaleX: 0.3}}
            animate={{opacity: 1, scaleX: 1}}
            exit={
              prefersReducedMotion ? {opacity: 0} : {opacity: 0, scaleX: 0.3}
            }
            transition={{duration: prefersReducedMotion ? 0.01 : 0.18}}
            className={indicatorClass}
          />
        )}
      </AnimatePresence>

      {/* Editorial Tooltip on Hover & Keyboard Focus */}
      <AnimatePresence initial={false}>
        {showTooltip && (
          <m.div
            role="tooltip"
            aria-hidden="true"
            initial={
              prefersReducedMotion
                ? false
                : {
                    opacity: 0,
                    y: position === 'top' ? -4 : position === 'bottom' ? 4 : 0,
                    scale: 0.94,
                  }
            }
            animate={{opacity: 1, y: 0, scale: 1}}
            exit={
              prefersReducedMotion
                ? {opacity: 0}
                : {
                    opacity: 0,
                    y: position === 'top' ? -4 : position === 'bottom' ? 4 : 0,
                    scale: 0.94,
                  }
            }
            transition={{
              duration: prefersReducedMotion ? 0.01 : 0.15,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={tooltipClass}
          >
            <span>{item.label}</span>
            <span aria-hidden="true" className={tooltipArrowClass} />
          </m.div>
        )}
      </AnimatePresence>
    </>
  );

  return (
    <div
      ref={slotRef}
      style={{width: iconSize, height: iconSize}}
      className="relative shrink-0"
    >
      {item.href ? (
        <a href={item.href} {...sharedInteractiveProps}>
          {visualContent}
        </a>
      ) : (
        <button type="button" {...sharedInteractiveProps}>
          {visualContent}
        </button>
      )}
    </div>
  );
}

export function MagneticDock({
  items,
  iconSize = 36,
  maxScale = 1.34,
  magneticDistance = 128,
  showLabels = true,
  position = 'bottom',
  variant = 'glass',
  tone = 'light',
  className,
}: MagneticDockProps) {
  const pointerAxis = useMotionValue(Infinity);
  const prefersReducedMotion = useReducedMotion();
  const supportsFineHover = useSupportsFineHover();
  const isVertical = position === 'left' || position === 'right';
  const enableMagnetic = !prefersReducedMotion && supportsFineHover;

  const handleMouseMove = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (!enableMagnetic) {
        return;
      }
      pointerAxis.set(isVertical ? event.clientY : event.clientX);
    },
    [enableMagnetic, isVertical, pointerAxis],
  );

  const handleMouseLeave = useCallback(() => {
    pointerAxis.set(Infinity);
  }, [pointerAxis]);

  const variantClasses: Record<
    NonNullable<MagneticDockProps['variant']>,
    string
  > = {
    glass: cn(
      'rounded-full border px-2 py-1.5 backdrop-blur-xl',
      tone === 'dark'
        ? 'border-[var(--glass-dark-border)] bg-[var(--glass-dark-bg)] shadow-[0_14px_40px_-16px_rgba(0,0,0,0.6)]'
        : 'border-[var(--glass-light-border)] bg-[var(--glass-light-bg)] shadow-[0_10px_30px_-16px_rgba(9,9,11,0.16)]',
    ),
    solid: cn(
      'rounded-full border px-2 py-1.5',
      tone === 'dark'
        ? 'border-[var(--border-dark-hairline)] bg-obsidian-elevated'
        : 'border-[var(--border-hairline-strong)] bg-surface',
    ),
    transparent: 'border-0 bg-transparent p-0',
  };

  const hasBaseDisplayClass = (className ?? '')
    .split(/\s+/)
    .some((token) =>
      ['hidden', 'block', 'flex', 'inline-flex', 'grid', 'inline-grid'].includes(
        token,
      ),
    );

  return (
    <div
      role="list"
      onMouseMove={enableMagnetic ? handleMouseMove : undefined}
      onMouseLeave={handleMouseLeave}
      className={cn(
        !hasBaseDisplayClass && 'inline-flex',
        'items-center',
        isVertical ? 'flex-col gap-2.5' : 'flex-row gap-2.5',
        variantClasses[variant],
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.id} role="listitem" className="shrink-0">
          <DockItem
            item={item}
            pointerAxis={pointerAxis}
            iconSize={iconSize}
            maxScale={maxScale}
            magneticDistance={magneticDistance}
            showLabels={showLabels}
            position={position}
            tone={tone}
            enableMagnetic={enableMagnetic}
            supportsFineHover={supportsFineHover}
            prefersReducedMotion={prefersReducedMotion}
          />
        </div>
      ))}
    </div>
  );
}
