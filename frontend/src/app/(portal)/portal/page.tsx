'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import { PageHeader } from '@/components/shared/page-header';
import { SectionCard } from '@/components/shared/section-card';
import { PermissionGate } from '@/components/shared/permission-gate';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore, selectUserPermissions } from '@/store/auth.store';

export default function PortalHomePage() {
  const permissions = useAuthStore(selectUserPermissions);
  const permSet = useMemo(() => new Set(permissions), [permissions]);

  const hasAnyModule =
    permSet.has('portal.tickets.view') ||
    permSet.has('portal.orders.view') ||
    permSet.has('portal.interactions.view');

  return (
    <div className="space-y-8">
      <PageHeader
        title="Welcome"
        description="Your self-service area. Use the sections below for your own tickets, orders, and account activity. Internal staff tools stay hidden unless an administrator grants you those permissions explicitly."
      />

      <SectionCard title="What you can do here">
        <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Tickets</strong> — open items and history for
            support requests tied to you.
          </li>
          <li>
            <strong className="text-foreground">Orders</strong> — purchases and delivery-style
            status for your account.
          </li>
          <li>
            <strong className="text-foreground">Interactions</strong> — messages and updates related
            to you (not company-wide internal operations).
          </li>
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          This portal does not show leads, internal tasks, or the admin directory. Those require
          separate permission atoms on your user.
        </p>
      </SectionCard>

      {!hasAnyModule ? (
        <SectionCard title="Limited access">
          <p className="text-sm text-muted-foreground">
            Your account can open the portal home but does not yet include tickets, orders, or
            interactions. Ask your organization to enable the relevant portal permissions for your
            profile.
          </p>
        </SectionCard>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <PermissionGate permission="portal.tickets.view">
          <Link href="/portal/tickets" className="block">
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle>Tickets</CardTitle>
                <CardDescription>View and track your support requests.</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </PermissionGate>

        <PermissionGate permission="portal.orders.view">
          <Link href="/portal/orders" className="block">
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle>Orders</CardTitle>
                <CardDescription>See your orders and delivery status.</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </PermissionGate>

        <PermissionGate permission="portal.interactions.view">
          <Link href="/portal/interactions" className="block">
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle>Interactions</CardTitle>
                <CardDescription>Messages and updates related to your account.</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </PermissionGate>
      </div>
    </div>
  );
}
