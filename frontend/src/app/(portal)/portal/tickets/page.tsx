'use client';

import { PortalCustomerDemoNotice } from '@/components/portal/portal-customer-demo-notice';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { ResponsiveTable } from '@/components/shared/responsive-table';
import { Badge } from '@/components/ui/badge';
import { DUMMY_PORTAL_TICKETS } from '@/data/portal-customer-dummy';
import { useAuthStore, selectSessionReady } from '@/store/auth.store';

export default function PortalTicketsPage() {
  const user = useAuthStore((s) => s.user);
  const sessionReady = useAuthStore(selectSessionReady);
  const showCustomerDemo = sessionReady && user?.role === 'customer';

  return (
    <div>
      <PageHeader
        title="Tickets"
        description="Support requests linked to your account (active and recent). Not your company's internal ticket queue."
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
            rows={DUMMY_PORTAL_TICKETS}
            getRowKey={(t) => t.id}
            mobileHeader={(t) => (
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-medium">{t.id}</span>
                <Badge variant="secondary">{t.status}</Badge>
              </div>
            )}
            columns={[
              {
                header: 'Ticket',
                mobileLabel: 'Ticket',
                hideOnMobile: true,
                cell: (t) => <span className="font-mono text-xs">{t.id}</span>,
                mobileValue: (t) => <span className="font-mono text-xs">{t.id}</span>,
              },
              {
                header: 'Subject',
                mobileLabel: 'Subject',
                cell: (t) => t.subject,
                mobileValue: (t) => t.subject,
              },
              {
                header: 'Status',
                mobileLabel: 'Status',
                hideOnMobile: true,
                cell: (t) => <Badge variant="secondary">{t.status}</Badge>,
                mobileValue: (t) => <Badge variant="secondary">{t.status}</Badge>,
              },
              {
                header: 'Updated',
                mobileLabel: 'Updated',
                cell: (t) => <span className="text-muted-foreground">{t.updatedAt}</span>,
                mobileValue: (t) => <span className="text-muted-foreground">{t.updatedAt}</span>,
              },
            ]}
          />
        </>
      ) : (
        <EmptyState
          title="No tickets yet"
          description="When you open a support request, it will appear here. This is a placeholder until ticketing is connected."
        />
      )}
    </div>
  );
}
