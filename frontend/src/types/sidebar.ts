import { LucideIcon } from 'lucide-react';

export interface SidebarItem {
  title: string;

  href: string;

  icon: LucideIcon;

  permission: string;

  children?: SidebarItem[];
}
