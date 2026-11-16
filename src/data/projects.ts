export type ProjectVisualType =
  | 'smartreach-workflow'
  | 'karv-editorial'
  | 'kingz-grooming'
  | 'zyrox-fashion';

export type ProjectClassification =
  | 'Owned Software Product'
  | 'Client Business Website'
  | 'Self-Initiated Practice Project';

export type ProjectDeploymentState =
  | 'In Development (Unverified Deployment)'
  | 'Live Website Deployed';

export interface ProjectOutcome {
  label: string;
  detail: string;
}

export interface ProjectVisualDirection {
  tone: 'dark' | 'light';
  accentHex: string;
  disciplineLabel: string;
  locationOrContext: string;
}

export interface ProjectEntry {
  id: string;
  order: string;
  slug: string;
  title: string;
  category: string;
  classification: ProjectClassification;
  shortDescription: string;
  problem: string;
  solution: string;
  builtCapabilities: readonly string[];
  plannedOrUnverified: readonly string[];
  role: string;
  stack: readonly string[];
  status: ProjectDeploymentState;
  isPlaceholder: boolean;
  verifiedOutcomes: readonly ProjectOutcome[];
  liveUrl: string | null;
  repositoryUrl: string | null;
  screenshotPath: string | null;
  coverVisual: ProjectVisualType;
  visualDirection: ProjectVisualDirection;
}

