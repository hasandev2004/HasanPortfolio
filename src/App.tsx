/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {Suspense, lazy, useEffect, useRef, useState} from 'react';
import {LazyMotion, MotionConfig, domAnimation} from 'motion/react';
import {ArrowLeft, X} from 'lucide-react';
import {Navbar} from '@/src/components/Navbar';
import {Hero} from '@/src/components/Hero';
import {ProjectsSection} from '@/src/components/projects/ProjectsSection';
import {AboutSection} from '@/src/components/about/AboutSection';
import {SkillsSection} from '@/src/components/skills/SkillsSection';
import {ContactSection} from '@/src/components/contact/ContactSection';
import {Footer} from '@/src/components/layout/Footer';
import {CustomCursor} from '@/src/components/cursor/CustomCursor';
import {ScrollProgressBar} from '@/src/components/motion/ScrollPrimitives';
import type {SectionId} from '@/src/data/hero';
import {getProjectBySlug} from '@/src/data/projects';
import {useReducedMotion} from '@/src/hooks/useReducedMotion';
import {navigateToSection} from '@/src/lib/navigation';
import {getCurrentRoute, pushRoute, type AppRoute} from '@/src/lib/router';

const LazyProjectCaseStudy = lazy(() =>
  import('@/src/components/projects/ProjectCaseStudy').then((mod) => ({
    default: mod.ProjectCaseStudy,
  })),
);

const DEFAULT_TITLE = 'Muhammad Hasan — Software Developer & Co-Founder at Tasknix';
const DEFAULT_DESCRIPTION =
  'Portfolio of Muhammad Hasan, full-stack developer and Co-Founder at Tasknix building web applications, workflow automation, and AI software like SmartReach AI.';

