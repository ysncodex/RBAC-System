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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Placed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DUMMY_PORTAL_ORDERS.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.id}</TableCell>
                  <TableCell>{o.reference}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{o.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{o.placedAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
