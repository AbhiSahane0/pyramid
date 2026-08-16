import { Priority } from '@prisma/client';
import { buildAvatarUrl } from '../common/avatar';

/**
 * Demo content mirroring the Figma design. Seeded once globally (members,
 * labels) and per user on first login (projects, tasks) so a fresh account
 * immediately looks like the design.
 */

/** The design's personas are all one style; real accounts get a varied one. */
const avatar = (seed: string): string => buildAvatarUrl('adventurer', seed);

export interface DemoMember {
  key: string;
  name: string;
  email: string;
  title: string;
  avatarUrl: string | null;
}

/** Assignable workspace personas from the design. `avatarUrl: null` renders initials (e.g. "CN"). */
export const DEMO_MEMBERS: DemoMember[] = [
  {
    key: 'admin',
    name: 'Admin',
    email: 'admin@demo.pyramid.local',
    title: 'Administrator',
    avatarUrl: avatar('Admin'),
  },
  {
    key: 'designer',
    name: 'Designer',
    email: 'designer@demo.pyramid.local',
    title: 'Product Designer',
    avatarUrl: avatar('Designer'),
  },
  {
    key: 'qa',
    name: 'QA Team',
    email: 'qa@demo.pyramid.local',
    title: 'Quality Assurance',
    avatarUrl: avatar('QA'),
  },
  {
    key: 'security',
    name: 'Security',
    email: 'security@demo.pyramid.local',
    title: 'Security Engineer',
    avatarUrl: avatar('Security'),
  },
  {
    key: 'devteam',
    name: 'Dev Team',
    email: 'devteam@demo.pyramid.local',
    title: 'Development',
    avatarUrl: avatar('DevTeam'),
  },
  {
    key: 'product',
    name: 'Product Team',
    email: 'product@demo.pyramid.local',
    title: 'Product',
    avatarUrl: avatar('Product'),
  },
  {
    key: 'engineering',
    name: 'Engineering',
    email: 'engineering@demo.pyramid.local',
    title: 'Engineering',
    avatarUrl: avatar('Engineering'),
  },
  {
    key: 'ankit',
    name: 'Ankit Dutta',
    email: 'ankit@demo.pyramid.local',
    title: 'Developer',
    avatarUrl: avatar('Ankit'),
  },
  {
    key: 'cn',
    name: 'Charlie Nguyen',
    email: 'charlie@demo.pyramid.local',
    title: 'Engineer',
    avatarUrl: null,
  },
];

export const DEMO_LABELS = [
  'Research',
  'Design',
  'Development',
  'Testing',
  'Deployment',
  'Review',
  'Updated',
  'Passed',
  'Audit',
  'Scheduled',
  'Optimization',
] as const;

interface DemoSubtask {
  title: string;
  priority: Priority;
  memberKey?: string;
  dueDate: string;
}

export interface DemoTask {
  title: string;
  description?: string;
  /** Column name in the default board (see DEFAULT_COLUMNS). */
  column: string;
  priority: Priority;
  dueDate?: string;
  memberKeys: string[];
  labels: string[];
  reporterKey?: string;
  projectName?: string;
  subtasks?: DemoSubtask[];
  comment?: { authorKey: string; body: string };
}

export interface DemoProject {
  name: string;
  priority: Priority;
  leadKey?: string;
  dueDate: string;
}

export const DEMO_PROJECTS: DemoProject[] = [
  {
    name: 'Design Homepage',
    priority: Priority.HIGH,
    leadKey: 'admin',
    dueDate: '2026-09-12',
  },
  {
    name: 'Develop Login Feature',
    priority: Priority.LOW,
    leadKey: 'cn',
    dueDate: '2026-09-15',
  },
  {
    name: 'Test Payment Gateway',
    priority: Priority.MEDIUM,
    dueDate: '2026-09-18',
  },
];

export const DEMO_TASKS: DemoTask[] = [
  {
    title: 'Write API Documentation',
    description:
      'Create clear and detailed API documentation to guide developers in using the inventory and sales metrics features effectively.',
    column: 'To Do',
    priority: Priority.HIGH,
    dueDate: '2026-07-29',
    memberKeys: ['admin'],
    labels: ['Research', 'Design', 'Development', 'Testing', 'Deployment'],
    reporterKey: 'designer',
    projectName: 'Design Homepage',
    subtasks: [
      {
        title: 'Subtask 1',
        priority: Priority.HIGH,
        memberKey: 'admin',
        dueDate: '2026-09-12',
      },
      {
        title: 'Subtask 2',
        priority: Priority.LOW,
        memberKey: 'cn',
        dueDate: '2026-09-15',
      },
      { title: 'Subtask 3', priority: Priority.MEDIUM, dueDate: '2026-09-18' },
    ],
    comment: {
      authorKey: 'ankit',
      body: "Looks good — let's include example requests for each endpoint.",
    },
  },
  {
    title: 'Implement Search Function',
    column: 'To Do',
    priority: Priority.MEDIUM,
    dueDate: '2026-07-29',
    memberKeys: ['admin'],
    labels: ['Development', 'Deployment'],
    projectName: 'Design Homepage',
  },
  {
    title: 'Deploy to Production',
    column: 'To Do',
    priority: Priority.URGENT,
    dueDate: '2026-07-29',
    memberKeys: ['admin'],
    labels: ['Deployment'],
    projectName: 'Develop Login Feature',
  },
  {
    title: 'Code Review Completed',
    column: 'Doing',
    priority: Priority.MEDIUM,
    dueDate: '2026-07-29',
    memberKeys: ['admin'],
    labels: ['Development', 'Review'],
    projectName: 'Develop Login Feature',
  },
  {
    title: 'Design Mockups Finalized',
    column: 'Doing',
    priority: Priority.HIGH,
    dueDate: '2026-07-29',
    memberKeys: ['admin'],
    labels: ['Design', 'Review'],
    projectName: 'Design Homepage',
  },
  {
    title: 'Feature Testing Passed',
    column: 'Completed',
    priority: Priority.MEDIUM,
    dueDate: '2026-07-30',
    memberKeys: ['qa'],
    labels: ['Testing', 'Passed'],
    projectName: 'Test Payment Gateway',
  },
  {
    title: 'UI Design Updated',
    column: 'Completed',
    priority: Priority.LOW,
    dueDate: '2026-07-31',
    memberKeys: ['designer'],
    labels: ['Design', 'Updated'],
    projectName: 'Design Homepage',
  },
  {
    title: 'Security Audit Scheduled',
    column: 'Completed',
    priority: Priority.HIGH,
    dueDate: '2026-08-01',
    memberKeys: ['security'],
    labels: ['Audit', 'Scheduled'],
    projectName: 'Test Payment Gateway',
  },
  {
    title: 'UI Review Session',
    column: 'On Hold',
    priority: Priority.MEDIUM,
    memberKeys: ['designer'],
    labels: ['Review', 'Design'],
    projectName: 'Design Homepage',
  },
  {
    title: 'Backend Refactor',
    column: 'On Hold',
    priority: Priority.HIGH,
    memberKeys: ['devteam'],
    labels: ['Development'],
    projectName: 'Develop Login Feature',
  },
  {
    title: 'User Feedback Analysis',
    column: 'On Hold',
    priority: Priority.LOW,
    memberKeys: ['product'],
    labels: ['Research'],
    projectName: 'Test Payment Gateway',
  },
  {
    title: 'Performance Optimization',
    column: 'On Hold',
    priority: Priority.MEDIUM,
    memberKeys: ['engineering'],
    labels: ['Optimization'],
    projectName: 'Develop Login Feature',
  },
];
