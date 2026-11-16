import {useRef} from 'react';
import {m, useScroll, useTransform} from 'motion/react';
import {PROFILE} from '@/src/data/profile';
import {useCardTilt} from '@/src/hooks/useCardTilt';
import {useReducedMotion} from '@/src/hooks/useReducedMotion';
import {MaskedReveal} from '@/src/components/motion/ScrollPrimitives';

/**
 * Scene 6a — About Monograph.
 * Driven by continuous scroll-linked elevation between the sticky identity
 * index and the right-hand monograph rather than repetitive per-paragraph fades.
 */
export function AboutSection() {
  const prefersReducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const monographCardRef = useCardTilt<HTMLDivElement>({maxTiltDeg: 1.4});

  const {scrollYProgress} = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const indexY = useTransform(scrollYProgress, [0, 0.5, 1], [16, 0, -10]);
  const monographY = useTransform(scrollYProgress, [0, 0.5, 1], [28, 0, -22]);
  const monographScale = useTransform(
    scrollYProgress,
    [0, 0.24, 0.78, 1],
    [0.975, 1, 1, 0.985],
  );
  const ruleScaleX = useTransform(scrollYProgress, [0.08, 0.42], [0.08, 1]);

  return (
    <section
      ref={sectionRef}
      id="about"
      data-nav-surface="light"
      aria-labelledby="about-heading"
      className="scroll-mt-24 overflow-x-clip border-t border-[var(--border-hairline)] bg-surface py-20 sm:py-28 lg:py-32"
    >
      <div className="mx-auto w-full max-w-[var(--container-max)] px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-14">
          {/* Left Sticky Editorial Index */}
          <m.div
            style={prefersReducedMotion ? undefined : {y: indexY}}
            className="lg:sticky lg:top-28 lg:col-span-5"
          >
            <MaskedReveal delay={0.02}>
              <p className="text-xs font-medium tracking-[0.14em] text-ink-muted uppercase">
                About
              </p>
            </MaskedReveal>

            <h2
              id="about-heading"
              className="mt-3 max-w-[16ch] text-[clamp(1.95rem,3.8vw,3.15rem)] leading-[1.08] font-semibold tracking-[var(--tracking-heading)] text-ink"
            >
              <MaskedReveal delay={0.08}>
                <span>Software built around</span>
              </MaskedReveal>
              <MaskedReveal delay={0.14}>
                <span className="font-serif block pt-0.5 font-medium italic text-ink">
                  practical business operations.
                </span>
              </MaskedReveal>
            </h2>

            <dl className="mt-8 lg:mt-10">
              {PROFILE.facts.map((fact) => (
                <div key={fact.label}>
                  <m.div
                    aria-hidden="true"
                    style={
                      prefersReducedMotion
                        ? undefined
                        : {scaleX: ruleScaleX, transformOrigin: 'left center'}
                    }
                    className="h-px w-full bg-[var(--border-hairline)]"
                  />
                  <div className="py-4">
                    <dt className="text-xs font-medium text-ink-muted">
                      {fact.label}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-ink">
                      {fact.value}
                    </dd>
                  </div>
                </div>
              ))}
              <m.div
                aria-hidden="true"
                style={
                  prefersReducedMotion
                    ? undefined
                    : {scaleX: ruleScaleX, transformOrigin: 'left center'}
                }
                className="h-px w-full bg-[var(--border-hairline)]"
              />
            </dl>
          </m.div>

          {/* Right Column: Scroll-Linked Editorial Monograph */}
          <m.div
            style={
              prefersReducedMotion
                ? undefined
                : {y: monographY, scale: monographScale}
            }
            className="perspective-stage lg:col-span-7 lg:pl-6"
          >
            <div
              ref={monographCardRef}
              className="tilt-card relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-canvas p-7 shadow-[0_24px_60px_-32px_rgba(9,9,11,0.12)] sm:p-9 lg:p-11"
            >
              <div
                aria-hidden="true"
                className="spotlight-overlay-light pointer-events-none absolute inset-0"
              />

              <div className="relative z-10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-medium tracking-[0.1em] text-ink-muted uppercase">
                    {PROFILE.roleSummary}
                  </p>
                  <span className="font-serif text-base italic text-ink-muted">
                    Practice &amp; Approach
                  </span>
                </div>

                <m.div
                  aria-hidden="true"
                  style={
                    prefersReducedMotion
                      ? undefined
                      : {scaleX: ruleScaleX, transformOrigin: 'left center'}
                  }
                  className="mt-5 h-px w-full bg-[var(--border-hairline)]"
                />

                <div className="mt-6 space-y-6">
                  {PROFILE.paragraphs.map((paragraph, index) => (
                    <p
                      key={index}
                      className={`leading-[1.74] ${
                        index === 0
                          ? 'text-base font-medium text-ink sm:text-lg'
                          : 'text-sm text-ink-secondary sm:text-[15px]'
                      }`}
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </m.div>
        </div>
      </div>
    </section>
  );
}

