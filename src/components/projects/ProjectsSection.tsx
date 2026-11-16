import {PROJECTS} from '@/src/data/projects';
import {useReducedMotion} from '@/src/hooks/useReducedMotion';
import {ProjectsDiscoveryGrid} from '@/src/components/projects/ProjectsDiscoveryGrid';
import {SmartReachScene} from '@/src/components/projects/scenes/SmartReachScene';
import {KarvScene} from '@/src/components/projects/scenes/KarvScene';
import {KingzScene} from '@/src/components/projects/scenes/KingzScene';
import {ZyroxScene} from '@/src/components/projects/scenes/ZyroxScene';
import {DitherTransitionBand} from '@/src/components/ui/DitherTransitionBand';

export interface ProjectsSectionProps {
  onOpenCaseStudy: (slug: string) => void;
}

/**
 * Orchestrates the Spatial Discovery Grid (Fisheye Infinite Grid) followed by
 * Scenes 2–5 as four distinct, domain-authentic scroll-choreographed project acts
 * with restrained inter-chapter halftone stipple transitions.
 */
export function ProjectsSection({onOpenCaseStudy}: ProjectsSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  const smartreach = PROJECTS[0];
  const karv = PROJECTS[1];
  const kingz = PROJECTS[2];
  const zyrox = PROJECTS[3];

  const handleJumpToScene = (sceneId: string) => {
    const el = document.getElementById(sceneId);
    if (el) {
      el.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  };

  return (
    <section
      id="projects"
      aria-label="Selected Projects Showcase"
    >
      <ProjectsDiscoveryGrid onOpenCaseStudy={onOpenCaseStudy} />

      {smartreach && (
        <SmartReachScene
          project={smartreach}
          allProjects={PROJECTS}
          onOpenCaseStudy={onOpenCaseStudy}
          onJumpToScene={handleJumpToScene}
        />
      )}

      {smartreach && karv && (
        <DitherTransitionBand
          surfaceClassName="bg-[#F5F1E8]"
          particleColor="#5A4F41"
          navSurface="light"
        />
      )}

      {karv && (
        <KarvScene
          project={karv}
          totalProjects={PROJECTS.length}
          onOpenCaseStudy={onOpenCaseStudy}
        />
      )}

      {kingz && (
        <KingzScene
          project={kingz}
          totalProjects={PROJECTS.length}
          onOpenCaseStudy={onOpenCaseStudy}
        />
      )}

      {kingz && zyrox && (
        <DitherTransitionBand
          surfaceClassName="bg-[#0B0A08]"
          particleColor="#D4AF37"
          navSurface="dark"
        />
      )}

      {zyrox && (
        <ZyroxScene
          project={zyrox}
          totalProjects={PROJECTS.length}
          onOpenCaseStudy={onOpenCaseStudy}
        />
      )}
    </section>
  );
}

