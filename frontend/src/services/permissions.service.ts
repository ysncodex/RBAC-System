import { api } from './api';

import type { RoleBrief } from '@/types/role';

export async function getPermissions() {
  const response = await api.get('/permissions');

  return response.data;
}

export async function getRoles(): Promise<RoleBrief[]> {
  const response = await api.get('/permissions/roles');

  return response.data;
}

export async function getRolePermissionSlugs(
  roleId: string,
): Promise<{ permissionSlugs: string[] }> {
  const response = await api.get(`/permissions/roles/${roleId}`);

  return response.data;
}

export async function assignUserPermissions(userId: string, permissions: string[]) {
  const response = await api.patch(`/permissions/users/${userId}`, {
    permissions,
  });

  return response.data;
}

export async function assignRolePermissions(roleId: string, permissions: string[]) {
  const response = await api.patch(`/permissions/roles/${roleId}`, {
    permissions,
  });

  return response.data;
}
