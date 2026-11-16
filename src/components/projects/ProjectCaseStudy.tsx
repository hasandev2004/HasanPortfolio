import type {MouseEvent} from 'react';
import {m} from 'motion/react';
import {ArrowLeft, ArrowRight, ArrowUpRight} from 'lucide-react';
import {PROJECTS, type ProjectEntry} from '@/src/data/projects';
import {useCardTilt} from '@/src/hooks/useCardTilt';
import {useMagnetic} from '@/src/hooks/useMagnetic';
import {useReducedMotion} from '@/src/hooks/useReducedMotion';
import {ProjectPreviewVisual} from '@/src/components/projects/ProjectPreviewVisual';
import {
  EDITORIAL_EASE,
  HairlineRule,
  MaskedReveal,
} from '@/src/components/motion/ScrollPrimitives';

export interface ProjectCaseStudyProps {
  project?: ProjectEntry;
  requestedSlug: string;
  onBackToProjects: () => void;
  onOpenCaseStudy: (slug: string) => void;
}

export function ProjectCaseStudy({
  project,
  requestedSlug,
  onBackToProjects,
  onOpenCaseStudy,
}: ProjectCaseStudyProps) {
  const prefersReducedMotion = useReducedMotion();
  const stageTiltRef = useCardTilt<HTMLDivElement>({maxTiltDeg: 2.5});
  const backTopRef = useMagnetic<HTMLAnchorElement>({strength: 4});
  const nextProjectRef = useMagnetic<HTMLAnchorElement>({strength: 4});

  const handleBackClick = (event: MouseEvent<HTMLAnchorElement>) => {
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
    onBackToProjects();
  };

  const handleSwitchProject = (
    event: MouseEvent<HTMLAnchorElement>,
    slug: string,
  ) => {
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
    onOpenCaseStudy(slug);
  };

  if (!project) {
    return (
      <section
        aria-labelledby="case-study-not-found"
        className="bg-canvas pt-28 pb-20 sm:pt-36 sm:pb-28"
      >
        <div className="mx-auto max-w-[var(--container-max)] px-4 sm:px-8 lg:px-12">
          <div className="max-w-2xl rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-surface p-8 sm:p-10">
            <p className="text-xs font-medium tracking-[0.12em] text-ink-muted">
              Case Study Unavailable
            </p>
            <h1
              id="case-study-not-found"
              className="mt-3 text-2xl font-semibold tracking-[var(--tracking-heading)] text-ink sm:text-3xl"
            >
              Project entry not found.
            </h1>
            <p className="mt-3 text-sm leading-[1.65] text-ink-secondary sm:text-base">
              No case study matches the route{' '}
              <span className="font-medium text-ink">
                /projects/{requestedSlug}
              </span>
              . Return to the selected works index to inspect available entries.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3.5">
              <a
                href="/#projects"
                data-cursor="button"
                onClick={handleBackClick}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-obsidian px-5 py-2.5 text-sm font-medium text-on-dark transition-colors hover:bg-obsidian-elevated"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span>Back to Projects</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const currentIndex = PROJECTS.findIndex((item) => item.slug === project.slug);
  const nextProject =
    PROJECTS[(currentIndex + 1) % PROJECTS.length] ?? PROJECTS[0];

  return (
    <article
      aria-labelledby="case-study-title"
      className="bg-canvas pt-26 pb-20 sm:pt-32 sm:pb-24"
    >
      <div className="mx-auto w-full max-w-[var(--container-max)] px-4 sm:px-8 lg:px-12">
        {/* Top Action Row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <a
            ref={backTopRef}
            href="/#projects"
            data-cursor="button"
            onClick={handleBackClick}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--border-hairline-strong)] bg-canvas px-4 py-2 text-xs font-medium text-ink transition-[background-color,border-color] duration-[var(--duration-fast)] hover:border-ink hover:bg-surface"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Back to Projects</span>
          </a>

          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="button"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-obsidian px-5 py-2 text-xs font-medium text-on-dark transition-colors hover:bg-obsidian-elevated"
            >
              <span>Visit Live Website</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          )}
        </div>

        {/* Editorial Monograph Header */}
        <header className="mt-8 sm:mt-10">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-ink-muted">
            <span className="tabular-nums text-ink">{project.order}</span>
            <span aria-hidden="true">·</span>
            <span>{project.classification}</span>
            <span aria-hidden="true">·</span>
            <span>{project.status}</span>
          </div>

          <h1
            id="case-study-title"
            className="mt-4 max-w-[20ch] text-[clamp(2.15rem,5vw,4.25rem)] leading-[1.04] font-semibold tracking-[var(--tracking-display)] text-ink"
          >
            <MaskedReveal delay={0.04} inView={false}>
              <span>{project.title}</span>
            </MaskedReveal>
          </h1>

          <p className="font-serif mt-2 text-xl font-medium italic text-ink-muted sm:text-2xl">
            {project.category}
          </p>

          <m.p
            initial={prefersReducedMotion ? false : {opacity: 0, y: 10}}
            animate={{opacity: 1, y: 0}}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.5,
              delay: prefersReducedMotion ? 0 : 0.12,
              ease: EDITORIAL_EASE,
            }}
            className="mt-5 max-w-[64ch] text-base leading-[1.68] text-ink-secondary sm:text-lg"
          >
            {project.shortDescription}
          </m.p>

          {/* Metadata Ledger */}
          <HairlineRule immediate className="mt-8" />
          <dl className="grid grid-cols-1 gap-6 py-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            <div>
              <dt className="text-xs font-medium text-ink-muted">Role</dt>
              <dd className="mt-1.5 text-sm font-medium text-ink">
                {project.role}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-ink-muted">
                Classification
              </dt>
              <dd className="mt-1.5 text-sm font-medium text-ink">
                {project.classification}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-ink-muted">Status</dt>
              <dd className="mt-1.5 text-sm font-medium text-ink">
                {project.status}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-ink-muted">
                Verified Links
              </dt>
              <dd className="mt-1.5 flex flex-wrap items-center gap-3 text-sm">
                {project.liveUrl ? (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cursor="link"
                    className="inline-flex items-center gap-1 font-medium text-ink underline underline-offset-4 hover:opacity-75"
                  >
                    <span>Live Site</span>
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                ) : null}

                {project.repositoryUrl ? (
                  <a
                    href={project.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cursor="link"
                    className="inline-flex items-center gap-1 font-medium text-ink underline underline-offset-4 hover:opacity-75"
                  >
                    <span>Repository</span>
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                ) : null}

                {!project.liveUrl && !project.repositoryUrl && (
                  <span className="text-ink-muted">
                    Not publicly linked yet
                  </span>
                )}
              </dd>
            </div>
          </dl>
          <HairlineRule immediate />
        </header>

        {/* Perspective-Tilt Visual Stage */}
        <m.div
          initial={
            prefersReducedMotion
              ? false
              : {opacity: 0, clipPath: 'inset(6% 0% 6% 0% round 16px)'}
          }
          animate={{opacity: 1, clipPath: 'inset(0% 0% 0% 0% round 16px)'}}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.6,
            delay: prefersReducedMotion ? 0 : 0.16,
            ease: EDITORIAL_EASE,
          }}
          className="perspective-stage mt-8 sm:mt-10"
        >
          <div
            ref={stageTiltRef}
            data-cursor="interactive"
            className="tilt-card theme-dark relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-hairline-strong)] bg-obsidian p-4 shadow-[0_28px_70px_-30px_rgba(9,9,11,0.45)] sm:p-6"
          >
            <div
              aria-hidden="true"
              className="spotlight-overlay-dark pointer-events-none absolute inset-0 z-20"
            />
            <div className="relative z-10">
              <ProjectPreviewVisual project={project} priority />
            </div>
          </div>
        </m.div>

        {/* Case Study Breakdown */}
        <div className="mt-12 grid grid-cols-1 gap-10 lg:mt-16 lg:grid-cols-12 lg:gap-12">
          <div className="space-y-10 lg:col-span-7">
            <section aria-labelledby="section-problem">
              <p className="text-[11px] font-medium tracking-[0.12em] text-ink-muted uppercase">
                01 · Context &amp; Problem
              </p>
              <h2
                id="section-problem"
                className="mt-2 text-xl font-semibold tracking-[var(--tracking-heading)] text-ink sm:text-2xl"
              >
                Why this system was built
              </h2>
              <p className="mt-3 text-sm leading-[1.72] text-ink-secondary sm:text-base">
                {project.problem}
              </p>
            </section>

            <section
              aria-labelledby="section-solution"
              className="border-t border-[var(--border-hairline)] pt-8"
            >
              <p className="text-[11px] font-medium tracking-[0.12em] text-ink-muted uppercase">
                02 · Implementation
              </p>
              <h2
                id="section-solution"
                className="mt-2 text-xl font-semibold tracking-[var(--tracking-heading)] text-ink sm:text-2xl"
              >
                Solution &amp; Built Architecture
              </h2>
              <p className="mt-3 text-sm leading-[1.72] text-ink-secondary sm:text-base">
                {project.solution}
              </p>

              {project.builtCapabilities.length > 0 && (
                <ul className="mt-6 divide-y divide-[var(--border-hairline)] border-y border-[var(--border-hairline)]">
                  {project.builtCapabilities.map((item, idx) => (
                    <li
                      key={item}
                      className="flex items-start gap-4 py-3.5 text-sm leading-[1.6] text-ink-secondary"
                    >
                      <span className="tabular-nums shrink-0 text-xs font-medium text-ink-muted">
                        0{idx + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section
              aria-labelledby="section-outcomes"
              className="border-t border-[var(--border-hairline)] pt-8"
            >
              <p className="text-[11px] font-medium tracking-[0.12em] text-ink-muted uppercase">
                03 · Transparency
              </p>
              <h2
                id="section-outcomes"
                className="mt-2 text-xl font-semibold tracking-[var(--tracking-heading)] text-ink sm:text-2xl"
              >
                Verified Outcomes
              </h2>

              {project.verifiedOutcomes.length > 0 ? (
                <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {project.verifiedOutcomes.map((outcome) => (
                    <div
                      key={outcome.label}
                      className="rounded-[var(--radius-md)] border border-[var(--border-hairline)] bg-surface p-4"
                    >
                      <dt className="text-xs font-medium text-ink-muted">
                        {outcome.label}
                      </dt>
                      <dd className="mt-1.5 text-sm font-medium text-ink">
                        {outcome.detail}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-3 text-sm leading-[1.68] text-ink-muted">
                  No independently verified production metrics, customer counts,
                  or business revenue figures are claimed for this project.
                </p>
              )}
            </section>
          </div>

          <aside className="space-y-8 lg:col-span-5">
            <div className="rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-surface p-6 sm:p-7">
              <h2 className="text-base font-semibold tracking-[var(--tracking-heading)] text-ink">
                Confirmed Stack &amp; Scope
              </h2>
              <ul className="mt-4 divide-y divide-[var(--border-hairline)]">
                {project.stack.map((tech) => (
                  <li
                    key={tech}
                    className="py-2.5 text-sm text-ink-secondary first:pt-0 last:pb-0"
                  >
                    {tech}
                  </li>
                ))}
              </ul>
            </div>

            {project.plannedOrUnverified.length > 0 && (
              <div className="rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-canvas p-6 sm:p-7">
                <h2 className="text-base font-semibold tracking-[var(--tracking-heading)] text-ink">
                  Scope &amp; Verification Notes
                </h2>
                <ul className="mt-4 space-y-3">
                  {project.plannedOrUnverified.map((note) => (
                    <li
                      key={note}
                      className="text-sm leading-[1.6] text-ink-muted"
                    >
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>

        {/* Bottom Case Study Navigation */}
        <footer className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-[var(--border-hairline)] pt-8 sm:flex-row sm:items-center">
          <a
            href="/#projects"
            data-cursor="link"
            onClick={handleBackClick}
            className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to All Projects</span>
          </a>

          <a
            ref={nextProjectRef}
            href={`/projects/${nextProject.slug}`}
            data-cursor="button"
            onClick={(event) => handleSwitchProject(event, nextProject.slug)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--border-hairline-strong)] bg-canvas px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink hover:bg-surface"
          >
            <span>
              Next: <span className="tabular-nums">{nextProject.order}</span>{' '}
              {nextProject.title}
            </span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </footer>
      </div>
    </article>
  );
}
