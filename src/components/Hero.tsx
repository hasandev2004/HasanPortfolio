import {useRef, type MouseEvent} from 'react';
import {m, useScroll, useTransform} from 'motion/react';
import {ArrowDownRight, ArrowRight, ArrowUpRight} from 'lucide-react';
import {HERO_COPY, type SectionId} from '@/src/data/hero';
import {PROJECTS} from '@/src/data/projects';
import {useMagnetic} from '@/src/hooks/useMagnetic';
import {useReducedMotion} from '@/src/hooks/useReducedMotion';
import {HeroDigitalArchitecture} from '@/src/components/hero/HeroDigitalArchitecture';
import {DitheredLogo} from '@/src/components/ui/DitheredLogo';
import {
  EDITORIAL_EASE,
  HairlineRule,
  MaskedReveal,
} from '@/src/components/motion/ScrollPrimitives';

export interface HeroProps {
  onNavigate: (target: SectionId, label: string) => void;
  onOpenCaseStudy?: (slug: string) => void;
}

export function Hero({onNavigate, onOpenCaseStudy}: HeroProps) {
  const prefersReducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const primaryCtaRef = useMagnetic<HTMLAnchorElement>({strength: 6});
  const secondaryCtaRef = useMagnetic<HTMLAnchorElement>({strength: 5});

  const {scrollYProgress} = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  // Coordinated Scene 1 scroll exit choreography:
  // Headline subtly scales down & lifts; lead copy fades calmly;
  // bottom obsidian horizon band expands upward to receive Scene 2.
  const headlineScale = useTransform(scrollYProgress, [0, 0.9], [1, 0.94]);
  const headlineY = useTransform(scrollYProgress, [0, 1], [0, -28]);
  const headlineOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.2]);
  const emblemScale = useTransform(scrollYProgress, [0, 0.85], [1, 0.84]);
  const emblemY = useTransform(scrollYProgress, [0, 1], [0, 44]);
  const emblemOpacity = useTransform(scrollYProgress, [0.06, 0.84], [1, 0.08]);
  const emblemDispersion = useTransform(scrollYProgress, [0.08, 0.82], [0, 1]);
  const leftColumnY = useTransform(scrollYProgress, [0, 1], [0, 28]);
  const leftColumnOpacity = useTransform(scrollYProgress, [0, 0.72], [1, 0.15]);
  const thresholdScaleY = useTransform(scrollYProgress, [0.15, 0.95], [0.15, 1]);

  const handleActionClick = (
    event: MouseEvent<HTMLAnchorElement>,
    target: SectionId,
    label: string,
  ) => {
    event.preventDefault();
    onNavigate(target, label);
  };

  return (
    <section
      ref={sectionRef}
      id="top"
      data-nav-surface="light"
      aria-labelledby="hero-heading"
      className="relative overflow-x-clip bg-canvas pt-24 pb-20 sm:pt-28 sm:pb-24 lg:pt-32 lg:pb-28"
    >
      {/* Subtle architectural drafting coordinate grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(9, 9, 11, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(9, 9, 11, 0.04) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          maskImage:
            'radial-gradient(ellipse 88% 76% at 50% 40%, black 35%, transparent 100%)',
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[var(--container-max)] px-4 sm:px-8 lg:px-12">
        {/* Top Architectural Index Strip */}
        <m.div
          initial={prefersReducedMotion ? false : {opacity: 0, y: 8}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: prefersReducedMotion ? 0 : 0.5, ease: EDITORIAL_EASE}}
          className="flex flex-wrap items-center justify-between gap-2 pb-4 text-[11px] font-medium tracking-[0.14em] text-ink-muted uppercase sm:text-xs"
        >
          <span>{HERO_COPY.eyebrow}</span>
          <span className="tabular-nums hidden sm:inline">
            Co-Founder at Tasknix · {PROJECTS.length} Selected Works
          </span>
        </m.div>

        <HairlineRule immediate />

        {/* Unified Editorial Headline + Stage A Dithered Particle Identity */}
        <div className="grid grid-cols-1 items-center gap-6 pt-7 sm:pt-9 lg:grid-cols-12 lg:gap-8 lg:pt-10">
          <m.div
            style={
              prefersReducedMotion
                ? undefined
                : {
                    scale: headlineScale,
                    y: headlineY,
                    opacity: headlineOpacity,
                    transformOrigin: 'left top',
                  }
            }
            className="lg:col-span-8"
          >
            <h1
              id="hero-heading"
              className="max-w-[18ch] text-[clamp(2.35rem,6.4vw,5.15rem)] leading-[1.01] font-semibold tracking-[var(--tracking-display)] text-ink"
            >
              <MaskedReveal delay={0.05} inView={false}>
                <span className="block">I turn complex ideas</span>
              </MaskedReveal>
              <MaskedReveal delay={0.14} inView={false}>
                <span className="font-serif block pt-1 font-medium italic tracking-[-0.02em] text-ink">
                  into digital experiences.
                </span>
              </MaskedReveal>
            </h1>
          </m.div>

          {/* Stage A / B — Dithered Particle Architectural Emblem */}
          <m.div
            aria-hidden="true"
            style={
              prefersReducedMotion
                ? undefined
                : {
                    scale: emblemScale,
                    y: emblemY,
                    opacity: emblemOpacity,
                  }
            }
            className="flex items-center justify-start lg:col-span-4 lg:justify-end"
          >
            <div className="relative h-28 w-28 sm:h-36 sm:w-36 lg:h-52 lg:w-52">
              <DitheredLogo
                imageSrc="/brand/architectural-symbol.svg"
                gridSize={76}
                scale={0.86}
                dotScale={0.72}
                invert={false}
                threshold={146}
                contrast={10}
                gamma={1.02}
                blur={1.8}
                diffusionStrength={1}
                serpentine
                particleColor="#09090B"
                dispersionProgress={prefersReducedMotion ? undefined : emblemDispersion}
                dispersionDistance={46}
                className="h-full w-full"
              />
            </div>
          </m.div>
        </div>

        {/* Interwoven Bottom Axis: Lead + CTAs Left | Integrated Spatial Composition Right */}
        <div className="mt-8 grid grid-cols-1 items-end gap-10 sm:mt-10 lg:mt-12 lg:grid-cols-12 lg:gap-12">
          <m.div
            style={
              prefersReducedMotion
                ? undefined
                : {y: leftColumnY, opacity: leftColumnOpacity}
            }
            className="flex flex-col justify-between lg:col-span-5 lg:pb-3"
          >
            <m.p
              initial={prefersReducedMotion ? false : {opacity: 0, y: 12}}
              animate={{opacity: 1, y: 0}}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.6,
                delay: prefersReducedMotion ? 0 : 0.22,
                ease: EDITORIAL_EASE,
              }}
              className="max-w-[44ch] text-[15px] leading-[1.68] text-ink-secondary sm:text-base lg:text-[17px]"
            >
              {HERO_COPY.supportingText}
            </m.p>

            <m.div
              initial={prefersReducedMotion ? false : {opacity: 0, y: 10}}
              animate={{opacity: 1, y: 0}}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.55,
                delay: prefersReducedMotion ? 0 : 0.3,
                ease: EDITORIAL_EASE,
              }}
              className="mt-8 flex flex-wrap items-center gap-3.5"
            >
              <a
                ref={primaryCtaRef}
                href={HERO_COPY.primaryCta.href}
                data-cursor="button"
                onClick={(event) =>
                  handleActionClick(
                    event,
                    HERO_COPY.primaryCta.target,
                    HERO_COPY.primaryCta.label,
                  )
                }
                className="group inline-flex min-h-[46px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-obsidian px-6 py-3 text-sm font-medium text-on-dark transition-[background-color] duration-[var(--duration-fast)] ease-[var(--ease-editorial)] hover:bg-obsidian-elevated"
              >
                <span>{HERO_COPY.primaryCta.label}</span>
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-[var(--duration-fast)] ease-[var(--ease-editorial)] group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </a>

              <a
                ref={secondaryCtaRef}
                href={HERO_COPY.secondaryCta.href}
                data-cursor="button"
                onClick={(event) =>
                  handleActionClick(
                    event,
                    HERO_COPY.secondaryCta.target,
                    HERO_COPY.secondaryCta.label,
                  )
                }
                className="group inline-flex min-h-[46px] shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-[var(--border-hairline-strong)] bg-canvas px-6 py-3 text-sm font-medium text-ink transition-[background-color,border-color] duration-[var(--duration-fast)] ease-[var(--ease-editorial)] hover:border-ink hover:bg-surface"
              >
                <span>{HERO_COPY.secondaryCta.label}</span>
                <ArrowUpRight
                  className="h-4 w-4 text-ink-muted transition-transform duration-[var(--duration-fast)] ease-[var(--ease-editorial)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink"
                  aria-hidden="true"
                />
              </a>
            </m.div>

            {/* Unboxed Architectural Project Roster Preview */}
            <m.div
              initial={prefersReducedMotion ? false : {opacity: 0}}
              animate={{opacity: 1}}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.6,
                delay: prefersReducedMotion ? 0 : 0.38,
                ease: EDITORIAL_EASE,
              }}
              className="mt-10 border-t border-[var(--border-hairline)] pt-5 lg:mt-14"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-medium tracking-[0.12em] text-ink-muted uppercase">
                  Selected Index
                </p>
                <a
                  href="#projects"
                  data-cursor="link"
                  onClick={(event) =>
                    handleActionClick(event, 'projects', 'Selected Works')
                  }
                  className="inline-flex items-center gap-1 text-xs font-medium text-ink transition-opacity hover:opacity-70"
                >
                  <span>Scroll to Work</span>
                  <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
              <p className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-ink-secondary">
                {PROJECTS.map((project, index) => (
                  <span key={project.id} className="inline-flex items-center gap-2.5">
                    <span>{project.title}</span>
                    {index < PROJECTS.length - 1 && (
                      <span aria-hidden="true" className="text-ink-muted">
                        ·
                      </span>
                    )}
                  </span>
                ))}
              </p>
            </m.div>
          </m.div>

          <div className="lg:col-span-7">
            <HeroDigitalArchitecture
              label={HERO_COPY.visualStageLabel}
              scrollYProgress={scrollYProgress}
              onInspectPrimary={onOpenCaseStudy}
            />
          </div>
        </div>
      </div>

      {/* Scroll-Driven Architectural Horizon Threshold bridging Scene 1 -> Scene 2 */}
      <m.div
        aria-hidden="true"
        style={
          prefersReducedMotion
            ? undefined
            : {scaleY: thresholdScaleY, transformOrigin: 'bottom center'}
        }
        className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-obsidian sm:h-16"
      />
    </section>
  );
}
