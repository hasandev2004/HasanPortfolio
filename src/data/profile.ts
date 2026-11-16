export interface SocialLink {
  label: string;
  href: string;
}

export interface ProfileFact {
  label: string;
  value: string;
}

export interface ProfileData {
  name: string;
  headline: string;
  roleSummary: string;
  paragraphs: readonly string[];
  facts: readonly ProfileFact[];
}

export interface SkillGroup {
  order: string;
  category: string;
  scope: string;
  items: readonly string[];
}

export interface ContactConfig {
  /**
   * Set to a confirmed email address (e.g. 'hello@example.com') to enable
   * live mailto: handoff and copy-email actions in the Contact section.
   * Keep null until a verified contact address is provided.
   */
  email: string | null;
  socialLinks: readonly SocialLink[];
  inquiryTopics: readonly string[];
  privacyNotice: string;
}

export const PROFILE: ProfileData = {
  name: 'Muhammad Hasan',
  headline: 'Software built around practical business operations.',
  roleSummary: 'Software Developer & Co-Founder at Tasknix',
  paragraphs: [
    'My focus is web development and business software—turning everyday operational bottlenecks into structured web applications, workflow automation, and dependable internal tools.',
    'Across full-stack web projects, I work with foundational web and server-side technologies including HTML, CSS, JavaScript, PHP, Laravel, jQuery, SQL, and MySQL to build maintainable systems tailored to real workflows.',
    'Alongside my role as Co-Founder at Tasknix, I am actively developing SmartReach AI, an ongoing software project centered on practical workflow automation and business tooling.',
  ],
  facts: [
    {
      label: 'Role',
      value: 'Co-Founder at Tasknix',
    },
    {
      label: 'Focus',
      value: 'Web Applications, Workflow Automation & Business Tools',
    },
    {
      label: 'Ongoing Software',
      value: 'SmartReach AI',
    },
  ],
};

export const SKILL_GROUPS: readonly SkillGroup[] = [
  {
    order: '01',
    category: 'Web & Interface',
    scope: 'Semantic markup, responsive styling, and browser-side behavior.',
    items: ['HTML', 'CSS', 'JavaScript'],
  },
  {
    order: '02',
    category: 'Backend & Frameworks',
    scope: 'Server-rendered applications, routing, and structured business logic.',
    items: ['PHP', 'Laravel'],
  },
  {
    order: '03',
    category: 'Data & Persistence',
    scope: 'Relational schema design, structured queries, and reporting tables.',
    items: ['SQL', 'MySQL'],
  },
  {
    order: '04',
    category: 'Libraries & Workflow',
    scope: 'DOM manipulation support and source version control.',
    items: ['jQuery', 'Git'],
  },
] as const;

export const CONTACT_CONFIG: ContactConfig = {
  email: null,
  socialLinks: [],
  inquiryTopics: [
    'Freelance Project',
    'Full-Time Opportunity',
    'Business Software',
    'General Inquiry',
  ],
  privacyNotice:
    'This form validates your inquiry locally in the browser and prepares an email for your mail client. No form data is transmitted to or stored on a server.',
};
