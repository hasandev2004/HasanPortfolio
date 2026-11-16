import {useEffect, useRef, type MouseEvent} from 'react';
import {m, useTransform, type MotionValue} from 'motion/react';
import {ArrowUpRight} from 'lucide-react';
import {useReducedMotion} from '@/src/hooks/useReducedMotion';
import {EDITORIAL_EASE} from '@/src/components/motion/ScrollPrimitives';

export interface HeroDigitalArchitectureProps {
  label: string;
  scrollYProgress: MotionValue<number>;
  onInspectPrimary?: (slug: string) => void;
}

const ARCHITECTURE_LAYERS = [
  {index: '01', layer: 'Interface', tech: 'HTML · CSS · JS'},
  {index: '02', layer: 'Application', tech: 'PHP · Laravel · jQuery'},
  {index: '03', layer: 'Data & VCS', tech: 'SQL · MySQL · Git'},
] as const;

const SMARTREACH_NODES = [
  {step: '01', label: 'OSM Discovery', detail: 'Overpass & Nominatim'},
  {step: '02', label: 'Site Extraction', detail: 'Official Public URLs'},
  {step: '03', label: 'Audit & Scoring', detail: 'Offline Evaluation'},
  {step: '04', label: 'AI Draft Gate', detail: 'Manual Review'},
] as const;

/**
 * Integrated "Digital Architecture" spatial composition rendered directly on
 * the Hero drafting canvas. Synchronizes scroll-linked expansion/reorganization
 * with Hero typography so the SmartReach obsidian plate leads naturally into
 * Scene 2 while the architectural wire grid expands across the frame.
 */
