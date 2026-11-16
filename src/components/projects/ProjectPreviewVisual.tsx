import {useState} from 'react';
import type {ProjectEntry} from '@/src/data/projects';

export interface ProjectPreviewVisualProps {
  project: ProjectEntry;
  compact?: boolean;
  priority?: boolean;
}

const SMARTREACH_STAGES = [
  {step: '01', name: 'Geo Discovery', detail: 'OpenStreetMap · Overpass · Nominatim'},
  {step: '02', name: 'Site & Contact', detail: 'Official business website extraction'},
  {step: '03', name: 'Audit & Score', detail: 'Website audit · Offline lead scoring'},
  {step: '04', name: 'Draft & Approve', detail: 'AI email draft · Manual approval gate'},
  {step: '05', name: 'CRM Follow-Up', detail: 'Structured follow-up tracking'},
] as const;

export function ProjectPreviewVisual({
  project,
  compact = false,
  priority = false,
}: ProjectPreviewVisualProps) {
  const [imageError, setImageError] = useState(false);

  if (project.coverVisual === 'smartreach-workflow') {
    return (
      <div
        role="img"
        aria-label={`${project.title} conceptual workflow diagram`}
        className={`relative flex w-full flex-col justify-between overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-dark-hairline)] bg-[#070709] text-on-dark ${
          compact ? 'min-h-[290px] p-5 sm:p-6' : 'min-h-[340px] p-6 sm:p-8'
        }`}
      >
        {/* Subtle studio radial highlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 80% 18%, rgba(250, 249, 246, 0.085) 0%, rgba(7, 7, 9, 0) 58%)',
          }}
        />

        {/* Header Strip */}
        <div className="relative z-10 flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <span className="text-xs font-medium tracking-[0.06em] text-on-dark-muted">
            Pipeline Architecture
          </span>
          <span className="text-xs text-on-dark-muted">
            User-Approved Outreach
          </span>
        </div>

        {/* Conceptual 5-stage architectural flow */}
        <div className="relative z-10 my-5 space-y-2.5 sm:my-6">
          {SMARTREACH_STAGES.map((stage, index) => (
            <div
              key={stage.step}
              className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2.5 transition-colors duration-200 hover:border-white/25 hover:bg-white/[0.06]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="tabular-nums shrink-0 text-[11px] font-medium text-on-dark-muted">
                  {stage.step}
                </span>
                <span className="truncate text-xs font-medium text-on-dark sm:text-sm">
                  {stage.name}
                </span>
              </div>
              <span className="hidden shrink-0 text-[11px] text-on-dark-muted sm:inline">
                {stage.detail}
              </span>
              {index === 3 && (
                <span className="shrink-0 text-[11px] font-medium text-on-dark sm:hidden">
                  Manual Gate
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Footer Structural Note */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-3.5 text-[11px] text-on-dark-muted">
          <span>System schematic · In development</span>
          <span>No automated sending</span>
        </div>
      </div>
    );
  }

  const isKarv = project.coverVisual === 'karv-editorial';
  const isKingz = project.coverVisual === 'kingz-grooming';
  const isZyrox = project.coverVisual === 'zyrox-fashion';

  const frameChromeStyle = isKarv
    ? 'border-[#C5A880]/30 bg-[#F3EFE6] text-ink'
    : isZyrox
      ? 'border-[#D4AF37]/30 bg-[#0B0A08] text-on-dark'
      : 'border-white/18 bg-[#050507] text-on-dark';

  const barTextClass = isKarv ? 'text-ink-muted' : 'text-on-dark-muted';
  const barTitleClass = isKarv ? 'text-ink' : 'text-on-dark';
  const barBorderClass = isKarv
    ? 'border-black/10'
    : isZyrox
      ? 'border-[#D4AF37]/20'
      : 'border-white/12';

  return (
    <div
      className={`relative overflow-hidden rounded-[var(--radius-md)] border ${frameChromeStyle}`}
    >
      {/* Domain-tuned top editorial bar */}
      <div
        className={`flex items-center justify-between gap-3 border-b px-4 py-2.5 text-[11px] ${barBorderClass}`}
      >
        <span className={`font-medium tracking-[0.06em] uppercase ${barTitleClass}`}>
          {project.visualDirection.disciplineLabel}
        </span>
        <span className={`truncate ${barTextClass}`}>
          {project.visualDirection.locationOrContext}
        </span>
      </div>

      {/* Live Website Screenshot Frame */}
      <div
        className={`relative w-full overflow-hidden ${
          compact ? 'aspect-[16/10]' : 'aspect-[16/9]'
        } ${isKarv ? 'bg-[#EAE4D7]' : 'bg-[#09090B]'}`}
      >
        {project.screenshotPath && !imageError ? (
          <img
            src={project.screenshotPath}
            alt={`${project.title} live website preview`}
            loading={priority ? 'eager' : 'lazy'}
            onError={() => setImageError(true)}
            className="h-full w-full object-cover object-top transition-transform duration-500 ease-[var(--ease-editorial)] group-hover:scale-[1.015]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
            <p className="font-serif text-2xl font-medium italic">
              {project.title}
            </p>
            <p className={`mt-2 text-xs ${barTextClass}`}>
              {project.category}
            </p>
          </div>
        )}
      </div>

      {/* Bottom architectural caption strip */}
      <div
        className={`flex items-center justify-between gap-3 border-t px-4 py-2.5 text-[11px] ${barBorderClass} ${barTextClass}`}
      >
        <span>
          {isKingz
            ? 'Monochrome grooming art direction'
            : isZyrox
              ? 'Dark fashion practice concept'
              : 'Editorial hospitality web layout'}
        </span>
        <span className={`font-medium ${barTitleClass}`}>
          {project.liveUrl ? 'Live Deployment Verified' : 'Schematic'}
        </span>
      </div>
    </div>
  );
}