export const PROJECTS: readonly ProjectEntry[] = [
  {
    id: 'smartreach-ai',
    order: '01',
    slug: 'smartreach-ai',
    title: 'SmartReach AI',
    category: 'AI Outreach & Workflow Platform',
    classification: 'Owned Software Product',
    shortDescription:
      'Business discovery, public contact extraction, website auditing, offline lead scoring, AI-assisted email drafting gated by manual approval, and CRM follow-up tracking.',
    problem:
      'Outbound prospecting often requires switching across maps, business websites, spreadsheets, and email tools to locate relevant local businesses, assess their web presence, draft tailored outreach, and track follow-ups.',
    solution:
      'SmartReach AI consolidates these steps into an operator-controlled workflow: discovering local businesses via OpenStreetMap data, extracting publicly listed contact details from official business websites, pairing website audits with offline lead scoring, generating AI-assisted email drafts behind mandatory manual review and user-triggered email-client sending, and organizing CRM activity tracking.',
    builtCapabilities: [
      'Business discovery powered by OpenStreetMap, Overpass API, and Nominatim geocoding.',
      'Public contact extraction parsed from official business websites.',
      'Structured website auditing combined with deterministic offline lead scoring.',
      'AI-assisted email drafting requiring manual operator approval and user-controlled mail-client dispatch.',
      'CRM follow-up tracking and outreach workflow activity management.',
    ],
    plannedOrUnverified: [
      'Currently in active development; a public production deployment and live URL have not yet been verified.',
      'Automated background sending is intentionally excluded in favor of manual approval and user-initiated sending.',
      'Production benchmarks, user metrics, and delivery rates are not yet published.',
    ],
    role: 'Developer & Product Builder',
    stack: [
      'OpenStreetMap',
      'Overpass API',
      'Nominatim',
      'Website Auditing',
      'Lead Scoring',
      'AI Draft Generation',
      'CRM Workflow',
    ],
    status: 'In Development (Unverified Deployment)',
    isPlaceholder: false,
    verifiedOutcomes: [],
    liveUrl: null,
    repositoryUrl: null,
    screenshotPath: null,
    coverVisual: 'smartreach-workflow',
    visualDirection: {
      tone: 'dark',
      accentHex: '#FAF9F6',
      disciplineLabel: 'AI Automation & Workflow Systems',
      locationOrContext: 'Owned Software · In Development',
    },
  },
  {
    id: 'karv-steakhouse',
    order: '02',
    slug: 'karv-steakhouse',
    title: 'Karv Steakhouse',
    category: 'Hospitality & Culinary Web Experience',
    classification: 'Client Business Website',
    shortDescription:
      'Warm editorial restaurant website for KARV Steakhouse in Lower Clapton, London, combining live-fire storytelling, an interactive cut showcase, a searchable 24-item menu, and reservation handoff.',
    problem:
      'A neighbourhood charcoal steakhouse needed a digital presence that translates its warm East London dining room atmosphere, halal Argentine menu, and sharing platters into an intuitive online browsing and reservation flow.',
    solution:
      'Designed and built an editorial hospitality website pairing restrained serif display headlines and warm parchment surfaces with an interactive 3D-tilt ribeye specimen, searchable culinary categories, dietary indicators, gallery vignettes, and a reservation request interface alongside OpenTable and phone booking access.',
    builtCapabilities: [
      'Ten-section editorial narrative spanning philosophy, signature steaks, live oak fire technique, and the Karvester sharing platters.',
      'Interactive menu exploration with live search and category filtering across 24 dishes, steaks, platters, sides, desserts, and drinks.',
      'Interactive 3D-tilt hero dish presentation with Real Steak / 3D Model view toggle and lightbox gallery.',
      'Table reservation request interface paired with external OpenTable booking link, direct telephone line, and Lower Clapton directions.',
    ],
    plannedOrUnverified: [
      'Reservation form handles request collection on the front end alongside external OpenTable and direct telephone booking links.',
      'Restaurant seating metrics, diner volume, and conversion outcomes are not published in this portfolio.',
    ],
    role: 'Web Design & Frontend Development',
    stack: [
      'HTML',
      'CSS',
      'JavaScript',
      'Interactive Menu Filtering',
      'Reservation UI & OpenTable Link',
      'Responsive Editorial Layout',
    ],
    status: 'Live Website Deployed',
    isPlaceholder: false,
    verifiedOutcomes: [],
    liveUrl: 'https://karvsteakhouse.netlify.app/',
    repositoryUrl: null,
    screenshotPath: '/projects/karv-steakhouse.png',
    coverVisual: 'karv-editorial',
    visualDirection: {
      tone: 'light',
      accentHex: '#C5A880',
      disciplineLabel: 'Editorial Hospitality Web',
      locationOrContext: 'Lower Clapton, London N16',
    },
  },
  {
    id: 'kingz-barberz',
    order: '03',
    slug: 'kingz-barberz',
    title: 'Kingz Barberz',
    category: 'Monochrome Grooming Brand Website',
    classification: 'Client Business Website',
    shortDescription:
      'High-contrast obsidian website for KINGZ BARBERZ at Surrey Quays, London, uniting sculptural display typography, a 10-service grooming catalog, and a WhatsApp appointment request flow.',
    problem:
      'A local London barbershop needed a bold, mobile-accessible web presence where visitors can browse grooming services, inspect shop location details, and request an appointment without friction.',
    solution:
      'Built a stark black-and-white visual system pairing oversized condensed display typography and monochrome chrome scissors/crown artwork with a clean 10-service directory, rotating 3D gallery stage, and a structured WhatsApp appointment request builder.',
    builtCapabilities: [
      'High-contrast obsidian art direction featuring floating glass navigation and bold display/serif typographic contrast.',
      'Structured 10-service grooming catalog covering classic cuts, skin fades, taper fades, beard styling, and hot towel shaves.',
      'Structured appointment request form that prepares service, barber preference, preferred date, and contact details for WhatsApp confirmation or direct telephone call.',
      'Location section highlighting Surrey Quays Shopping Centre, London SE16 7LL with direct Google Maps search and click-to-call actions.',
    ],
    plannedOrUnverified: [
      'Explicitly transparent on the live site: live database slot availability, pricing/durations, barber portraits, and opening hours await final business confirmation.',
      'Appointment form initiates a WhatsApp request rather than real-time automated double-booking calendar reservation.',
    ],
    role: 'Web Design & Frontend Development',
    stack: [
      'HTML',
      'CSS',
      'JavaScript',
      'WhatsApp Request Flow',
      'Monochrome 3D Artwork',
      'Responsive UI',
    ],
    status: 'Live Website Deployed',
    isPlaceholder: false,
    verifiedOutcomes: [],
    liveUrl: 'https://kingzbarber.netlify.app/',
    repositoryUrl: null,
    screenshotPath: '/projects/kingz-barberz.png',
    coverVisual: 'kingz-grooming',
    visualDirection: {
      tone: 'dark',
      accentHex: '#FAFAFA',
      disciplineLabel: 'Grooming & Local Business Web',
      locationOrContext: 'Surrey Quays, London SE16',
    },
  },
  {
    id: 'zyrox-wear',
    order: '04',
    slug: 'zyrox-wear',
    title: 'Zyrox Wear',
    category: 'Dark Fashion E-Commerce Concept',
    classification: 'Self-Initiated Practice Project',
    shortDescription:
      'Self-initiated dark apparel storefront concept built for design practice, showcasing obsidian-and-brass typography, category browsing, quick-add product cards, cart counter state, and a customizer showcase.',
    problem:
      'Exploring how fashion-editorial visual hierarchy, interactive product merchandising, and dark luxury aesthetics can coexist inside a fast responsive e-commerce interface.',
    solution:
      'Built an interactive storefront practice concept featuring a brass-on-obsidian geometric canvas, search toggle drawer, marquee strip, browsable category cards, Featured Drops with quick-add cart state, and a Build Your Perfect Outfit customizer section.',
    builtCapabilities: [
      'Editorial dark-luxury UI pairing italic serif display headings with warm brass accents and geometric linework.',
      'Interactive header controls including expandable product search bar, mobile drawer navigation, and live cart item counter.',
      'Featured Drops merchandising grid (Obsidian Tee, Phantom Hoodie, Eclipse Shirt, Void Tee) with quick-add cart interactions.',
      'Interactive garment designer teaser section, category grid (Men, Women, Streetwear, Custom), and newsletter UI.',
    ],
    plannedOrUnverified: [
      'Self-initiated practice and visual exploration project; not a live commercial store or commissioned client engagement.',
      'Catalog numbers, reviews, and checkout flows shown on the concept storefront are placeholder showcase copy rather than real commercial order history.',
    ],
    role: 'Concept Design & Frontend Implementation',
    stack: [
      'HTML',
      'CSS',
      'JavaScript',
      'Interactive Cart State',
      'Search & Mobile Drawer UI',
      'Fashion Editorial Layout',
    ],
    status: 'Live Website Deployed',
    isPlaceholder: false,
    verifiedOutcomes: [],
    liveUrl: 'https://zyroxwear.netlify.app/',
    repositoryUrl: null,
    screenshotPath: '/projects/zyrox-wear.png',
    coverVisual: 'zyrox-fashion',
    visualDirection: {
      tone: 'dark',
      accentHex: '#D4AF37',
      disciplineLabel: 'Fashion Storefront Practice',
      locationOrContext: 'Self-Initiated Concept',
    },
  },
] as const;

export function getProjectBySlug(slug: string): ProjectEntry | undefined {
  return PROJECTS.find((project) => project.slug === slug);
}
