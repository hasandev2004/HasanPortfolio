import {useRef, type MouseEvent} from 'react';
import {m, useScroll, useTransform} from 'motion/react';
import {ArrowRight} from 'lucide-react';
import type {ProjectEntry} from '@/src/data/projects';
import {useMagnetic} from '@/src/hooks/useMagnetic';
import {useReducedMotion} from '@/src/hooks/useReducedMotion';
import {DitheredLogo} from '@/src/components/ui/DitheredLogo';

export interface SmartReachSceneProps {
  project: ProjectEntry;
  allProjects: readonly ProjectEntry[];
  onOpenCaseStudy: (slug: string) => void;
  onJumpToScene: (sceneId: string) => void;
}

const SYSTEM_PIPELINE = [
  {
    step: '01',
    title: 'Business Discovery',
    detail: 'OpenStreetMap, Overpass API & Nominatim geocoding',
    kind: 'Sourcing',
  },
  {
    step: '02',
    title: 'Contact Extraction',
    detail: 'Public contact parsing from official business websites',
    kind: 'Extraction',
  },
  {
    step: '03',
    title: 'Website Auditing',
    detail: 'Technical web presence review paired with diagnostics',
    kind: 'Analysis',
  },
  {
    step: '04',
    title: 'Offline Lead Scoring',
    detail: 'Deterministic ranking based on audited web signals',
    kind: 'Scoring',
  },
  {
    step: '05',
    title: 'AI Draft Generation',
    detail: 'Tailored outreach draft behind mandatory manual review',
    kind: 'Human Gate',
  },
  {
    step: '06',
    title: 'CRM Follow-Up',
    detail: 'Structured activity tracking & user-triggered email dispatch',
    kind: 'Operator Control',
  },
] as const;

/**
 * Scene 2 — SmartReach AI.
 * Presented as an integrated near-full-screen obsidian digital system rather
 * than an ordinary card. Scroll progress drives the system architecture rail,
 * split panel parallax, and clean transition toward Scene 3 (Karv Steakhouse).
 */
