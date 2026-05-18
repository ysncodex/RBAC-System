export interface UserPermissionInclude {
  permission: { slug: string };
}

export interface RoleWithPermissions {
  rolePermissions: UserPermissionInclude[];
}

export interface UserWithResolvedPermissions {
  role: RoleWithPermissions;
  userPermissions: UserPermissionInclude[];
}

export function resolvePermissions(
  user: UserWithResolvedPermissions,
): string[] {
  const rolePermissions = user.role.rolePermissions.map(
    (rp) => rp.permission.slug,
  );

  const userPermissions = user.userPermissions.map((up) => up.permission.slug);

  return [...new Set([...rolePermissions, ...userPermissions])];
}