export default function App() {
  const prefersReducedMotion = useReducedMotion();
  const [route, setRoute] = useState<AppRoute>(getCurrentRoute);
  const [activeSection, setActiveSection] = useState<SectionId | null>('top');
  const [isOverDarkZone, setIsOverDarkZone] = useState<boolean>(false);
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);
  const pendingScrollTargetRef = useRef<{target: SectionId; label: string} | null>(
    null,
  );

  // Sync browser Back/Forward history navigation
  useEffect(() => {
    const handlePopState = () => {
      const nextRoute = getCurrentRoute();
      setRoute(nextRoute);
      setPendingNotice(null);

      if (nextRoute.type === 'case-study') {
        setActiveSection('projects');
        window.scrollTo({top: 0, behavior: 'auto'});
      } else if (nextRoute.type === 'home') {
        setActiveSection('top');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Keep document.title and meta description synchronized with active route
  useEffect(() => {
    const metaDesc = document.querySelector('meta[name="description"]');
    if (route.type === 'case-study') {
      const entry = getProjectBySlug(route.slug);
      document.title = entry
        ? `${entry.title} — Muhammad Hasan`
        : 'Case Study Not Found — Muhammad Hasan';
      if (metaDesc) {
        metaDesc.setAttribute(
          'content',
          entry ? entry.shortDescription : DEFAULT_DESCRIPTION,
        );
      }
    } else if (route.type === 'not-found') {
      document.title = 'Page Not Found — Muhammad Hasan';
      if (metaDesc) {
        metaDesc.setAttribute('content', DEFAULT_DESCRIPTION);
      }
    } else {
      document.title = DEFAULT_TITLE;
      if (metaDesc) {
        metaDesc.setAttribute('content', DEFAULT_DESCRIPTION);
      }
    }
  }, [route]);

  // Execute deferred section scroll when returning to home route from a case study
  useEffect(() => {
    if (route.type !== 'home' || !pendingScrollTargetRef.current) {
      return;
    }

    const {target, label} = pendingScrollTargetRef.current;
    pendingScrollTargetRef.current = null;

    const rafId = window.requestAnimationFrame(() => {
      const result = navigateToSection(target, prefersReducedMotion);
      if (result.found) {
        setActiveSection(target);
      } else {
        setPendingNotice(`${label} will be connected in the upcoming build phase.`);
      }
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [route, prefersReducedMotion]);

  useEffect(() => {
    if (!pendingNotice) {
      return;
    }

    const timer = window.setTimeout(() => {
      setPendingNotice(null);
    }, 4000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [pendingNotice]);

  // Synchronize Navbar activeSection indicator with visible home sections
  useEffect(() => {
    if (route.type !== 'home' || typeof window === 'undefined') {
      return;
    }

    const sectionIds: readonly SectionId[] = [
      'top',
      'projects',
      'about',
      'skills',
      'contact',
    ];

    const updateActiveSection = () => {
      if (window.scrollY < 140) {
        setActiveSection((prev) => (prev === 'top' ? prev : 'top'));
        return;
      }

      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll > 0 && window.scrollY >= maxScroll - 40) {
        setActiveSection((prev) => (prev === 'contact' ? prev : 'contact'));
        return;
      }

      const probeY = Math.round(window.innerHeight * 0.34);
      let nextSection: SectionId = 'top';

      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) {
          continue;
        }
        const rect = el.getBoundingClientRect();
        if (rect.top <= probeY && rect.bottom >= probeY) {
          nextSection = id;
          break;
        }
        if (rect.top <= probeY) {
          nextSection = id;
        }
      }

      setActiveSection((prev) => (prev === nextSection ? prev : nextSection));
    };

    let rafId = 0;
    const handleScrollOrResize = () => {
      if (rafId !== 0) {
        return;
      }
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        updateActiveSection();
      });
    };

    updateActiveSection();
    window.addEventListener('scroll', handleScrollOrResize, {passive: true});
    window.addEventListener('resize', handleScrollOrResize, {passive: true});

    return () => {
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [route.type]);

  // Adapt floating glass Navbar contrast when positioned over dark obsidian sections
  useEffect(() => {
    setIsOverDarkZone(false);
    if (typeof window === 'undefined') {
      return;
    }

    const updateDarkZone = () => {
      const probeY = 42;
      const surfaces = Array.from(
        document.querySelectorAll<HTMLElement>('[data-nav-surface]'),
      );

      let overDark = false;
      for (const el of surfaces) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= probeY && rect.bottom >= probeY) {
          overDark = el.getAttribute('data-nav-surface') === 'dark';
          break;
        }
      }

      setIsOverDarkZone((prev) => (prev === overDark ? prev : overDark));
    };

    let rafId = 0;
    const handleScrollOrResize = () => {
      if (rafId !== 0) {
        return;
      }
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        updateDarkZone();
      });
    };

    updateDarkZone();
    window.addEventListener('scroll', handleScrollOrResize, {passive: true});
    window.addEventListener('resize', handleScrollOrResize, {passive: true});

    return () => {
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [route.type]);

  const handleNavigate = (target: SectionId, label: string) => {
    if (route.type !== 'home') {
      pendingScrollTargetRef.current = {target, label};
      setRoute(pushRoute('/'));
      setPendingNotice(null);
      return;
    }

    const result = navigateToSection(target, prefersReducedMotion);
    if (result.found) {
      setActiveSection(target);
      setPendingNotice(null);
    } else {
      setPendingNotice(`${label} will be connected in the upcoming build phase.`);
    }
  };

  const handleOpenCaseStudy = (slug: string) => {
    setPendingNotice(null);
    setActiveSection('projects');
    setRoute(pushRoute(`/projects/${encodeURIComponent(slug)}`));
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  const handleBackToProjects = () => {
    pendingScrollTargetRef.current = {target: 'projects', label: 'Projects'};
    setPendingNotice(null);
    setRoute(pushRoute('/'));
  };

  const currentCaseStudy =
    route.type === 'case-study' ? getProjectBySlug(route.slug) : undefined;

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div className="min-h-screen bg-canvas text-ink">
          <CustomCursor />
          <ScrollProgressBar isDarkZone={isOverDarkZone} />

          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-obsidian focus:px-4 focus:py-2 focus:text-xs focus:font-medium focus:text-on-dark"
          >
            Skip to main content
          </a>

          <Navbar
            activeSection={route.type === 'case-study' ? 'projects' : activeSection}
            isOverDarkZone={isOverDarkZone}
            onNavigate={handleNavigate}
          />

          <main id="main-content" tabIndex={-1} className="outline-none">
            {route.type === 'home' && (
              <>
                <Hero
                  onNavigate={handleNavigate}
                  onOpenCaseStudy={handleOpenCaseStudy}
                />
                <ProjectsSection onOpenCaseStudy={handleOpenCaseStudy} />
                <AboutSection />
                <SkillsSection />
                <ContactSection />
              </>
            )}

            {route.type === 'case-study' && (
              <div data-nav-surface="light">
                <Suspense
                  fallback={
                    <div className="min-h-[60vh] bg-canvas pt-32 pb-24" />
                  }
                >
                  <LazyProjectCaseStudy
                    project={currentCaseStudy}
                    requestedSlug={route.slug}
                    onBackToProjects={handleBackToProjects}
                    onOpenCaseStudy={handleOpenCaseStudy}
                  />
                </Suspense>
              </div>
            )}

            {route.type === 'not-found' && (
              <section
                data-nav-surface="light"
                aria-labelledby="route-not-found"
                className="bg-canvas pt-28 pb-20 sm:pt-36 sm:pb-28"
              >
                <div className="mx-auto max-w-[var(--container-max)] px-4 sm:px-8 lg:px-12">
                  <div className="max-w-xl rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-surface p-8 sm:p-10">
                    <p className="text-xs font-medium tracking-[0.12em] text-ink-muted">
                      Route Not Found
                    </p>
                    <h1
                      id="route-not-found"
                      className="mt-3 text-2xl font-semibold tracking-[var(--tracking-heading)] text-ink sm:text-3xl"
                    >
                      This page does not exist.
                    </h1>
                    <p className="mt-3 text-sm leading-[1.65] text-ink-secondary">
                      The requested path{' '}
                      <span className="font-medium text-ink">{route.path}</span>{' '}
                      could not be resolved.
                    </p>
                    <div className="mt-7">
                      <a
                        href="/"
                        onClick={(event) => {
                          event.preventDefault();
                          handleNavigate('top', 'Home');
                        }}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-obsidian px-5 py-2.5 text-sm font-medium text-on-dark transition-colors hover:bg-obsidian-elevated"
                      >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        <span>Return Home</span>
                      </a>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </main>

          <Footer
            onNavigate={handleNavigate}
            onOpenCaseStudy={handleOpenCaseStudy}
          />

          {/* Accessible status feedback when clicking upcoming section hooks */}
          <div
            aria-live="polite"
            aria-atomic="true"
            className="pointer-events-none fixed right-4 bottom-4 left-4 z-40 flex justify-end sm:right-6 sm:bottom-6 sm:left-auto"
          >
            {pendingNotice && (
              <div className="pointer-events-auto flex max-w-sm items-center gap-3 rounded-full border border-[var(--border-hairline-strong)] bg-white/92 px-4 py-2.5 text-xs font-medium text-ink shadow-[0_12px_32px_-12px_rgba(9,9,11,0.2)] backdrop-blur-md">
                <span>{pendingNotice}</span>
                <button
                  type="button"
                  onClick={() => setPendingNotice(null)}
                  aria-label="Dismiss notification"
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-subtle hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}
