// Sloe Laboratory — Demo catalog
// Six genericized OS demos sourced from SLOE Labs spec work.
// Each demo has: id, name, industry, tagline, description, modules, and featured flag.

export interface Demo {
  id: string;
  name: string;
  industry: string;
  industrySlug: string;
  category: 'Sports' | 'Real Estate' | 'Design' | 'Finance' | 'Trade' | 'Academy';
  tagline: string;
  description: string;
  modules: string[];
  vocabulary: {
    record: string;
    stages: string[];
    otherSide: string;
  };
  featured?: boolean;
  heroGradient: string; // CSS gradient for the hero card
}

export const DEMOS: Demo[] = [
  {
    id: 'football-agency-os',
    name: 'Football Agency OS',
    industry: 'Football player representation',
    industrySlug: 'football-agency',
    category: 'Sports',
    tagline: 'Player pipelines, club matching, and deal tracking — built for the agency business.',
    description: 'A complete operating system for football agencies managing player transfers, sponsorships, and trials. Track every player moving through your pipeline, match them to clubs by position and budget, and draft outreach with an AI assistant that knows every relationship in your network.',
    modules: ['pipeline', 'crm', 'matching', 'ai_assistant', 'documents', 'dashboard'],
    vocabulary: {
      record: 'players',
      stages: ['Prospecting', 'Qualified', 'Trials', 'Negotiating', 'Closed'],
      otherSide: 'clubs',
    },
    featured: true,
    heroGradient: 'linear-gradient(135deg, #059669 0%, #065f46 100%)',
  },
  {
    id: 'real-estate-os',
    name: 'Real Estate OS',
    industry: 'Brokerage & property operations',
    industrySlug: 'real-estate',
    category: 'Real Estate',
    tagline: 'Listings, leads, viewings, commissions — in one regulatory-native workspace.',
    description: 'Built for brokerages and developers operating in regulated markets. Listings pipeline, lead qualification, viewing scheduler, commission tracking, and document generation that respects local regulatory structure (OA governance, RERA compliance, bilingual output).',
    modules: ['pipeline', 'crm', 'intake', 'documents', 'ai_assistant', 'dashboard', 'localization'],
    vocabulary: {
      record: 'properties',
      stages: ['New', 'Listed', 'Viewing', 'Under Offer', 'Closed'],
      otherSide: 'buyers',
    },
    featured: true,
    heroGradient: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
  },
  {
    id: 'academy-intelligence-os',
    name: 'Academy Intelligence OS',
    industry: 'Football academy player development',
    industrySlug: 'academy',
    category: 'Academy',
    tagline: 'Describe, predict, act — player development across match, individual, and collective lenses.',
    description: 'For football academies running serious player development programs. Track every youth player\'s progression, predict who\'s ready for the next level, and produce scout-ready reports in English or Spanish. Built around the three-lens model: match performance, individual growth, collective dynamics.',
    modules: ['pipeline', 'crm', 'analytics', 'documents', 'ai_assistant', 'dashboard', 'localization'],
    vocabulary: {
      record: 'players',
      stages: ['U14', 'U16', 'U18', 'U21', 'First Team'],
      otherSide: 'staff',
    },
    heroGradient: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
  },
  {
    id: 'luxury-design-os',
    name: 'Luxury Design OS',
    industry: 'Interior design & bespoke services',
    industrySlug: 'design',
    category: 'Design',
    tagline: 'Concierge-led client intake with mood boards, Style DNA, and briefing dossiers.',
    description: 'For luxury design firms handling high-touch client relationships. An AI concierge qualifies new inquiries, extracts their Style DNA from inspiration images, generates mood board directions, and produces a full design brief ready for the project kickoff.',
    modules: ['intake', 'crm', 'documents', 'ai_assistant', 'dashboard'],
    vocabulary: {
      record: 'clients',
      stages: ['Inquiry', 'Qualified', 'Briefing', 'Proposal', 'Active Project'],
      otherSide: 'vendors',
    },
    featured: true,
    heroGradient: 'linear-gradient(135deg, #b45309 0%, #78350f 100%)',
  },
  {
    id: 'pe-dealflow-os',
    name: 'PE Dealflow OS',
    industry: 'Private equity operations',
    industrySlug: 'pe',
    category: 'Finance',
    tagline: 'Deal pipeline, DD workspace, and portfolio intelligence for boutique PE firms.',
    description: 'Purpose-built for boutique private equity firms. AI-scored deal pipeline across sourcing, qualified, in DD, and closed. Due diligence workspace that organizes every data room, memo, and call note. Portfolio dashboard that surfaces performance signals across the book.',
    modules: ['pipeline', 'crm', 'documents', 'analytics', 'ai_assistant', 'dashboard'],
    vocabulary: {
      record: 'deals',
      stages: ['Sourced', 'Qualified', 'In DD', 'IC Review', 'Closed'],
      otherSide: 'sponsors',
    },
    heroGradient: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
  },
  {
    id: 'trade-docs-os',
    name: 'Trade Docs OS',
    industry: 'Cross-border trade documentation',
    industrySlug: 'trade',
    category: 'Trade',
    tagline: 'Auto-generated commercial invoices, packing lists, USMCA certs — bilingual, border-ready.',
    description: 'Built for exporters shipping across borders. Feed the system your order details — it auto-generates the commercial invoice, packing list, certificate of origin, and bill of lading with all calculations, HTS codes, and SDS references pre-filled. Bilingual output. No more manual paperwork.',
    modules: ['pipeline', 'documents', 'ai_assistant', 'dashboard', 'localization'],
    vocabulary: {
      record: 'shipments',
      stages: ['Order', 'Docs Ready', 'In Transit', 'Border', 'Delivered'],
      otherSide: 'customers',
    },
    heroGradient: 'linear-gradient(135deg, #0891b2 0%, #164e63 100%)',
  },
];

export const CATEGORIES = ['Featured', 'All', 'Sports', 'Real Estate', 'Design', 'Finance', 'Trade', 'Academy'] as const;
export type Category = typeof CATEGORIES[number];

export function getDemosByCategory(category: Category): Demo[] {
  if (category === 'All') return DEMOS;
  if (category === 'Featured') return DEMOS.filter(d => d.featured);
  return DEMOS.filter(d => d.category === category);
}

export function getDemoById(id: string): Demo | undefined {
  return DEMOS.find(d => d.id === id);
}
