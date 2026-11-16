import {useRef, useState, type MouseEvent} from 'react';
import {m, useScroll, useTransform} from 'motion/react';
import {ArrowRight, ArrowUpRight} from 'lucide-react';
import type {ProjectEntry} from '@/src/data/projects';
import {useMagnetic} from '@/src/hooks/useMagnetic';
import {useReducedMotion} from '@/src/hooks/useReducedMotion';

export interface ZyroxSceneProps {
  project: ProjectEntry;
  totalProjects: number;
  onOpenCaseStudy: (slug: string) => void;
}

const LOOKBOOK_MODULES = [
  {
    code: '01',
    title: 'Obsidian & Brass Palette',
    note: 'Editorial serif italic hierarchy set over fine geometric wirelines',
  },
  {
    code: '02',
    title: 'Interactive Merchandising',
    note: 'Featured drop grid, quick-add cart state & live item counter',
  },
  {
    code: '03',
    title: 'Search & Outfit Customizer',
    note: 'Expandable product search bar, mobile drawer & customizer concept',
  },
] as const;

/**
 * Scene 5 — Zyrox Wear.
 * Dark fashion-editorial lookbook composition (#0B0A08) with warm brass rules,
 * expressive serif typography, deliberate framing, transparent self-initiated
 * practice classification, and warm-paper rise into Scene 6 (About).
 */
export function ZyroxScene({
  project,
  totalProjects,
  onOpenCaseStudy,
}: ZyroxSceneProps) {
  const prefersReducedMotion = useReducedMotion();
  const sceneRef = useRef<HTMLElement | null>(null);
  const ctaRef = useMagnetic<HTMLAnchorElement>({strength: 5});
  const [imageError, setImageError] = useState(false);

  const {scrollYProgress} = useScroll({
    target: sceneRef,
    offset: ['start end', 'end start'],
  });

  // Fashion-editorial parallax & lookbook zoom + warm paper exit threshold
  const lookbookY = useTransform(scrollYProgress, [0, 0.5, 1], [32, 0, -24]);
  const imgScale = useTransform(scrollYProgress, [0.1, 0.6], [1.06, 1]);
  const copyY = useTransform(scrollYProgress, [0, 0.5, 1], [-18, 0, 16]);
  const aboutThresholdScaleY = useTransform(
    scrollYProgress,
    [0.74, 0.98],
    [0, 1],
  );

  const handleCaseStudyClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }
    event.preventDefault();
    onOpenCaseStudy(project.slug);
  };

  return (
    <article
      ref={sceneRef}
      id="scene-zyrox"
      data-nav-surface="dark"
      aria-labelledby="zyrox-scene-title"
      className="theme-dark relative overflow-x-clip bg-[#0B0A08] pt-16 pb-24 text-on-dark sm:pt-20 sm:pb-32 lg:pt-24 lg:pb-36"
    >
      <div className="mx-auto w-full max-w-[var(--container-max)] px-4 sm:px-8 lg:px-12">
        {/* Lookbook Header Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D4AF37]/25 pb-5 text-xs font-medium text-[#D6C7A3]">
          <span className="tracking-[0.14em] uppercase">
            <span className="tabular-nums text-on-dark">
              {project.order} / 0{totalProjects}
            </span>{' '}
            · {project.classification}
          </span>
          <span className="font-serif text-sm italic">
            Apparel Storefront Practice Concept
          </span>
        </div>

        {/* Fashion-Editorial Two-Plane Spread */}
        <div className="mt-10 grid grid-cols-1 items-center gap-10 lg:mt-14 lg:grid-cols-12 lg:gap-14">
          {/* Left: Tall Fashion Editorial Lockup & Storefront Rhythm */}
          <m.div
            style={prefersReducedMotion ? undefined : {y: copyY}}
            className="lg:col-span-5"
          >
            <p className="text-[11px] font-medium tracking-[0.16em] text-[#D4AF37] uppercase">
              Self-Initiated Practice Project
            </p>

            <h2
              id="zyrox-scene-title"
              className="font-serif mt-3 text-[clamp(2.65rem,5.4vw,4.6rem)] leading-[0.96] font-medium tracking-[-0.02em] text-on-dark"
            >
              Zyrox Wear
              <span className="block italic text-[#D4AF37]">
                Wear The Void.
              </span>
            </h2>

            <p className="mt-5 text-sm leading-[1.72] text-on-dark-muted sm:text-[15px]">
              {project.shortDescription}
            </p>

            <div className="mt-7 divide-y divide-[#D4AF37]/20 border-y border-[#D4AF37]/20">
              {LOOKBOOK_MODULES.map((mod) => (
                <div key={mod.code} className="flex items-start gap-4 py-3.5">
                  <span className="tabular-nums pt-0.5 text-[11px] font-medium text-[#D4AF37]">
                    {mod.code}
                  </span>
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-on-dark">
                      {mod.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-[1.55] text-on-dark-muted">
                      {mod.note}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3.5">
              <a
                ref={ctaRef}
                href={`/projects/${project.slug}`}
                data-cursor="button"
                onClick={handleCaseStudyClick}
                className="group inline-flex min-h-[46px] items-center gap-2 rounded-full bg-[#D4AF37] px-6 py-2.5 text-xs font-semibold text-ink transition-opacity hover:opacity-90"
              >
                <span>Read Case Study</span>
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </a>

              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="link"
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-[#D4AF37]/45 px-5 py-2 text-xs font-medium text-on-dark transition-colors hover:border-[#D4AF37] hover:bg-[#D4AF37]/10"
                >
                  <span>Visit Live Site</span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
            </div>
          </m.div>

          {/* Right: Editorial Lookbook Frame */}
          <m.div
            style={prefersReducedMotion ? undefined : {y: lookbookY}}
            className="lg:col-span-7"
          >
            <div
              data-cursor="project"
              data-cursor-label="Inspect"
              onClick={() => onOpenCaseStudy(project.slug)}
              className="cursor-pointer overflow-hidden rounded-[var(--radius-lg)] border border-[#D4AF37]/30 bg-[#14120E] p-2.5 shadow-[0_32px_80px_-28px_rgba(0,0,0,0.95)] sm:p-3.5"
            >
              <div className="aspect-[16/10] w-full overflow-hidden rounded-[calc(var(--radius-lg)-0.35rem)] bg-[#070604]">
                {project.screenshotPath && !imageError ? (
                  <m.img
                    src={project.screenshotPath}
                    alt={`${project.title} live website capture`}
                    loading="lazy"
                    onError={() => setImageError(true)}
                    style={prefersReducedMotion ? undefined : {scale: imgScale}}
                    className="h-full w-full object-cover object-left-top"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-8 text-center">
                    <span className="font-serif text-3xl italic text-[#D4AF37]">
                      {project.title}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 px-2 pt-3 pb-1 text-[11px] text-[#D6C7A3]">
                <span>Concept Storefront UI · Placeholder Catalog Copy</span>
                <span className="font-medium text-on-dark">{project.status}</span>
              </div>
            </div>
          </m.div>
        </div>
      </div>

      {/* Exit Transition Horizon: Warm paper (#F2F0EC) rising cleanly into Scene 6 (About) */}
      <m.div
        aria-hidden="true"
        style={
          prefersReducedMotion
            ? undefined
            : {scaleY: aboutThresholdScaleY, transformOrigin: 'bottom center'}
        }
        className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-surface sm:h-16"
      />
    </article>
  );
}
