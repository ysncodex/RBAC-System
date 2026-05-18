'use client';

import { PortalCustomerDemoNotice } from '@/components/portal/portal-customer-demo-notice';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { ResponsiveTable } from '@/components/shared/responsive-table';
import { Badge } from '@/components/ui/badge';
import { DUMMY_PORTAL_ORDERS } from '@/data/portal-customer-dummy';
import { useAuthStore, selectSessionReady } from '@/store/auth.store';

export default function PortalOrdersPage() {
  const user = useAuthStore((s) => s.user);
  const sessionReady = useAuthStore(selectSessionReady);
  const showCustomerDemo = sessionReady && user?.role === 'customer';

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Your purchases and order history for this account only—not full business order management."
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
            rows={DUMMY_PORTAL_ORDERS}
            getRowKey={(o) => o.id}
            mobileHeader={(o) => (
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-medium">{o.id}</span>
                <Badge variant="secondary">{o.status}</Badge>
              </div>
            )}
            columns={[
              {
                header: 'Order',
                mobileLabel: 'Order',
                hideOnMobile: true,
                cell: (o) => <span className="font-mono text-xs">{o.id}</span>,
                mobileValue: (o) => <span className="font-mono text-xs">{o.id}</span>,
              },
              {
                header: 'Reference',
                mobileLabel: 'Reference',
                cell: (o) => o.reference,
                mobileValue: (o) => o.reference,
              },
              {
                header: 'Status',
                mobileLabel: 'Status',
                hideOnMobile: true,
                cell: (o) => <Badge variant="secondary">{o.status}</Badge>,
                mobileValue: (o) => <Badge variant="secondary">{o.status}</Badge>,
              },
              {
                header: 'Placed',
                mobileLabel: 'Placed',
                cell: (o) => <span className="text-muted-foreground">{o.placedAt}</span>,
                mobileValue: (o) => <span className="text-muted-foreground">{o.placedAt}</span>,
              },
            ]}
          />
        </>
      ) : (
        <EmptyState
          title="No orders to show"
          description="Placed orders will show up here. This is a placeholder until order data is connected."
        />
      )}
    </div>
  );
}
