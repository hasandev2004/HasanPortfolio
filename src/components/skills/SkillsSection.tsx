import {useRef} from 'react';
import {m, useScroll, useTransform} from 'motion/react';
import {SKILL_GROUPS} from '@/src/data/profile';
import {useReducedMotion} from '@/src/hooks/useReducedMotion';
import {MaskedReveal} from '@/src/components/motion/ScrollPrimitives';

interface SkillLedgerRowProps {
  group: (typeof SKILL_GROUPS)[number];
  prefersReducedMotion: boolean;
}

function SkillLedgerRow({group, prefersReducedMotion}: SkillLedgerRowProps) {
  const rowRef = useRef<HTMLLIElement | null>(null);
  const {scrollYProgress} = useScroll({
    target: rowRef,
    offset: ['start 0.92', 'start 0.5'],
  });
  const ruleScaleX = useTransform(scrollYProgress, [0, 1], [0.06, 1]);

  return (
    <li
      ref={rowRef}
      className="group relative transition-colors duration-200 hover:bg-surface/65"
    >
      <div className="px-2 py-7 sm:px-4 sm:py-9">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12 lg:items-baseline">
          {/* Index + Category */}
          <div className="flex items-baseline gap-4 lg:col-span-4">
            <span className="tabular-nums text-xs font-medium text-ink-muted">
              {group.order}
            </span>
            <h3 className="text-lg font-semibold tracking-[var(--tracking-heading)] text-ink transition-transform duration-200 ease-[var(--ease-editorial)] group-hover:translate-x-1 sm:text-xl">
              {group.category}
            </h3>
          </div>

          {/* Scope Description */}
          <div className="lg:col-span-4">
            <p className="text-sm leading-[1.6] text-ink-secondary">
              {group.scope}
            </p>
          </div>

          {/* Unboxed Typographic Skill List */}
          <div className="lg:col-span-4">
            <ul
              aria-label={`${group.category} technologies`}
              className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm font-semibold tracking-[-0.01em] text-ink lg:justify-end"
            >
              {group.items.map((skill, idx) => (
                <li key={skill} className="inline-flex items-center gap-3">
                  <span>{skill}</span>
                  {idx < group.items.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="font-normal text-ink-muted"
                    >
                      /
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <m.div
        aria-hidden="true"
        style={
          prefersReducedMotion
            ? undefined
            : {scaleX: ruleScaleX, transformOrigin: 'left center'}
        }
        className="h-px w-full bg-[var(--border-hairline)]"
      />
    </li>
  );
}

/**
 * Scene 6b — Confirmed Technical Skills Ledger.
 * Continuous scroll-driven hairline rules trace each domain row in sync with reading position.
 */
export function SkillsSection() {
  const prefersReducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const {scrollYProgress} = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const topRuleScaleX = useTransform(scrollYProgress, [0.06, 0.34], [0.05, 1]);
  const ledgerY = useTransform(scrollYProgress, [0, 0.5, 1], [18, 0, -12]);

  return (
    <section
      ref={sectionRef}
      id="skills"
      data-nav-surface="light"
      aria-labelledby="skills-heading"
      className="scroll-mt-24 overflow-x-clip border-t border-[var(--border-hairline)] bg-canvas py-20 sm:py-28 lg:py-32"
    >
      <div className="mx-auto w-full max-w-[var(--container-max)] px-4 sm:px-8 lg:px-12">
        {/* Section Editorial Header */}
        <div className="grid grid-cols-1 gap-6 pb-10 lg:grid-cols-12 lg:items-end lg:pb-12">
          <div className="lg:col-span-7">
            <MaskedReveal delay={0.02}>
              <p className="text-xs font-medium tracking-[0.14em] text-ink-muted uppercase">
                Skills
              </p>
            </MaskedReveal>
            <h2
              id="skills-heading"
              className="mt-3 max-w-[18ch] text-[clamp(1.95rem,3.8vw,3.15rem)] leading-[1.08] font-semibold tracking-[var(--tracking-heading)] text-ink"
            >
              <MaskedReveal delay={0.08}>
                <span>Confirmed technologies</span>
              </MaskedReveal>
              <MaskedReveal delay={0.14}>
                <span className="font-serif block pt-0.5 font-medium italic text-ink">
                  across web and data layers.
                </span>
              </MaskedReveal>
            </h2>
          </div>

          <div className="lg:col-span-5">
            <p className="max-w-[46ch] text-sm leading-[1.68] text-ink-secondary sm:text-[15px]">
              Foundational tools applied directly in web development, backend
              application architecture, relational databases, and business
              software workflows.
            </p>
          </div>
        </div>

        <m.div
          aria-hidden="true"
          style={
            prefersReducedMotion
              ? undefined
              : {scaleX: topRuleScaleX, transformOrigin: 'left center'}
          }
          className="h-px w-full bg-[var(--border-hairline)]"
        />

        {/* Architectural Typographic Ledger */}
        <m.ul
          style={prefersReducedMotion ? undefined : {y: ledgerY}}
          aria-label="Confirmed technical skills grouped by domain"
        >
          {SKILL_GROUPS.map((group) => (
            <SkillLedgerRow
              key={group.order}
              group={group}
              prefersReducedMotion={prefersReducedMotion}
            />
          ))}
        </m.ul>
      </div>
    </section>
  );
}

