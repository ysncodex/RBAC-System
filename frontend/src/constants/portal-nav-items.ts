import { SIDEBAR_ITEMS } from '@/constants/sidebar-items';

export const PORTAL_NAV_ITEMS = SIDEBAR_ITEMS.filter(
  (item) => item.href === '/portal' || item.href.startsWith('/portal/')
);
