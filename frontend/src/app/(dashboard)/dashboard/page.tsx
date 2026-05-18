'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  Settings,
  Shield,
  Target,
  Users,
} from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { SectionCard } from '@/components/shared/section-card';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore, selectUserPermissions, selectUser } from '@/store/auth.store';

type Shortcut = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  permission: string;
};

const SHORTCUTS: Shortcut[] = [
  {
    title: 'Users',
    description: 'Team directory and account status within your scope.',
    href: '/users',
    icon: Users,
    permission: 'users.view',
  },
  {
    title: 'Permissions',
    description: 'Visual matrix for agent permission overrides (grant ceiling applies).',
    href: '/permissions',
    icon: Shield,
    permission: 'permissions.view',
  },
  {
    title: 'Leads',
    description:
      'Your pipeline for this browser. Visible only when your manager unlocks leads.view.',
    href: '/leads',
    icon: Target,
    permission: 'leads.view',
  },
  {
    title: 'Tasks',
    description:
      'Your task board. Create/edit/delete actions follow the task.* permissions you were given.',
    href: '/tasks',
    icon: ClipboardList,
    permission: 'tasks.view',
  },
  {
    title: 'Reports',
    description: 'Summaries and exports for the data you are allowed to see.',
    href: '/reports',
    icon: BarChart3,
    permission: 'reports.view',
  },
  {
    title: 'Settings',
    description: 'Profile and appearance for this device.',
    href: '/settings',
    icon: Settings,
    permission: 'settings.view',
  },
];

export default function DashboardPage() {
  const permissions = useAuthStore(selectUserPermissions);
  const user = useAuthStore(selectUser);
  const permSet = new Set(permissions);
  const shortcuts = SHORTCUTS.filter((s) => permSet.has(s.permission));
  const isAgent = user?.role === 'agent';

  const pageDescription = isAgent
    ? 'Modules below are unlocked by your manager (role defaults plus any permission overrides on your account).'
    : 'Overview of modules available in your session. Cards below match your permissions.';

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" description={pageDescription} />

      {shortcuts.length === 0 ? (
        <SectionCard title={isAgent ? 'No modules unlocked yet' : 'No modules'}>
          <p className="text-sm text-muted-foreground">
            {isAgent
              ? 'Your manager can grant permission atoms on your user (for example leads.view or tasks.view). Until then, only this home is available.'
              : 'Your role does not include any dashboard shortcuts. Contact an administrator if this is unexpected.'}
          </p>
        </SectionCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shortcuts.map(({ title, description, href, icon: Icon }) => (
            <Card key={href} className="group ring-foreground/5 transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div className="space-y-1.5">
                  <CardTitle className="text-base font-semibold">{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </div>
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <div className="px-4 pb-4">
                <Button variant="secondary" size="sm" className="gap-2" asChild>
                  <Link href={href}>
                    Open
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <SectionCard title="Today">
        <p className="text-sm text-muted-foreground">
          {isAgent
            ? 'Operational data for Leads and Tasks is stored in this browser for your user until a team API is connected. Ask your manager if you need another module.'
            : 'Managers see scope-limited directory data on Users and Reports. Leads and Tasks stay in this browser until you connect a CRM or task API.'}
        </p>
      </SectionCard>
    </div>
  );
}
