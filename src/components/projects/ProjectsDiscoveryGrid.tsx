import {useEffect, useMemo, useState, type MouseEvent} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {PROJECTS, type ProjectEntry} from '@/src/data/projects';
import {useReducedMotion} from '@/src/hooks/useReducedMotion';
import {
  FisheyeInfiniteGrid,
  type FisheyeGridItem,
} from '@/src/components/ui/FisheyeInfiniteGrid';

export interface ProjectsDiscoveryGridProps {
  onOpenCaseStudy: (slug: string) => void;
}

type ViewportTier = 'mobile' | 'tablet' | 'desktop';

function getTileFocalPoint(slug: string): {focalX: number; focalY: number} {
  switch (slug) {
    case 'karv-steakhouse':
      return {focalX: 0.56, focalY: 0.0};
    case 'kingz-barberz':
      return {focalX: 0.48, focalY: 0.0};
    case 'zyrox-wear':
      return {focalX: 0.14, focalY: 0.22};
    case 'smartreach-ai':
    default:
      return {focalX: 0.5, focalY: 0.5};
  }
}

function getTileImage(project: ProjectEntry): string {
  if (project.screenshotPath) {
    return project.screenshotPath;
  }
  return '/projects/smartreach-preview.svg';
}

/**
 * Spatial discovery prologue for Selected Works (#projects).
 * Places the interactive WebGL Fisheye Infinite Grid above SmartReach -> Zyrox
 * cinematic acts while preserving uninterrupted vertical scrolling and full
 * keyboard + accessible directory navigation.
 */
