import {useEffect, useRef, useState, type ReactNode} from 'react';
import {m, useScroll, useSpring, useTransform} from 'motion/react';
import {useReducedMotion} from '@/src/hooks/useReducedMotion';

export const EDITORIAL_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * Reliable reveal trigger: marks visible if intersecting OR already scrolled past
 * above the viewport, preventing headings from ever getting trapped invisible on
 * anchor jumps or fast scroll.
 */
export function useRevealVisible(
  ref: {current: HTMLElement | null},
  immediate = false,
): boolean {
  const prefersReducedMotion = useReducedMotion();
  const [visible, setVisible] = useState<boolean>(
    immediate || prefersReducedMotion,
  );

  useEffect(() => {
    if (immediate || prefersReducedMotion) {
      setVisible(true);
      return;
    }

    const el = ref.current;
    if (!el || typeof window === 'undefined') {
      setVisible(true);
      return;
    }

    const checkPosition = () => {
      const rect = el.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.96) {
        setVisible(true);
        return true;
      }
      return false;
    };

    if (checkPosition()) {
      return;
    }

    const observer =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              const entry = entries[0];
              if (
                entry &&
                (entry.isIntersecting ||
                  entry.boundingClientRect.top <= window.innerHeight)
              ) {
                setVisible(true);
                observer?.disconnect();
              }
            },
            {threshold: 0.01, rootMargin: '60px 0px -20px 0px'},
          )
        : null;

    observer?.observe(el);

    const handleScroll = () => {
      if (checkPosition()) {
        window.removeEventListener('scroll', handleScroll);
        observer?.disconnect();
      }
    };
    window.addEventListener('scroll', handleScroll, {passive: true});

    return () => {
      observer?.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [ref, immediate, prefersReducedMotion]);

  return visible;
}

export interface ScrollProgressBarProps {
  isDarkZone?: boolean;
}

/**
 * Top hairline scroll progress bar driven via scaleX (compositor-only).
 * Hidden under prefers-reduced-motion to eliminate continuous scroll visuals.
 */
export function ScrollProgressBar({isDarkZone = false}: ScrollProgressBarProps) {
  const prefersReducedMotion = useReducedMotion();
  const {scrollYProgress} = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 240,
    damping: 32,
    restDelta: 0.001,
  });

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px]"
    >
      <m.div
        style={{scaleX}}
        className={`h-full w-full origin-left transition-colors duration-300 ${
          isDarkZone ? 'bg-on-dark/80' : 'bg-obsidian/85'
        }`}
      />
    </div>
  );
}

export interface MaskedRevealProps {
  children: ReactNode;
  delay?: number;
  inView?: boolean;
  className?: string;
}

/**
 * Typographic mask reveal: lifts content cleanly out of an overflow-hidden mask
 * using a scroll-past-safe IntersectionObserver so text never stays hidden.
 */
export function MaskedReveal({
  children,
  delay = 0,
  inView = true,
  className = '',
}: MaskedRevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const revealed = useRevealVisible(containerRef, !inView);

  if (prefersReducedMotion) {
    return <span className={`block ${className}`}>{children}</span>;
  }

  return (
    <span
      ref={containerRef}
      className={`block overflow-hidden pb-1.5 -mb-1.5 ${className}`}
    >
      <m.span
        className="block"
        initial={{y: '105%', opacity: 0.001}}
        animate={revealed ? {y: '0%', opacity: 1} : {y: '105%', opacity: 0.001}}
        transition={{duration: 0.52, delay, ease: EDITORIAL_EASE}}
      >
        {children}
      </m.span>
    </span>
  );
}

export interface HairlineRuleProps {
  dark?: boolean;
  delay?: number;
  immediate?: boolean;
  className?: string;
}

/**
 * Architectural horizontal rule expanding along X-axis via transform scaleX.
 */
export function HairlineRule({
  dark = false,
  delay = 0,
  immediate = false,
  className = '',
}: HairlineRuleProps) {
  const prefersReducedMotion = useReducedMotion();
  const ruleRef = useRef<HTMLDivElement | null>(null);
  const revealed = useRevealVisible(ruleRef, immediate);

  return (
    <m.div
      ref={ruleRef}
      aria-hidden="true"
      initial={prefersReducedMotion || immediate ? false : {scaleX: 0}}
      animate={{scaleX: revealed ? 1 : 0}}
      transition={{
        duration: prefersReducedMotion || immediate ? 0 : 0.6,
        delay: prefersReducedMotion || immediate ? 0 : delay,
        ease: EDITORIAL_EASE,
      }}
      className={`h-px w-full origin-left ${
        dark
          ? 'bg-[var(--border-dark-hairline)]'
          : 'bg-[var(--border-hairline)]'
      } ${className}`}
    />
  );
}

export interface RevealBlockProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  x?: number;
  className?: string;
}

/**
 * Scroll-past-safe block reveal powered by useRevealVisible so content never
 * remains hidden after fast programmatic scrolls or anchor jumps.
 */
export function RevealBlock({
  children,
  delay = 0,
  y = 14,
  x = 0,
  className = '',
}: RevealBlockProps) {
  const prefersReducedMotion = useReducedMotion();
  const blockRef = useRef<HTMLDivElement | null>(null);
  const revealed = useRevealVisible(blockRef, false);

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <m.div
      ref={blockRef}
      initial={{opacity: 0.001, y, x}}
      animate={revealed ? {opacity: 1, y: 0, x: 0} : {opacity: 0.001, y, x}}
      transition={{duration: 0.56, delay, ease: EDITORIAL_EASE}}
      className={className}
    >
      {children}
    </m.div>
  );
}

export interface ScrollSceneBandProps {
  children: ReactNode;
  className?: string;
  scaleRange?: [number, number];
}

/**
 * Subtle scroll-linked spatial depth container: gently scales and settles a
 * scene band as it enters the viewport while preserving natural native scroll.
 */
export function ScrollSceneBand({
  children,
  className = '',
  scaleRange = [0.975, 1],
}: ScrollSceneBandProps) {
  const prefersReducedMotion = useReducedMotion();
  const targetRef = useRef<HTMLDivElement | null>(null);
  const {scrollYProgress} = useScroll({
    target: targetRef,
    offset: ['start end', 'start 0.25'],
  });
  const scale = useTransform(scrollYProgress, [0, 1], scaleRange);

  return (
    <div ref={targetRef} className={className}>
      <m.div style={prefersReducedMotion ? undefined : {scale}}>
        {children}
      </m.div>
    </div>
  );
}