export function SmartReachScene({
  project,
  allProjects,
  onOpenCaseStudy,
  onJumpToScene,
}: SmartReachSceneProps) {
  const prefersReducedMotion = useReducedMotion();
  const sceneRef = useRef<HTMLElement | null>(null);
  const ctaRef = useMagnetic<HTMLAnchorElement>({strength: 5});

  const {scrollYProgress} = useScroll({
    target: sceneRef,
    offset: ['start end', 'end start'],
  });

  // Entry -> Active -> Exit choreography:
  // Pipeline signal rail advances smoothly across the 6 system stages as viewer reads through.
  const containerScale = useTransform(
    scrollYProgress,
    [0, 0.22, 0.78, 1],
    [0.96, 1, 1, 0.96],
  );
  const railScaleX = useTransform(scrollYProgress, [0.18, 0.68], [0.08, 1]);
  const headerY = useTransform(scrollYProgress, [0, 0.5, 1], [28, 0, -24]);
  const blueprintY = useTransform(scrollYProgress, [0, 0.5, 1], [36, 0, -28]);
  const emblemDispersion = useTransform(
    scrollYProgress,
    [0.02, 0.34, 0.72, 0.96],
    [0.85, 0, 0, 0.72],
  );
  const emblemScale = useTransform(
    scrollYProgress,
    [0.04, 0.34, 0.74, 0.96],
    [0.88, 1, 1, 0.9],
  );
  const emblemOpacity = useTransform(
    scrollYProgress,
    [0.04, 0.28, 0.76, 0.96],
    [0.18, 1, 1, 0.22],
  );
  const warmThresholdScaleY = useTransform(
    scrollYProgress,
    [0.72, 0.98],
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
      id="scene-smartreach"
      data-nav-surface="dark"
      aria-labelledby="smartreach-scene-title"
      className="theme-dark relative overflow-x-clip bg-obsidian pt-16 pb-24 text-on-dark sm:pt-24 sm:pb-32 lg:min-h-[92vh] lg:pt-28 lg:pb-36"
    >
      {/* Blueprint coordinate grid tying Hero wire lines seamlessly into Scene 2 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.26]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(250, 249, 246, 0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(250, 249, 246, 0.045) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      <m.div
        style={prefersReducedMotion ? undefined : {scale: containerScale}}
        className="relative z-10 mx-auto w-full max-w-[var(--container-max)] px-4 sm:px-8 lg:px-12"
      >
        {/* Top Chapter Strip + Quick Index Jump Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-dark-hairline)] pb-5">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium tracking-[0.12em] text-on-dark-muted uppercase">
            <span className="tabular-nums text-on-dark">01 / 0{allProjects.length}</span>
            <span aria-hidden="true">·</span>
            <span>{project.classification}</span>
            <span aria-hidden="true">·</span>
            <span>{project.status}</span>
          </div>

          <nav aria-label="Jump to project scene" className="flex flex-wrap items-center gap-4 text-xs">
            {allProjects.map((item) => (
              <button
                key={item.id}
                type="button"
                data-cursor="button"
                onClick={() => onJumpToScene(`scene-${item.id.split('-')[0]}`)}
                className={`cursor-pointer transition-colors ${
                  item.id === project.id
                    ? 'font-semibold text-on-dark underline underline-offset-4'
                    : 'text-on-dark-muted hover:text-on-dark'
                }`}
              >
                <span className="tabular-nums mr-1">{item.order}</span>
                <span>{item.title}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Split Editorial & System Header */}
        <m.div
          style={prefersReducedMotion ? undefined : {y: headerY}}
          className="mt-10 grid grid-cols-1 gap-8 lg:mt-14 lg:grid-cols-12 lg:items-end"
        >
          <div className="lg:col-span-7">
            <p className="text-xs font-medium tracking-[0.14em] text-on-dark-muted uppercase">
              Primary Software Architecture
            </p>
            <h2
              id="smartreach-scene-title"
              className="mt-3 text-[clamp(2.35rem,5.4vw,4.6rem)] leading-[1.02] font-semibold tracking-[var(--tracking-display)] text-on-dark"
            >
              <span>{project.title}</span>
              <span className="font-serif block pt-1 text-[0.72em] font-medium italic text-on-dark-muted">
                Structured outreach behind human approval.
              </span>
            </h2>
          </div>

          <div className="lg:col-span-5">
            <p className="max-w-[46ch] text-sm leading-[1.7] text-on-dark-muted sm:text-[15px]">
              {project.solution}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <a
                ref={ctaRef}
                href={`/projects/${project.slug}`}
                data-cursor="button"
                onClick={handleCaseStudyClick}
                className="group inline-flex min-h-[46px] items-center gap-2 rounded-full bg-on-dark px-6 py-2.5 text-xs font-medium text-ink transition-colors hover:bg-surface"
              >
                <span>Explore Full Case Study</span>
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </a>

              <span className="text-xs text-on-dark-muted">
                User-triggered sending only · Public URL unverified
              </span>
            </div>
          </div>
        </m.div>

        {/* Scroll-Driven 6-Stage Connected System Architecture */}
        <m.div
          style={prefersReducedMotion ? undefined : {y: blueprintY}}
          className="mt-12 rounded-[var(--radius-lg)] border border-[var(--border-dark-hairline-strong)] bg-obsidian-elevated/90 p-5 shadow-[0_36px_80px_-32px_rgba(0,0,0,0.9)] sm:p-8 lg:mt-14 lg:p-10"
        >
          {/* System Signal Rail + Stage C Light Particle Architectural Signature */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 text-xs text-on-dark-muted">
            <div className="flex items-center gap-3.5">
              <m.div
                aria-hidden="true"
                style={
                  prefersReducedMotion
                    ? undefined
                    : {scale: emblemScale, opacity: emblemOpacity}
                }
                className="relative h-12 w-12 shrink-0 sm:h-14 sm:w-14"
              >
                <DitheredLogo
                  imageSrc="/brand/architectural-symbol.svg"
                  gridSize={36}
                  scale={0.88}
                  dotScale={0.72}
                  invert={false}
                  threshold={146}
                  gamma={1.02}
                  blur={1.2}
                  diffusionStrength={1}
                  particleColor="#FAF9F6"
                  dispersionProgress={
                    prefersReducedMotion ? undefined : emblemDispersion
                  }
                  dispersionDistance={30}
                  className="h-full w-full"
                />
              </m.div>
              <span className="font-medium tracking-[0.1em] text-on-dark uppercase">
                Connected Workflow Topology
              </span>
            </div>
            <span>01 Sourcing → 04 Scoring → 06 Operator Dispatch</span>
          </div>

          <div
            aria-hidden="true"
            className="relative h-px w-full overflow-hidden bg-white/12"
          >
            <m.div
              style={
                prefersReducedMotion
                  ? undefined
                  : {scaleX: railScaleX, transformOrigin: 'left center'}
              }
              className="h-full w-full bg-on-dark"
            />
          </div>

          {/* 6 Connected Nodes Grid */}
          <ol className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {SYSTEM_PIPELINE.map((node, index) => (
              <li
                key={node.step}
                className={`relative flex flex-col justify-between rounded-[var(--radius-md)] border p-5 transition-colors duration-200 ${
                  index === 4 || index === 5
                    ? 'border-white/26 bg-white/[0.05]'
                    : 'border-white/12 bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="tabular-nums font-medium text-on-dark">
                    {node.step}
                  </span>
                  <span className="text-on-dark-muted">{node.kind}</span>
                </div>

                <div className="mt-5">
                  <h3 className="text-base font-semibold tracking-[var(--tracking-heading)] text-on-dark">
                    {node.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-[1.6] text-on-dark-muted">
                    {node.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          {/* Bottom Honesty & Technical Scope Strip */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border-dark-hairline)] pt-5 text-xs text-on-dark-muted">
            <p>{project.stack.join(' · ')}</p>
            <p className="font-medium text-on-dark">
              Manual email approval enforced prior to user mail-client handoff
            </p>
          </div>
        </m.div>
      </m.div>

      {/* Exit Transition Horizon: Warm ivory editorial rise introducing Karv Steakhouse */}
      <m.div
        aria-hidden="true"
        style={
          prefersReducedMotion
            ? undefined
            : {scaleY: warmThresholdScaleY, transformOrigin: 'bottom center'}
        }
        className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-[#F5F1E8] sm:h-16"
      />
    </article>
  );
}