export function ProjectsDiscoveryGrid({
  onOpenCaseStudy,
}: ProjectsDiscoveryGridProps) {
  const prefersReducedMotion = useReducedMotion();
  const [viewportTier, setViewportTier] = useState<ViewportTier>('desktop');
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateTier = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setViewportTier('mobile');
      } else if (width < 1024) {
        setViewportTier('tablet');
      } else {
        setViewportTier('desktop');
      }
    };

    updateTier();
    window.addEventListener('resize', updateTier, {passive: true});
    return () => {
      window.removeEventListener('resize', updateTier);
    };
  }, []);

  const gridItems = useMemo<FisheyeGridItem[]>(
    () =>
      PROJECTS.map((project, index) => {
        const {focalX, focalY} = getTileFocalPoint(project.slug);
        const isPrimary = index === 0;
        return {
          image: getTileImage(project),
          alt: `${project.title} — ${project.category}`,
          title: project.title,
          meta: isPrimary ? `${project.order} · Primary` : project.order,
          subtitle: project.visualDirection.locationOrContext,
          href: `/projects/${project.slug}`,
          slug: project.slug,
          featured: isPrimary,
          focalX,
          focalY,
        };
      }),
    [],
  );

  const gridConfig = useMemo(() => {
    const base =
      viewportTier === 'mobile'
        ? {
            tileWidth: 210,
            tileHeight: 216,
            gap: 10,
            lensStrength: 0.14,
            hoverNudge: 0,
            inertia: 0.9,
            wheelSensitivity: 0.3,
          }
        : viewportTier === 'tablet'
          ? {
              tileWidth: 256,
              tileHeight: 262,
              gap: 12,
              lensStrength: 0.22,
              hoverNudge: 10,
              inertia: 0.93,
              wheelSensitivity: 0.38,
            }
          : {
              tileWidth: 304,
              tileHeight: 286,
              gap: 14,
              lensStrength: 0.28,
              hoverNudge: 14,
              inertia: 0.94,
              wheelSensitivity: 0.42,
            };

    if (prefersReducedMotion) {
      return {
        ...base,
        lensStrength: viewportTier === 'mobile' ? 0.08 : 0.14,
        hoverNudge: 0,
        inertia: 0,
        wheelSensitivity: 0.15,
      };
    }

    return base;
  }, [prefersReducedMotion, viewportTier]);

  const activeProject = useMemo(
    () =>
      PROJECTS.find((p) => p.slug === hoveredSlug) ?? PROJECTS[0],
    [hoveredSlug],
  );

  const handleLinkClick = (
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

  return (
    <div
      data-nav-surface="dark"
      aria-labelledby="projects-discovery-heading"
      className="theme-dark relative overflow-x-clip border-b border-white/10 bg-obsidian pt-24 pb-12 text-on-dark sm:pt-28 sm:pb-16 lg:pt-28 lg:pb-18"
    >
      <div className="mx-auto w-full max-w-[var(--container-max)] px-4 sm:px-8 lg:px-12">
        {/* Editorial Introduction Strip */}
        <div className="flex flex-col gap-5 border-b border-[var(--border-dark-hairline)] pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-medium tracking-[0.14em] text-on-dark-muted uppercase">
              Selected Works · Spatial Index
            </p>
            <h2
              id="projects-discovery-heading"
              className="mt-2.5 max-w-[24ch] text-[clamp(1.75rem,3.6vw,2.85rem)] leading-[1.08] font-semibold tracking-[var(--tracking-heading)] text-on-dark"
            >
              Four built systems{' '}
              <span className="font-serif font-medium italic text-on-dark-muted">
                across web and automation.
              </span>
            </h2>
          </div>

          <div className="flex flex-col gap-1.5 text-xs text-on-dark-muted lg:max-w-[38ch] lg:text-right">
            <p className="leading-[1.6]">
              Drag across the lens, pan with arrow keys, or select any project
              tile to open its case study.
            </p>
            <p className="tabular-nums font-medium text-on-dark">
              {hoveredSlug ? 'Inspecting: ' : 'Featured Focus: '}
              <span>{activeProject.title}</span>
              <span className="text-on-dark-muted">
                {' '}
                · {activeProject.order} / 0{PROJECTS.length}
              </span>
            </p>
          </div>
        </div>

        {/* Continuous Fisheye Spatial Field */}
        <div className="mt-6 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-dark-hairline-strong)] bg-[#09090B] shadow-[0_32px_84px_-34px_rgba(0,0,0,0.95)] sm:mt-7">
          <div className="relative h-[370px] w-full sm:h-[430px] lg:h-[490px]">
            <FisheyeInfiniteGrid
              items={gridItems}
              tileWidth={gridConfig.tileWidth}
              tileHeight={gridConfig.tileHeight}
              gap={gridConfig.gap}
              lensStrength={gridConfig.lensStrength}
              theme="dark"
              hoverNudge={gridConfig.hoverNudge}
              inertia={gridConfig.inertia}
              wheelSensitivity={gridConfig.wheelSensitivity}
              onItemSelect={(item) => {
                if (item.slug) {
                  onOpenCaseStudy(item.slug);
                }
              }}
              onItemHover={(item) => {
                setHoveredSlug(item?.slug ?? null);
              }}
              aria-label="Interactive fisheye grid featuring SmartReach AI, Karv Steakhouse, Kingz Barberz, and Zyrox Wear"
              className="h-full w-full"
            />
          </div>

          {/* Accessible Direct Navigation Index Bar */}
          <nav
            aria-label="Project case study links"
            className="grid grid-cols-1 border-t border-white/12 bg-[#0D0D11] sm:grid-cols-2 lg:grid-cols-4"
          >
            {PROJECTS.map((project, index) => {
              const isPrimary = index === 0;
              const isHighlighted = hoveredSlug === project.slug;
              return (
                <a
                  key={project.id}
                  href={`/projects/${project.slug}`}
                  data-cursor="button"
                  onClick={(event) => handleLinkClick(event, project.slug)}
                  onMouseEnter={() => setHoveredSlug(project.slug)}
                  onMouseLeave={() => setHoveredSlug(null)}
                  className={`group flex min-h-[68px] items-center justify-between gap-3 border-white/10 px-4 py-3.5 transition-colors duration-200 focus-visible:bg-white/[0.08] sm:px-5 [&:not(:last-child)]:border-b sm:[&:nth-child(odd)]:border-r sm:[&:nth-last-child(-n+2)]:border-b-0 lg:[&:not(:last-child)]:border-b-0 lg:[&:not(:last-child)]:border-r ${
                    isHighlighted
                      ? 'bg-white/[0.08]'
                      : isPrimary
                        ? 'bg-white/[0.03] hover:bg-white/[0.06]'
                        : 'hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] text-on-dark-muted">
                      <span className="tabular-nums font-medium text-on-dark">
                        {project.order}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">
                        {isPrimary
                          ? 'Primary Software'
                          : project.visualDirection.locationOrContext}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm font-semibold tracking-[var(--tracking-heading)] text-on-dark">
                      {project.title}
                    </p>
                  </div>

                  <ArrowUpRight
                    className="h-4 w-4 shrink-0 text-on-dark-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-on-dark"
                    aria-hidden="true"
                  />
                </a>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
