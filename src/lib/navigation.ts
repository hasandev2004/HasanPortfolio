import type {SectionId} from '@/src/data/hero';

export interface SectionNavigationResult {
  found: boolean;
  target: SectionId;
}

export function navigateToSection(
  target: SectionId,
  reducedMotion: boolean,
): SectionNavigationResult {
  if (typeof document === 'undefined') {
    return {found: false, target};
  }

  if (target === 'top') {
    window.scrollTo({
      top: 0,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
    return {found: true, target};
  }

  const element = document.getElementById(target);
  if (!element) {
    return {found: false, target};
  }

  element.scrollIntoView({
    behavior: reducedMotion ? 'auto' : 'smooth',
    block: 'start',
  });

  return {found: true, target};
}