export function HeroDigitalArchitecture({
  label,
  scrollYProgress,
  onInspectPrimary,
}: HeroDigitalArchitectureProps) {
  const prefersReducedMotion = useReducedMotion();

  const stageRef = useRef<HTMLDivElement | null>(null);
  const wireLayerRef = useRef<HTMLDivElement | null>(null);
  const obsidianPlateRef = useRef<HTMLDivElement | null>(null);
  const paperPlateRef = useRef<HTMLDivElement | null>(null);

  // Coordinated Scene 1 -> Scene 2 scroll choreography:
  // Wireframe expands outward as drafting guides; SmartReach specimen rises &
  // scales slightly to introduce Scene 2; secondary stack plate recedes cleanly.
  const wireScale = useTransform(scrollYProgress, [0, 1], [1, 1.16]);
  const wireOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.25]);
  const obsidianPlateY = useTransform(scrollYProgress, [0, 1], [0, -64]);
  const obsidianPlateScale = useTransform(scrollYProgress, [0, 0.85], [1, 1.04]);
  const paperPlateY = useTransform(scrollYProgress, [0, 1], [0, 36]);
  const paperPlateOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0.25]);

  useEffect(() => {
    const stage = stageRef.current;
    const wireLayer = wireLayerRef.current;
    const obsidianPlate = obsidianPlateRef.current;
    const paperPlate = paperPlateRef.current;

    if (!stage || !wireLayer || !obsidianPlate || !paperPlate) {
      return;
    }

    if (
      prefersReducedMotion ||
      typeof window === 'undefined' ||
      !window.matchMedia('(pointer: fine) and (hover: hover)').matches
    ) {
      wireLayer.style.transform = '';
      obsidianPlate.style.transform = '';
      paperPlate.style.transform = '';
      return;
    }

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId = 0;

    const animate = () => {
      currentX += (targetX - currentX) * 0.1;
      currentY += (targetY - currentY) * 0.1;

      wireLayer.style.transform = `translate3d(${(currentX * -6).toFixed(2)}px, ${(currentY * -6).toFixed(2)}px, 0)`;
      obsidianPlate.style.transform = `perspective(1200px) rotateX(${(-currentY * 1.8).toFixed(2)}deg) rotateY(${(currentX * 2.1).toFixed(2)}deg) translate3d(${(currentX * 10).toFixed(2)}px, ${(currentY * 10).toFixed(2)}px, 0)`;
      paperPlate.style.transform = `perspective(1200px) rotateX(${(-currentY * 1.3).toFixed(2)}deg) rotateY(${(currentX * 1.5).toFixed(2)}deg) translate3d(${(currentX * -5).toFixed(2)}px, ${(currentY * 5).toFixed(2)}px, 0)`;

      const settled =
        Math.abs(targetX - currentX) < 0.002 &&
        Math.abs(targetY - currentY) < 0.002;

      if (settled && targetX === 0 && targetY === 0) {
        wireLayer.style.transform = '';
        obsidianPlate.style.transform = '';
        paperPlate.style.transform = '';
        rafId = 0;
        return;
      }

      if (settled) {
        rafId = 0;
        return;
      }

      rafId = window.requestAnimationFrame(animate);
    };

    const ensureLoop = () => {
      if (rafId === 0) {
        rafId = window.requestAnimationFrame(animate);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== 'mouse') {
        return;
      }
      const rect = stage.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return;
      }
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      targetX = Math.max(-1, Math.min(1, nx));
      targetY = Math.max(-1, Math.min(1, ny));
      ensureLoop();
    };

    const handlePointerLeave = () => {
      targetX = 0;
      targetY = 0;
      ensureLoop();
    };

    stage.addEventListener('pointermove', handlePointerMove, {passive: true});
    stage.addEventListener('pointerleave', handlePointerLeave, {passive: true});

    return () => {
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
      }
      stage.removeEventListener('pointermove', handlePointerMove);
      stage.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [prefersReducedMotion]);

  const handleInspectClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      !onInspectPrimary ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }
    event.preventDefault();
    onInspectPrimary('smartreach-ai');
  };

  return (
    <div
      ref={stageRef}
      role="region"
      aria-label={label}
      className="relative w-full select-none lg:min-h-[420px]"
    >
      {/* Background Architectural Wireframe & Node Topology (Desktop / Tablet) */}
      <m.div
        ref={wireLayerRef}
        aria-hidden="true"
        style={
          prefersReducedMotion
            ? undefined
            : {scale: wireScale, opacity: wireOpacity}
        }
        className="pointer-events-none absolute -inset-x-4 -inset-y-6 hidden origin-center sm:block"
      >
        <svg
          viewBox="0 0 640 430"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Architectural drafting frame ticks */}
          <g stroke="#09090B" strokeOpacity="0.22" strokeWidth="1">
            <path d="M24 34H38M31 27V41" />
            <path d="M602 34H616M609 27V41" />
            <path d="M24 396H38M31 389V403" />
            <path d="M602 396H616M609 389V403" />
          </g>

          {/* Primary axis bridging left headline column to digital systems */}
          <m.path
            d="M 8 156 H 124 L 166 114 H 286"
            stroke="#09090B"
            strokeOpacity="0.3"
            strokeWidth="1.15"
            initial={prefersReducedMotion ? false : {pathLength: 0, opacity: 0}}
            animate={{pathLength: 1, opacity: 1}}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.85,
              delay: prefersReducedMotion ? 0 : 0.14,
              ease: EDITORIAL_EASE,
            }}
          />

          {/* Connector from Stack Architecture Plate to SmartReach Specimen */}
          <m.path
            d="M 192 316 H 268 C 292 316 306 302 306 278 V 230"
            stroke="#09090B"
            strokeOpacity="0.34"
            strokeWidth="1.1"
            strokeDasharray="4 4"
            initial={prefersReducedMotion ? false : {pathLength: 0, opacity: 0}}
            animate={{pathLength: 1, opacity: 1}}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.9,
              delay: prefersReducedMotion ? 0 : 0.28,
              ease: EDITORIAL_EASE,
            }}
          />

          {/* Vertical architectural datum rule extending toward Scene 2 */}
          <m.path
            d="M 556 196 V 426"
            stroke="#09090B"
            strokeOpacity="0.18"
            strokeWidth="1"
            initial={prefersReducedMotion ? false : {pathLength: 0, opacity: 0}}
            animate={{pathLength: 1, opacity: 1}}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.8,
              delay: prefersReducedMotion ? 0 : 0.22,
              ease: EDITORIAL_EASE,
            }}
          />

          {/* Connected calibration nodes */}
          <m.g
            initial={prefersReducedMotion ? false : {opacity: 0, scale: 0.75}}
            animate={{opacity: 1, scale: 1}}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.45,
              delay: prefersReducedMotion ? 0 : 0.42,
              ease: EDITORIAL_EASE,
            }}
          >
            <circle cx="124" cy="156" r="3.5" fill="#FAF9F6" stroke="#09090B" strokeWidth="1.4" />
            <circle cx="286" cy="114" r="3.5" fill="#09090B" />
            <circle cx="306" cy="230" r="3.5" fill="#FAF9F6" stroke="#09090B" strokeWidth="1.4" />
            <circle cx="408" cy="154" r="3" fill="#09090B" fillOpacity="0.55" />
          </m.g>
        </svg>
      </m.div>

      {/* Spatial Fragments */}
      <div className="relative z-10 flex flex-col gap-4 sm:min-h-[395px] sm:justify-between lg:min-h-[415px]">
        {/* Fragment 01: Obsidian Primary Software Specimen (Bridges to Scene 2) */}
        <m.div
          style={
            prefersReducedMotion
              ? undefined
              : {y: obsidianPlateY, scale: obsidianPlateScale}
          }
          initial={
            prefersReducedMotion
              ? false
              : {opacity: 0, y: 18, clipPath: 'inset(10% 0% 0% 0% round 14px)'}
          }
          animate={{opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0% round 14px)'}}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.7,
            delay: prefersReducedMotion ? 0 : 0.2,
            ease: EDITORIAL_EASE,
          }}
          className="sm:ml-auto sm:w-[78%] lg:w-[74%]"
        >
          <div
            ref={obsidianPlateRef}
            data-cursor="project"
            data-cursor-label="Inspect"
            className="theme-dark relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-hairline-strong)] bg-obsidian p-5 text-on-dark shadow-[0_32px_72px_-28px_rgba(9,9,11,0.45)] sm:p-6"
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/12 pb-3">
              <div>
                <p className="text-[10px] font-medium tracking-[0.14em] text-on-dark-muted uppercase">
                  01 · Primary System
                </p>
                <p className="mt-1 text-base font-semibold tracking-[var(--tracking-heading)] text-on-dark">
                  SmartReach AI
                </p>
              </div>
              <span className="tabular-nums text-[11px] font-medium text-on-dark-muted">
                In Development
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SMARTREACH_NODES.map((node, index) => (
                <div
                  key={node.step}
                  className={`rounded-[var(--radius-sm)] border px-3 py-2.5 ${
                    index === 3
                      ? 'border-white/28 bg-white/[0.07]'
                      : 'border-white/10 bg-white/[0.025]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="tabular-nums text-[10px] font-medium text-on-dark-muted">
                      {node.step}
                    </span>
                    <span className="text-[10px] text-on-dark-muted">
                      {node.detail}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-on-dark">
                    {node.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/12 pt-3 text-xs">
              <span className="text-on-dark-muted">
                Human-Approved Outreach System
              </span>
              <a
                href="/projects/smartreach-ai"
                data-cursor="button"
                onClick={handleInspectClick}
                className="inline-flex items-center gap-1 font-medium text-on-dark transition-opacity hover:opacity-75"
              >
                <span>Case Study</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </m.div>

        {/* Fragment 02: Warm Paper System Layer Matrix */}
        <m.div
          style={
            prefersReducedMotion
              ? undefined
              : {y: paperPlateY, opacity: paperPlateOpacity}
          }
          initial={
            prefersReducedMotion
              ? false
              : {opacity: 0, x: -16, clipPath: 'inset(0% 100% 0% 0% round 14px)'}
          }
          animate={{opacity: 1, x: 0, clipPath: 'inset(0% 0% 0% 0% round 14px)'}}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.65,
            delay: prefersReducedMotion ? 0 : 0.32,
            ease: EDITORIAL_EASE,
          }}
          className="sm:mt-4 sm:w-[66%] lg:mt-4 lg:w-[60%]"
        >
          <div
            ref={paperPlateRef}
            className="rounded-[var(--radius-lg)] border border-[var(--border-hairline-strong)] bg-surface/95 p-4 text-ink shadow-[0_22px_52px_-28px_rgba(9,9,11,0.18)] backdrop-blur-sm sm:p-5"
          >
            <div className="flex items-center justify-between gap-2 border-b border-[var(--border-hairline)] pb-2.5">
              <span className="text-[10px] font-medium tracking-[0.14em] text-ink-muted uppercase">
                02 · Core Engineering Stack
              </span>
              <span className="text-[10px] font-medium text-ink-muted">
                Tasknix
              </span>
            </div>

            <dl className="mt-3 divide-y divide-[var(--border-hairline)]">
              {ARCHITECTURE_LAYERS.map((row) => (
                <div
                  key={row.index}
                  className="flex items-center justify-between gap-3 py-2 text-xs first:pt-0 last:pb-0"
                >
                  <dt className="flex items-center gap-2 font-medium text-ink">
                    <span className="tabular-nums text-[10px] text-ink-muted">
                      {row.index}
                    </span>
                    <span>{row.layer}</span>
                  </dt>
                  <dd className="text-right text-[11px] text-ink-secondary">
                    {row.tech}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </m.div>
      </div>
    </div>
  );
}
