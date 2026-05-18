-- New permission atoms for scoped vs full user directory and role-template editing.
INSERT INTO "permissions" ("id", "name", "slug", "module", "description", "createdAt", "updatedAt")
SELECT 'cmhb_perm_users_view_all_01', 'View all users', 'users.view_all', 'Users', NULL, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "permissions" WHERE "slug" = 'users.view_all');

INSERT INTO "permissions" ("id", "name", "slug", "module", "description", "createdAt", "updatedAt")
SELECT 'cmhb_perm_assign_roles_001', 'Assign role template permissions', 'permissions.assign_roles', 'Permissions', NULL, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "permissions" WHERE "slug" = 'permissions.assign_roles');
