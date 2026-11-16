export type SectionId = 'top' | 'projects' | 'about' | 'skills' | 'contact';

export interface NavItem {
  label: string;
  target: SectionId;
  href: `#${SectionId}`;
}

export const BRAND_NAME = 'MUHAMMAD HASAN' as const;

export const NAV_ITEMS: readonly NavItem[] = [
  {label: 'Projects', target: 'projects', href: '#projects'},
  {label: 'About', target: 'about', href: '#about'},
  {label: 'Skills', target: 'skills', href: '#skills'},
  {label: 'Contact', target: 'contact', href: '#contact'},
] as const;

export const NAV_CTA: NavItem = {
  label: 'Start a Project',
  target: 'contact',
  href: '#contact',
};

export interface HeroCopy {
  eyebrow: string;
  headline: string;
  supportingText: string;
  primaryCta: {
    label: string;
    target: SectionId;
    href: `#${SectionId}`;
  };
  secondaryCta: {
    label: string;
    target: SectionId;
    href: `#${SectionId}`;
  };
  visualStageLabel: string;
}

export const HERO_COPY: HeroCopy = {
  eyebrow: 'INDEPENDENT DEVELOPER · DIGITAL PROBLEM SOLVER',
  headline: 'I turn complex ideas into digital experiences.',
  supportingText:
    'I build web applications, business tools, and automation solutions that help turn everyday problems into practical software.',
  primaryCta: {
    label: 'Explore My Work',
    target: 'projects',
    href: '#projects',
  },
  secondaryCta: {
    label: "Let's Talk",
    target: 'contact',
    href: '#contact',
  },
  visualStageLabel:
    'Interactive digital architecture diagram illustrating connected software systems and SmartReach AI workflow',
};
