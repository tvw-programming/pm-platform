import type { Team, User, Workspace } from '@/types/domain';
import { chartPalette } from '@/app/tokens';

export const workspaces: Workspace[] = [
  { id: 'ws-core', name: 'Helios Product Group', slug: 'helios', plan: 'enterprise', color: chartPalette[0] },
  { id: 'ws-platform', name: 'Platform Engineering', slug: 'platform', plan: 'enterprise', color: chartPalette[1] },
  { id: 'ws-labs', name: 'Innovation Labs', slug: 'labs', plan: 'growth', color: chartPalette[3] },
];

export const DEFAULT_WORKSPACE_ID = workspaces[0]!.id;

function initialsOf(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase();
}

interface UserSeed {
  id: string;
  name: string;
  jobTitle: string;
  department: string;
  role: User['role'];
  teamIds: string[];
  skills: string[];
  availability: User['availability'];
  capacity: number;
  allocated: number;
  location: string;
}

const userSeeds: UserSeed[] = [
  {
    id: 'u-1',
    name: 'Ananya Rao',
    jobTitle: 'Director of Product',
    department: 'Product',
    role: 'owner',
    teamIds: ['t-core', 't-growth'],
    skills: ['Product Strategy', 'Roadmapping', 'Pricing'],
    availability: 'busy',
    capacity: 40,
    allocated: 36,
    location: 'Pune, IN',
  },
  {
    id: 'u-2',
    name: 'Marcus Feld',
    jobTitle: 'Engineering Manager',
    department: 'Engineering',
    role: 'admin',
    teamIds: ['t-core'],
    skills: ['Node.js', 'System Design', 'Mentoring'],
    availability: 'available',
    capacity: 40,
    allocated: 28,
    location: 'Berlin, DE',
  },
  {
    id: 'u-3',
    name: 'Priya Nair',
    jobTitle: 'Senior Product Manager',
    department: 'Product',
    role: 'member',
    teamIds: ['t-growth'],
    skills: ['Discovery', 'Analytics', 'Experimentation'],
    availability: 'busy',
    capacity: 40,
    allocated: 38,
    location: 'Bengaluru, IN',
  },
  {
    id: 'u-4',
    name: 'Daniel Okoro',
    jobTitle: 'Staff Frontend Engineer',
    department: 'Engineering',
    role: 'member',
    teamIds: ['t-core'],
    skills: ['React', 'TypeScript', 'Accessibility', 'Design Systems'],
    availability: 'overloaded',
    capacity: 40,
    allocated: 47,
    location: 'Lagos, NG',
  },
  {
    id: 'u-5',
    name: 'Sofia Marchetti',
    jobTitle: 'Lead Product Designer',
    department: 'Design',
    role: 'member',
    teamIds: ['t-design'],
    skills: ['Interaction Design', 'Prototyping', 'Design Research'],
    availability: 'available',
    capacity: 40,
    allocated: 30,
    location: 'Milan, IT',
  },
  {
    id: 'u-6',
    name: 'Chen Wei',
    jobTitle: 'Backend Engineer',
    department: 'Engineering',
    role: 'member',
    teamIds: ['t-platform'],
    skills: ['Go', 'Postgres', 'Kafka'],
    availability: 'busy',
    capacity: 40,
    allocated: 39,
    location: 'Singapore, SG',
  },
  {
    id: 'u-7',
    name: 'Isabel Duarte',
    jobTitle: 'QA Lead',
    department: 'Quality',
    role: 'member',
    teamIds: ['t-quality'],
    skills: ['Test Automation', 'Playwright', 'Release Readiness'],
    availability: 'available',
    capacity: 40,
    allocated: 24,
    location: 'Lisbon, PT',
  },
  {
    id: 'u-8',
    name: 'Tom Halvorsen',
    jobTitle: 'Program Manager',
    department: 'Operations',
    role: 'admin',
    teamIds: ['t-core', 't-platform'],
    skills: ['Delivery Planning', 'Risk Management', 'Reporting'],
    availability: 'busy',
    capacity: 40,
    allocated: 35,
    location: 'Oslo, NO',
  },
  {
    id: 'u-9',
    name: 'Leila Haddad',
    jobTitle: 'Data Analyst',
    department: 'Data',
    role: 'member',
    teamIds: ['t-growth'],
    skills: ['SQL', 'dbt', 'Dashboarding'],
    availability: 'available',
    capacity: 40,
    allocated: 22,
    location: 'Dubai, AE',
  },
  {
    id: 'u-10',
    name: 'Ravi Deshmukh',
    jobTitle: 'Site Reliability Engineer',
    department: 'Engineering',
    role: 'member',
    teamIds: ['t-platform'],
    skills: ['Kubernetes', 'Terraform', 'Observability'],
    availability: 'on_leave',
    capacity: 40,
    allocated: 0,
    location: 'Mumbai, IN',
  },
  {
    id: 'u-11',
    name: 'Grace Lindqvist',
    jobTitle: 'Product Designer',
    department: 'Design',
    role: 'member',
    teamIds: ['t-design'],
    skills: ['Visual Design', 'Design Systems', 'Motion'],
    availability: 'busy',
    capacity: 32,
    allocated: 30,
    location: 'Stockholm, SE',
  },
  {
    id: 'u-12',
    name: 'Victor Amaral',
    jobTitle: 'QA Engineer',
    department: 'Quality',
    role: 'member',
    teamIds: ['t-quality'],
    skills: ['Manual QA', 'API Testing', 'Regression Suites'],
    availability: 'available',
    capacity: 40,
    allocated: 26,
    location: 'São Paulo, BR',
  },
  {
    id: 'u-13',
    name: 'Hana Kobayashi',
    jobTitle: 'Head of Business Operations',
    department: 'Business',
    role: 'viewer',
    teamIds: [],
    skills: ['Forecasting', 'Stakeholder Reporting'],
    availability: 'available',
    capacity: 40,
    allocated: 12,
    location: 'Tokyo, JP',
  },
  {
    id: 'u-14',
    name: 'Omar Siddiqui',
    jobTitle: 'Frontend Engineer',
    department: 'Engineering',
    role: 'member',
    teamIds: ['t-core'],
    skills: ['React', 'Testing Library', 'Performance'],
    availability: 'busy',
    capacity: 40,
    allocated: 37,
    location: 'Karachi, PK',
  },
];

