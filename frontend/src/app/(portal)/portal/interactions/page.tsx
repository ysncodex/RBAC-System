'use client';

import { PortalCustomerDemoNotice } from '@/components/portal/portal-customer-demo-notice';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DUMMY_PORTAL_INTERACTIONS } from '@/data/portal-customer-dummy';
import { useAuthStore, selectSessionReady } from '@/store/auth.store';

export default function PortalInteractionsPage() {
  const user = useAuthStore((s) => s.user);
  const sessionReady = useAuthStore(selectSessionReady);
  const showCustomerDemo = sessionReady && user?.role === 'customer';

  return (
    <div>
      <PageHeader
        title="Interactions"
        description="Personal messages and activity for you. Internal team chatter and operational data stay outside this portal unless you are granted those permissions."
      />

      {!sessionReady ? (
        <div
          className="min-h-[280px] animate-pulse rounded-xl border border-dashed bg-muted/30"
          aria-hidden
        />
      ) : showCustomerDemo ? (
        <>
          <PortalCustomerDemoNotice />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Id</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DUMMY_PORTAL_INTERACTIONS.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-mono text-xs">{i.id}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{i.channel}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[280px] whitespace-normal">{i.summary}</TableCell>
                  <TableCell className="text-muted-foreground">{i.at}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      ) : (
        <EmptyState
          title="No recent interactions"
          description="Updates and messages will appear here. This is a placeholder until messaging is connected."
        />
      )}
    </div>
  );
}
