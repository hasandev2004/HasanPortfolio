import {useRef} from 'react';
import {m, useScroll, useTransform} from 'motion/react';
import {DitheredLogo} from '@/src/components/ui/DitheredLogo';
import {useReducedMotion} from '@/src/hooks/useReducedMotion';

export interface DitherTransitionBandProps {
  /** Surface background class wrapping the transition strip. */
  surfaceClassName: string;
  /** CSS color string for the stippled dither grains. */
  particleColor: string;
  /** Data attribute for navbar contrast tracking. */
  navSurface?: 'light' | 'dark';
}

/**
 * Flush full-width scroll-linked halftone stipple seam used selectively
 * between project chapters without creating floating decorative gaps.
 */
export function DitherTransitionBand({
  surfaceClassName,
  particleColor,
  navSurface,
}: DitherTransitionBandProps) {
  const prefersReducedMotion = useReducedMotion();
  const bandRef = useRef<HTMLDivElement | null>(null);

  const {scrollYProgress} = useScroll({
    target: bandRef,
    offset: ['start end', 'end start'],
  });

  const dispersion = useTransform(scrollYProgress, [0.1, 0.5, 0.9], [0.65, 0, 0.65]);
  const bandOpacity = useTransform(scrollYProgress, [0.05, 0.5, 0.95], [0.22, 0.68, 0.22]);

  return (
    <div
      ref={bandRef}
      aria-hidden="true"
      data-nav-surface={navSurface}
      className={`pointer-events-none relative overflow-hidden ${surfaceClassName}`}
    >
      <m.div
        style={prefersReducedMotion ? undefined : {opacity: bandOpacity}}
        className="mx-auto h-6 w-full max-w-[var(--container-max)] px-4 sm:px-8 lg:px-12"
      >
        <DitheredLogo
          imageSrc="/brand/dither-horizon.svg"
          gridSize={148}
          scale={1}
          dotScale={0.68}
          invert={false}
          threshold={136}
          gamma={1.02}
          blur={1.4}
          diffusionStrength={1}
          fitWidth
          particleColor={particleColor}
          interactive={false}
          dispersionProgress={prefersReducedMotion ? undefined : dispersion}
          dispersionDistance={12}
          className="h-full w-full"
        />
      </m.div>
    </div>
  );
}
