export function hasPermission(userPermissions: string[], requiredPermission?: string) {
  if (!requiredPermission) {
    return true;
  }

  return userPermissions.includes(requiredPermission);
}
