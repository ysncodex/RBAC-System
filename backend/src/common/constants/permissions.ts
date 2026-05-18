export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard.view',

  USERS_VIEW: 'users.view',
  USERS_VIEW_ALL: 'users.view_all',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',
  USERS_SUSPEND: 'users.suspend',
  USERS_BAN: 'users.ban',
  USERS_REACTIVATE: 'users.reactivate',

  PERMISSIONS_VIEW: 'permissions.view',
  PERMISSIONS_ASSIGN: 'permissions.assign',
  PERMISSIONS_ASSIGN_ROLES: 'permissions.assign_roles',

  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',

  LEADS_VIEW: 'leads.view',

  TASKS_VIEW: 'tasks.view',
  TASKS_CREATE: 'tasks.create',
  TASKS_EDIT: 'tasks.edit',
  TASKS_DELETE: 'tasks.delete',

  AUDIT_VIEW: 'audit.view',

  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit',

  PORTAL_VIEW: 'portal.view',
  PORTAL_TICKETS_VIEW: 'portal.tickets.view',
  PORTAL_ORDERS_VIEW: 'portal.orders.view',
  PORTAL_INTERACTIONS_VIEW: 'portal.interactions.view',
} as const;