export const users: User[] = userSeeds.map((seed, index) => ({
  id: seed.id,
  name: seed.name,
  email: `${seed.name.toLowerCase().replace(/[^a-z]+/g, '.')}@meridian.example`,
  avatarColor: chartPalette[index % chartPalette.length]!,
  initials: initialsOf(seed.name),
  jobTitle: seed.jobTitle,
  department: seed.department,
  role: seed.role,
  teamIds: seed.teamIds,
  skills: seed.skills,
  availability: seed.availability,
  capacityHoursPerWeek: seed.capacity,
  allocatedHoursPerWeek: seed.allocated,
  location: seed.location,
}));

export const CURRENT_USER_ID = 'u-3';

export const teams: Team[] = [
  {
    id: 't-core',
    name: 'Core Experience',
    key: 'CORE',
    description: 'Owns the primary workspace surfaces, navigation and task management.',
    leadId: 'u-2',
    memberIds: ['u-2', 'u-4', 'u-8', 'u-14'],
    department: 'Engineering',
    color: chartPalette[0]!,
  },
  {
    id: 't-platform',
    name: 'Platform & Reliability',
    key: 'PLAT',
    description: 'Shared services, data pipelines, infrastructure and uptime.',
    leadId: 'u-6',
    memberIds: ['u-6', 'u-10', 'u-8'],
    department: 'Engineering',
    color: chartPalette[1]!,
  },
  {
    id: 't-design',
    name: 'Design Studio',
    key: 'DSGN',
    description: 'Product design, design system stewardship and research.',
    leadId: 'u-5',
    memberIds: ['u-5', 'u-11'],
    department: 'Design',
    color: chartPalette[2]!,
  },
  {
    id: 't-quality',
    name: 'Quality Engineering',
    key: 'QUAL',
    description: 'Automation coverage, release readiness and regression strategy.',
    leadId: 'u-7',
    memberIds: ['u-7', 'u-12'],
    department: 'Quality',
    color: chartPalette[3]!,
  },
  {
    id: 't-growth',
    name: 'Growth & Insights',
    key: 'GRWT',
    description: 'Activation, onboarding experiments and product analytics.',
    leadId: 'u-3',
    memberIds: ['u-3', 'u-1', 'u-9'],
    department: 'Product',
    color: chartPalette[4]!,
  },
];
