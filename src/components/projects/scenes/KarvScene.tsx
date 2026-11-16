import {useRef, useState, type MouseEvent} from 'react';
import {m, useScroll, useTransform} from 'motion/react';
import {ArrowRight, ArrowUpRight} from 'lucide-react';
import type {ProjectEntry} from '@/src/data/projects';
import {useMagnetic} from '@/src/hooks/useMagnetic';
import {useReducedMotion} from '@/src/hooks/useReducedMotion';

export interface KarvSceneProps {
  project: ProjectEntry;
  totalProjects: number;
  onOpenCaseStudy: (slug: string) => void;
}

/**
 * Scene 3 — Karv Steakhouse.
 * Restaurant-editorial art direction on warm parchment (#F5F1E8) with antique
 * brass hairlines, generous margins, and scroll-linked architectural image reveal.
 */
export function KarvScene({
  project,
  totalProjects,
  onOpenCaseStudy,
}: KarvSceneProps) {
  const prefersReducedMotion = useReducedMotion();
  const sceneRef = useRef<HTMLElement | null>(null);
  const ctaRef = useMagnetic<HTMLAnchorElement>({strength: 5});
  const [imageError, setImageError] = useState(false);

  const {scrollYProgress} = useScroll({
    target: sceneRef,
    offset: ['start end', 'end start'],
  });

  // Entry -> Active -> Exit choreography:
  // Image frame unclips smoothly on entry while the inner photograph settles
  // from 1.07 -> 1.0; editorial prose column glides in opposite parallax;
  // bottom pitch-black shutter prepares Scene 4 (Kingz Barberz).
  const frameClip = useTransform(
    scrollYProgress,
    [0.06, 0.34],
    ['inset(6% 3% 6% 3% round 18px)', 'inset(0% 0% 0% 0% round 18px)'],
  );
  const imgScale = useTransform(scrollYProgress, [0.05, 0.55], [1.07, 1]);
  const proseY = useTransform(scrollYProgress, [0, 0.5, 1], [32, 0, -22]);
  const darkShutterScaleY = useTransform(scrollYProgress, [0.74, 0.98], [0, 1]);

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
      id="scene-karv"
      data-nav-surface="light"
      aria-labelledby="karv-scene-title"
      className="relative overflow-x-clip bg-[#F5F1E8] pt-20 pb-24 text-ink sm:pt-28 sm:pb-32 lg:pt-32 lg:pb-36"
    >
      <div className="mx-auto w-full max-w-[var(--container-max)] px-4 sm:px-8 lg:px-12">
        {/* Editorial Restaurant Dateline */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#9E7B4F]/30 pb-5 text-xs font-medium text-[#5A4F41]">
          <span className="tracking-[0.12em] uppercase">
            <span className="tabular-nums text-ink">
              {project.order} / 0{totalProjects}
            </span>{' '}
            · {project.classification}
          </span>
          <span className="font-serif text-sm italic text-[#5A4F41]">
            Lower Clapton · London N16
          </span>
        </div>

        {/* Asymmetric 12-Col Restaurant-Editorial Spread */}
        <div className="mt-10 grid grid-cols-1 items-center gap-10 lg:mt-14 lg:grid-cols-12 lg:gap-14">
          {/* Left: Verified Website Frame with Scroll-Linked Clip & Zoom */}
          <div className="lg:col-span-7">
            <m.div
              data-cursor="project"
              data-cursor-label="Inspect"
              onClick={() => onOpenCaseStudy(project.slug)}
              style={prefersReducedMotion ? undefined : {clipPath: frameClip}}
              className="group cursor-pointer overflow-hidden rounded-[var(--radius-lg)] border border-[#9E7B4F]/30 bg-[#EAE3D4] p-2.5 shadow-[0_28px_64px_-30px_rgba(62,48,30,0.28)] sm:p-3.5"
            >
              <div className="aspect-[16/10] w-full overflow-hidden rounded-[calc(var(--radius-lg)-0.35rem)] bg-[#E2DAC9]">
                {project.screenshotPath && !imageError ? (
                  <m.img
                    src={project.screenshotPath}
                    alt={`${project.title} live website capture`}
                    loading="lazy"
                    onError={() => setImageError(true)}
                    style={prefersReducedMotion ? undefined : {scale: imgScale}}
                    className="h-full w-full object-cover object-top"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-8 text-center">
                    <span className="font-serif text-3xl italic text-ink">
                      {project.title}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 px-2 pt-3 pb-1 text-[11px] text-[#5A4F41]">
                <span>KARV Steakhouse London · Live Editorial Capture</span>
                <span className="font-medium text-ink">{project.status}</span>
              </div>
            </m.div>
          </div>

          {/* Right: Warm Serif Culinary Typography & Verified Capabilities */}
          <m.div
            style={prefersReducedMotion ? undefined : {y: proseY}}
            className="lg:col-span-5"
          >
            <p className="text-xs font-medium tracking-[0.14em] text-[#7A6345] uppercase">
              Hospitality &amp; Culinary Web
            </p>

            <h2
              id="karv-scene-title"
              className="font-serif mt-3 text-[clamp(2.5rem,5vw,4.35rem)] leading-[0.98] font-medium tracking-[-0.02em] text-ink"
            >
              Karv
              <span className="block italic">Steakhouse.</span>
            </h2>

            <p className="mt-5 text-sm leading-[1.72] text-ink-secondary sm:text-[15px]">
              {project.shortDescription}
            </p>

            <dl className="mt-7 divide-y divide-[#9E7B4F]/25 border-y border-[#9E7B4F]/25 text-xs">
              <div className="flex items-baseline justify-between gap-4 py-3">
                <dt className="text-[#5A4F41]">Menu Architecture</dt>
                <dd className="text-right font-medium text-ink">
                  Searchable 24-Item Collection
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-3">
                <dt className="text-[#5A4F41]">Interactive Specimen</dt>
                <dd className="text-right font-medium text-ink">
                  3D-Tilt Ribeye &amp; Gallery Lightbox
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-3">
                <dt className="text-[#5A4F41]">Reservations</dt>
                <dd className="text-right font-medium text-ink">
                  Booking Request &amp; OpenTable Link
                </dd>
              </div>
            </dl>

            <div className="mt-7 flex flex-wrap items-center gap-3.5">
              <a
                ref={ctaRef}
                href={`/projects/${project.slug}`}
                data-cursor="button"
                onClick={handleCaseStudyClick}
                className="group inline-flex min-h-[46px] items-center gap-2 rounded-full bg-obsidian px-6 py-2.5 text-xs font-medium text-on-dark transition-colors hover:bg-obsidian-elevated"
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
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-[#9E7B4F]/50 px-5 py-2 text-xs font-medium text-ink transition-colors hover:border-ink hover:bg-[#EAE3D4]"
                >
                  <span>Visit Live Site</span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
            </div>
          </m.div>
        </div>
      </div>

      {/* Exit Transition Shutter: Stark pitch-black rise introducing Scene 4 (Kingz Barberz) */}
      <m.div
        aria-hidden="true"
        style={
          prefersReducedMotion
            ? undefined
            : {scaleY: darkShutterScaleY, transformOrigin: 'bottom center'}
        }
        className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-[#050507] sm:h-16"
      />
    </article>
  );
}
