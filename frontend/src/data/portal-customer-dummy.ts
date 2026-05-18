export interface DummyPortalTicket {
  id: string;
  subject: string;
  status: string;
  updatedAt: string;
}

export interface DummyPortalOrder {
  id: string;
  reference: string;
  status: string;
  placedAt: string;
}

export interface DummyPortalInteraction {
  id: string;
  channel: string;
  summary: string;
  at: string;
}

export const DUMMY_PORTAL_TICKETS: DummyPortalTicket[] = [
  {
    id: 'TKT-10021',
    subject: 'Billing — invoice PDF',
    status: 'Awaiting your reply',
    updatedAt: '2026-05-12',
  },
  {
    id: 'TKT-09987',
    subject: 'Product return (RMA)',
    status: 'Closed',
    updatedAt: '2026-04-28',
  },
  {
    id: 'TKT-09912',
    subject: 'Account access from new device',
    status: 'In progress',
    updatedAt: '2026-05-16',
  },
];

export const DUMMY_PORTAL_ORDERS: DummyPortalOrder[] = [
  {
    id: 'ORD-5541',
    reference: 'Starter kit — annual',
    status: 'Shipped',
    placedAt: '2026-05-01',
  },
  {
    id: 'ORD-5488',
    reference: 'Add-on module',
    status: 'Processing',
    placedAt: '2026-05-14',
  },
  {
    id: 'ORD-5402',
    reference: 'Renewal',
    status: 'Delivered',
    placedAt: '2026-03-22',
  },
];

export const DUMMY_PORTAL_INTERACTIONS: DummyPortalInteraction[] = [
  {
    id: 'INT-8821',
    channel: 'Email',
    summary: 'We sent your order confirmation and tracking link.',
    at: '2026-05-14 09:12',
  },
  {
    id: 'INT-8799',
    channel: 'Portal',
    summary: 'You updated notification preferences.',
    at: '2026-05-10 16:40',
  },
  {
    id: 'INT-8744',
    channel: 'SMS',
    summary: 'Delivery reminder for order ORD-5541.',
    at: '2026-05-03 11:05',
  },
];
