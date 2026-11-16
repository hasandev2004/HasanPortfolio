import {useRef, useState, type MouseEvent} from 'react';
import {m, useScroll, useTransform} from 'motion/react';
import {ArrowRight, ArrowUpRight} from 'lucide-react';
import type {ProjectEntry} from '@/src/data/projects';
import {useMagnetic} from '@/src/hooks/useMagnetic';
import {useReducedMotion} from '@/src/hooks/useReducedMotion';

export interface KingzSceneProps {
  project: ProjectEntry;
  totalProjects: number;
  onOpenCaseStudy: (slug: string) => void;
}

/**
 * Scene 4 — Kingz Barberz.
 * Stark monochrome obsidian grooming aesthetic (#050507) with crisp silver
 * rules, opposing scroll shear between display type and imagery, and clear
 * disclosure of client confirmation boundaries.
 */
export function KingzScene({
  project,
  totalProjects,
  onOpenCaseStudy,
}: KingzSceneProps) {
  const prefersReducedMotion = useReducedMotion();
  const sceneRef = useRef<HTMLElement | null>(null);
  const ctaRef = useMagnetic<HTMLAnchorElement>({strength: 5});
  const [imageError, setImageError] = useState(false);

  const {scrollYProgress} = useScroll({
    target: sceneRef,
    offset: ['start end', 'end start'],
  });

  // Opposing horizontal + vertical scroll shear across stark monochrome framing
  const titleX = useTransform(scrollYProgress, [0, 0.5, 1], [-18, 0, 14]);
  const mediaScale = useTransform(scrollYProgress, [0.08, 0.5, 0.92], [0.95, 1, 0.97]);
  const mediaY = useTransform(scrollYProgress, [0, 0.5, 1], [34, 0, -24]);
  const brassLineScaleX = useTransform(scrollYProgress, [0.72, 0.96], [0.1, 1]);

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
      id="scene-kingz"
      data-nav-surface="dark"
      aria-labelledby="kingz-scene-title"
      className="theme-dark relative overflow-x-clip bg-[#050507] pt-20 pb-24 text-on-dark sm:pt-28 sm:pb-32 lg:pt-32 lg:pb-36"
    >
      <div className="mx-auto w-full max-w-[var(--container-max)] px-4 sm:px-8 lg:px-12">
        {/* Monochrome Index Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-5 text-xs font-medium text-on-dark-muted">
          <span className="tracking-[0.14em] uppercase">
            <span className="tabular-nums text-on-dark">
              {project.order} / 0{totalProjects}
            </span>{' '}
            · {project.classification}
          </span>
          <span>Surrey Quays · London SE16 7LL</span>
        </div>

        {/* Bold Monochrome Typographic Statement */}
        <m.div
          style={prefersReducedMotion ? undefined : {x: titleX}}
          className="mt-10 grid grid-cols-1 gap-6 lg:mt-14 lg:grid-cols-12 lg:items-end"
        >
          <div className="lg:col-span-8">
            <p className="text-[11px] font-medium tracking-[0.16em] text-on-dark-muted uppercase">
              Monochrome Grooming Direction
            </p>
            <h2
              id="kingz-scene-title"
              className="mt-3 text-[clamp(2.55rem,6.6vw,5.4rem)] leading-[0.94] font-bold tracking-[-0.03em] text-on-dark uppercase"
            >
              KINGZ BARBERZ
              <span className="font-serif block pt-2 text-[0.52em] font-medium tracking-normal normal-case italic text-on-dark-muted">
                The art of precision grooming.
              </span>
            </h2>
          </div>

          <div className="lg:col-span-4 lg:pb-1">
            <p className="text-sm leading-[1.68] text-on-dark-muted">
              {project.shortDescription}
            </p>
          </div>
        </m.div>

        {/* Inverted Split: Precision Grooming Spec Column Left + Live Site Stage Right */}
        <div className="mt-10 grid grid-cols-1 items-center gap-10 lg:mt-14 lg:grid-cols-12 lg:gap-12">
          <div className="order-2 space-y-6 lg:order-1 lg:col-span-5">
            <div className="divide-y divide-white/14 border-y border-white/14">
              <div className="py-4">
                <p className="text-[11px] font-medium tracking-[0.12em] text-on-dark-muted uppercase">
                  01 · Service Directory
                </p>
                <p className="mt-1.5 text-sm leading-[1.6] text-on-dark">
                  Ten structured grooming treatments spanning classic cuts,
                  skin fades, taper fades, beard styling, and hot towel shaves.
                </p>
              </div>
              <div className="py-4">
                <p className="text-[11px] font-medium tracking-[0.12em] text-on-dark-muted uppercase">
                  02 · Request Workflow
                </p>
                <p className="mt-1.5 text-sm leading-[1.6] text-on-dark">
                  Appointment form compiles service, barber preference, date,
                  and contact into a WhatsApp request or direct telephone call.
                </p>
              </div>
              <div className="py-4">
                <p className="text-[11px] font-medium tracking-[0.12em] text-on-dark-muted uppercase">
                  03 · Scope Honesty
                </p>
                <p className="mt-1.5 text-xs leading-[1.6] text-on-dark-muted">
                  Live database slot availability, prices, barber portraits, and
                  hours await final business confirmation.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <a
                ref={ctaRef}
                href={`/projects/${project.slug}`}
                data-cursor="button"
                onClick={handleCaseStudyClick}
                className="group inline-flex min-h-[46px] items-center gap-2 rounded-full bg-on-dark px-6 py-2.5 text-xs font-medium text-ink transition-colors hover:bg-surface"
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
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/28 px-5 py-2 text-xs font-medium text-on-dark transition-colors hover:border-on-dark hover:bg-white/10"
                >
                  <span>Visit Live Site</span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>

          <m.div
            style={
              prefersReducedMotion
                ? undefined
                : {scale: mediaScale, y: mediaY}
            }
            className="order-1 lg:order-2 lg:col-span-7"
          >
            <div
              data-cursor="project"
              data-cursor-label="Inspect"
              onClick={() => onOpenCaseStudy(project.slug)}
              className="cursor-pointer overflow-hidden rounded-[var(--radius-lg)] border border-white/18 bg-[#0D0D10] p-2.5 shadow-[0_32px_80px_-30px_rgba(0,0,0,0.95)] sm:p-3.5"
            >
              <div className="aspect-[16/10] w-full overflow-hidden rounded-[calc(var(--radius-lg)-0.35rem)] bg-black">
                {project.screenshotPath && !imageError ? (
                  <img
                    src={project.screenshotPath}
                    alt={`${project.title} live website capture`}
                    loading="lazy"
                    onError={() => setImageError(true)}
                    className="h-full w-full object-cover object-top"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-8 text-center">
                    <span className="text-2xl font-bold uppercase tracking-wider text-on-dark">
                      {project.title}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 px-2 pt-3 pb-1 text-[11px] text-on-dark-muted">
                <span>Monochrome Chrome &amp; Editorial Grooming Identity</span>
                <span className="font-medium text-on-dark">{project.status}</span>
              </div>
            </div>
          </m.div>
        </div>
      </div>

      {/* Exit Transition Rule: Warm brass line ushering in Scene 5 (Zyrox Wear) */}
      <div
        aria-hidden="true"
        className="mx-auto mt-16 max-w-[var(--container-max)] px-4 sm:px-8 lg:mt-20 lg:px-12"
      >
        <m.div
          style={
            prefersReducedMotion
              ? undefined
              : {scaleX: brassLineScaleX, transformOrigin: 'left center'}
          }
          className="h-px w-full bg-[#D4AF37]/45"
        />
      </div>
    </article>
  );
}
