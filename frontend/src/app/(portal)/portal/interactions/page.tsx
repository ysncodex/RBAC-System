'use client';

import { PortalCustomerDemoNotice } from '@/components/portal/portal-customer-demo-notice';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { ResponsiveTable } from '@/components/shared/responsive-table';
import { Badge } from '@/components/ui/badge';
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
          <ResponsiveTable
            rows={DUMMY_PORTAL_INTERACTIONS}
            getRowKey={(i) => i.id}
            mobileHeader={(i) => (
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-medium">{i.id}</span>
                <Badge variant="outline">{i.channel}</Badge>
              </div>
            )}
            columns={[
              {
                header: 'Id',
                mobileLabel: 'Id',
                hideOnMobile: true,
                cell: (i) => <span className="font-mono text-xs">{i.id}</span>,
                mobileValue: (i) => <span className="font-mono text-xs">{i.id}</span>,
              },
              {
                header: 'Channel',
                mobileLabel: 'Channel',
                hideOnMobile: true,
                cell: (i) => <Badge variant="outline">{i.channel}</Badge>,
                mobileValue: (i) => <Badge variant="outline">{i.channel}</Badge>,
              },
              {
                header: 'Summary',
                mobileLabel: 'Summary',
                cell: (i) => <span className="max-w-[280px] whitespace-normal">{i.summary}</span>,
                mobileValue: (i) => i.summary,
              },
              {
                header: 'When',
                mobileLabel: 'When',
                cell: (i) => <span className="text-muted-foreground">{i.at}</span>,
                mobileValue: (i) => <span className="text-muted-foreground">{i.at}</span>,
              },
            ]}
          />
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
