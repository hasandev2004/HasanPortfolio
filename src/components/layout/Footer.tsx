import {useRef, type MouseEvent} from 'react';
import {m, useScroll, useTransform} from 'motion/react';
import {ArrowUp, ArrowUpRight} from 'lucide-react';
import {BRAND_NAME, NAV_ITEMS, type SectionId} from '@/src/data/hero';
import {CONTACT_CONFIG, PROFILE} from '@/src/data/profile';
import {PROJECTS} from '@/src/data/projects';
import {useReducedMotion} from '@/src/hooks/useReducedMotion';
import {DitheredLogo} from '@/src/components/ui/DitheredLogo';

export interface FooterProps {
  onNavigate: (target: SectionId, label: string) => void;
  onOpenCaseStudy?: (slug: string) => void;
}

export function Footer({onNavigate, onOpenCaseStudy}: FooterProps) {
  const prefersReducedMotion = useReducedMotion();
  const footerRef = useRef<HTMLElement | null>(null);
  const currentYear = new Date().getFullYear();

  const {scrollYProgress} = useScroll({
    target: footerRef,
    offset: ['start end', 'end end'],
  });
  const brandY = useTransform(scrollYProgress, [0, 1], [28, 0]);
  const navY = useTransform(scrollYProgress, [0, 1], [18, 0]);
  const ruleScaleX = useTransform(scrollYProgress, [0.15, 0.95], [0.08, 1]);
  const signatureDispersion = useTransform(scrollYProgress, [0.05, 0.92], [0.55, 0]);
  const signatureOpacity = useTransform(scrollYProgress, [0.05, 0.92], [0.35, 0.92]);

  const handleNavClick = (
    event: MouseEvent<HTMLAnchorElement>,
    target: SectionId,
    label: string,
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
    onNavigate(target, label);
  };

  const handleCaseStudyClick = (
    event: MouseEvent<HTMLAnchorElement>,
    slug: string,
  ) => {
    if (
      !onOpenCaseStudy ||
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
    <footer
      ref={footerRef}
      data-nav-surface="dark"
      className="theme-dark overflow-x-clip border-t border-[var(--border-dark-hairline)] bg-obsidian text-on-dark"
    >
      <div className="mx-auto w-full max-w-[var(--container-max)] px-4 py-16 sm:px-8 sm:py-20 lg:px-12">
        <div className="grid grid-cols-1 gap-10 pb-12 lg:grid-cols-12 lg:items-end">
          <m.div
            style={prefersReducedMotion ? undefined : {y: brandY}}
            className="lg:col-span-6"
          >
            <div className="flex items-center gap-4">
              <m.div
                aria-hidden="true"
                style={
                  prefersReducedMotion ? undefined : {opacity: signatureOpacity}
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
                  interactive={false}
                  dispersionProgress={
                    prefersReducedMotion ? undefined : signatureDispersion
                  }
                  dispersionDistance={20}
                  className="h-full w-full"
                />
              </m.div>
              <a
                href="#top"
                data-cursor="link"
                onClick={(event) => handleNavClick(event, 'top', BRAND_NAME)}
                className="inline-block text-[clamp(1.55rem,3.4vw,2.5rem)] leading-none font-semibold tracking-[0.04em] text-on-dark transition-opacity hover:opacity-80"
              >
                {BRAND_NAME}
              </a>
            </div>
            <p className="mt-4 max-w-[44ch] text-sm leading-[1.65] text-on-dark-muted">
              {PROFILE.roleSummary}. Building web applications, workflow
              automation, and practical business tools.
            </p>
          </m.div>

          <m.div
            style={prefersReducedMotion ? undefined : {y: navY}}
            className="grid grid-cols-2 gap-8 sm:gap-10 lg:col-span-6 lg:justify-items-end"
          >
            <nav aria-label="Footer sections">
              <p className="text-[11px] font-medium tracking-[0.14em] text-on-dark-muted uppercase">
                Navigation
              </p>
              <ul className="mt-3 space-y-1">
                {NAV_ITEMS.map((item) => (
                  <li key={item.target}>
                    <a
                      href={item.href}
                      data-cursor="link"
                      onClick={(event) =>
                        handleNavClick(event, item.target, item.label)
                      }
                      className="inline-flex min-h-[38px] items-center whitespace-nowrap text-sm font-medium text-on-dark-muted transition-colors hover:text-on-dark"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}

                {CONTACT_CONFIG.socialLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-cursor="link"
                      className="inline-flex min-h-[38px] items-center gap-1 whitespace-nowrap text-sm font-medium text-on-dark-muted transition-colors hover:text-on-dark"
                    >
                      <span>{link.label}</span>
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Selected project case studies">
              <p className="text-[11px] font-medium tracking-[0.14em] text-on-dark-muted uppercase">
                Case Studies
              </p>
              <ul className="mt-3 space-y-1">
                {PROJECTS.map((project) => (
                  <li key={project.id}>
                    <a
                      href={`/projects/${project.slug}`}
                      data-cursor="link"
                      onClick={(event) =>
                        handleCaseStudyClick(event, project.slug)
                      }
                      className="inline-flex min-h-[38px] items-center whitespace-nowrap text-sm font-medium text-on-dark-muted transition-colors hover:text-on-dark"
                    >
                      {project.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </m.div>
        </div>

        <m.div
          aria-hidden="true"
          style={
            prefersReducedMotion
              ? undefined
              : {scaleX: ruleScaleX, transformOrigin: 'left center'}
          }
          className="h-px w-full bg-[var(--border-dark-hairline)]"
        />

        <div className="flex flex-col items-start justify-between gap-4 pt-6 sm:flex-row sm:items-center">
          <p className="tabular-nums text-xs text-on-dark-muted">
            &copy; {currentYear} Muhammad Hasan. All rights reserved.
          </p>

          <a
            href="#top"
            data-cursor="link"
            onClick={(event) => handleNavClick(event, 'top', 'Back to top')}
            className="group inline-flex min-h-[44px] items-center gap-1.5 whitespace-nowrap text-xs font-medium text-on-dark-muted transition-colors hover:text-on-dark"
          >
            <span>Back to top</span>
            <ArrowUp
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}

