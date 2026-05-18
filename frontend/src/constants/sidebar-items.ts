import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  ClipboardList,
  BarChart3,
  FileText,
  Settings,
  House,
  Ticket,
  ShoppingBag,
  MessageSquare,
  Target,
} from 'lucide-react';

import { SidebarItem } from '@/types/sidebar';

export const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    title: 'Dashboard',

    href: '/dashboard',

    icon: LayoutDashboard,

    permission: 'dashboard.view',
  },

  {
    title: 'Portal',

    href: '/portal',

    icon: House,

    permission: 'portal.view',
  },

  {
    title: 'Tickets',

    href: '/portal/tickets',

    icon: Ticket,

    permission: 'portal.tickets.view',
  },

  {
    title: 'Orders',

    href: '/portal/orders',

    icon: ShoppingBag,

    permission: 'portal.orders.view',
  },

  {
    title: 'Interactions',

    href: '/portal/interactions',

    icon: MessageSquare,

    permission: 'portal.interactions.view',
  },

  {
    title: 'Users',

    href: '/users',

    icon: Users,

    permission: 'users.view',
  },

  {
    title: 'Permissions',

    href: '/permissions',

    icon: ShieldCheck,

    permission: 'permissions.view',
  },

  {
    title: 'Leads',

    href: '/leads',

    icon: Target,

    permission: 'leads.view',
  },

  {
    title: 'Tasks',

    href: '/tasks',

    icon: ClipboardList,

    permission: 'tasks.view',
  },

  {
    title: 'Reports',

    href: '/reports',

    icon: BarChart3,

    permission: 'reports.view',
  },

  {
    title: 'Audit Logs',

    href: '/audit',

    icon: FileText,

    permission: 'audit.view',
  },

  {
    title: 'Settings',

    href: '/settings',

    icon: Settings,

    permission: 'settings.view',
  },
];
