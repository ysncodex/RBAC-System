import { PrismaClient, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Seed Roles

  const roles = [
    {
      name: 'Admin',
      slug: 'admin',
      description: 'Business Owner / IT Admin - Full system control.',
    },
    {
      name: 'Manager',
      slug: 'manager',
      description:
        'Team Lead / Department Head - Manage their team and agents.',
    },
    {
      name: 'Agent',
      slug: 'agent',
      description: 'Staff / Operator - Works on assigned modules.',
    },
    {
      name: 'Customer',
      slug: 'customer',
      description: 'End Client - Self-service access only.',
    },
  ];

  console.log('Upserting Roles...');
  for (const role of roles) {
    await prisma.role.upsert({
      where: { slug: role.slug },
      update: {
        name: role.name,
        description: role.description,
      },
      create: role,
    });
  }

  // 2. Seed Permissions

  const permissions = [
    { name: 'View Users', slug: 'users.view', module: 'Users' },
    {
      name: 'View all users',
      slug: 'users.view_all',
      module: 'Users',
    },
    { name: 'Create Users', slug: 'users.create', module: 'Users' },
    { name: 'Edit Users', slug: 'users.edit', module: 'Users' },
    { name: 'Delete Users', slug: 'users.delete', module: 'Users' },
    { name: 'Suspend Users', slug: 'users.suspend', module: 'Users' },
    { name: 'Ban Users', slug: 'users.ban', module: 'Users' },
    { name: 'Reactivate Users', slug: 'users.reactivate', module: 'Users' },

    {
      name: 'View Permissions',
      slug: 'permissions.view',
      module: 'Permissions',
    },
    {
      name: 'Assign Permissions',
      slug: 'permissions.assign',
      module: 'Permissions',
    },
    {
      name: 'Assign role template permissions',
      slug: 'permissions.assign_roles',
      module: 'Permissions',
    },

    { name: 'View Reports', slug: 'reports.view', module: 'Reports' },
    { name: 'Export Reports', slug: 'reports.export', module: 'Reports' },

    { name: 'View Audit Logs', slug: 'audit.view', module: 'Audit' },

    { name: 'View Dashboard', slug: 'dashboard.view', module: 'Dashboard' },

    { name: 'View Leads', slug: 'leads.view', module: 'Leads' },

    { name: 'View Tasks', slug: 'tasks.view', module: 'Tasks' },
    { name: 'Create Tasks', slug: 'tasks.create', module: 'Tasks' },
    { name: 'Edit Tasks', slug: 'tasks.edit', module: 'Tasks' },
    { name: 'Delete Tasks', slug: 'tasks.delete', module: 'Tasks' },

    { name: 'View Settings', slug: 'settings.view', module: 'Settings' },
    { name: 'Edit Settings', slug: 'settings.edit', module: 'Settings' },

    { name: 'View Portal', slug: 'portal.view', module: 'Portal' },
    {
      name: 'View Portal Tickets',
      slug: 'portal.tickets.view',
      module: 'Portal',
    },
    {
      name: 'View Portal Orders',
      slug: 'portal.orders.view',
      module: 'Portal',
    },
    {
      name: 'View Portal Interactions',
      slug: 'portal.interactions.view',
      module: 'Portal',
    },
  ];

  console.log('Upserting Permissions...');
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { slug: perm.slug },
      update: {
        name: perm.name,
        module: perm.module,
      },
      create: perm,
    });
  }

  // 3. Assign Permissions to Roles

  console.log('Mapping Role Permissions...');

  const dbRoles = await prisma.role.findMany();
  const dbPerms = await prisma.permission.findMany();

  const getRoleId = (slug: string) => dbRoles.find((r) => r.slug === slug)?.id;

  const getPermIds = (slugs: string[]) =>
    dbPerms.filter((p) => slugs.includes(p.slug)).map((p) => p.id);

  const adminRole = getRoleId('admin');
  const managerRole = getRoleId('manager');
  const agentRole = getRoleId('agent');
  const customerRole = getRoleId('customer');

  if (!adminRole || !managerRole || !agentRole || !customerRole) {
    throw new Error('Roles were not properly seeded.');
  }

  await prisma.rolePermission.deleteMany({});

  const rolePermissionData = [
    ...dbPerms.map((p) => ({ roleId: adminRole, permissionId: p.id })),

    ...getPermIds([
      'dashboard.view',
      'users.view',
      'users.create',
      'users.edit',
      'users.suspend',
      'users.ban',
      'users.reactivate',
      'permissions.view',
      'permissions.assign',
      'leads.view',
      'tasks.view',
      'tasks.create',
      'tasks.edit',
      'tasks.delete',
      'reports.view',
      'reports.export',
      'settings.view',
      'settings.edit',
    ]).map((pId) => ({ roleId: managerRole, permissionId: pId })),

    ...getPermIds(['dashboard.view']).map((pId) => ({
      roleId: agentRole,
      permissionId: pId,
    })),

    ...getPermIds([
      'portal.view',
      'portal.tickets.view',
      'portal.orders.view',
      'portal.interactions.view',
    ]).map((pId) => ({
      roleId: customerRole,
      permissionId: pId,
    })),
  ];

  await prisma.rolePermission.createMany({
    data: rolePermissionData,
  });

  // 4. Seed Default Admin User

  console.log('Seeding Default Admin User...');

  const adminEmail = 'admin@example.com';
  const plainPassword = 'Admin123@';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: hashedPassword,
      roleId: adminRole,
      status: UserStatus.ACTIVE,
    },
    create: {
      name: 'System Administrator',
      email: adminEmail,
      passwordHash: hashedPassword,
      roleId: adminRole,
      status: UserStatus.ACTIVE,
    },
  });

  console.log('✅ Default Admin User seeded successfully.');

  // 5. Demo Manager + agents (scoped hierarchy for local testing)

  const managerEmail = 'manager@example.com';
  const managerPlain = 'Manager123!';
  const managerHash = await bcrypt.hash(managerPlain, 10);

  const managerUser = await prisma.user.upsert({
    where: { email: managerEmail },
    update: {
      name: 'Demo Manager',
      passwordHash: managerHash,
      roleId: managerRole,
      status: UserStatus.ACTIVE,
      managedById: null,
    },
    create: {
      name: 'Demo Manager',
      email: managerEmail,
      passwordHash: managerHash,
      roleId: managerRole,
      status: UserStatus.ACTIVE,
    },
  });

  const agentPlain = 'Agent123!';
  const agentHash = await bcrypt.hash(agentPlain, 10);

  const agent1User = await prisma.user.upsert({
    where: { email: 'agent1@example.com' },
    update: {
      name: 'Sales Agent One',
      passwordHash: agentHash,
      roleId: agentRole,
      status: UserStatus.ACTIVE,
      managedById: managerUser.id,
    },
    create: {
      name: 'Sales Agent One',
      email: 'agent1@example.com',
      passwordHash: agentHash,
      roleId: agentRole,
      status: UserStatus.ACTIVE,
      managedById: managerUser.id,
    },
  });

  // Demo: unlocked agent 1
  const agent1UnlockSlugs = [
    'leads.view',
    'tasks.view',
    'tasks.create',
    'tasks.edit',
    'tasks.delete',
    'reports.view',
    'reports.export',
  ] as const;
  const agent1UnlockIds = dbPerms
    .filter((p) => (agent1UnlockSlugs as readonly string[]).includes(p.slug))
    .map((p) => p.id);
  await prisma.userPermission.deleteMany({ where: { userId: agent1User.id } });
  if (agent1UnlockIds.length > 0) {
    await prisma.userPermission.createMany({
      data: agent1UnlockIds.map((permissionId) => ({
        userId: agent1User.id,
        permissionId,
      })),
      skipDuplicates: true,
    });
  }

  await prisma.user.upsert({
    where: { email: 'agent2@example.com' },
    update: {
      name: 'Sales Agent Two',
      passwordHash: agentHash,
      roleId: agentRole,
      status: UserStatus.ACTIVE,
      managedById: managerUser.id,
    },
    create: {
      name: 'Sales Agent Two',
      email: 'agent2@example.com',
      passwordHash: agentHash,
      roleId: agentRole,
      status: UserStatus.ACTIVE,
      managedById: managerUser.id,
    },
  });

  // 6. Demo customer (portal-only; no staff permissions on role)

  const customerEmail = 'customer@example.com';
  const customerPlain = 'Customer123!';
  const customerHash = await bcrypt.hash(customerPlain, 10);

  await prisma.user.upsert({
    where: { email: customerEmail },
    update: {
      name: 'Demo Customer',
      passwordHash: customerHash,
      roleId: customerRole,
      status: UserStatus.ACTIVE,
      managedById: null,
    },
    create: {
      name: 'Demo Customer',
      email: customerEmail,
      passwordHash: customerHash,
      roleId: customerRole,
      status: UserStatus.ACTIVE,
    },
  });

  console.log('✅ Demo manager (manager@example.com) and team agents seeded.');
  console.log(
    `✅ Demo customer (${customerEmail} / ${customerPlain}) — portal self-service only.`,
  );
  console.log('✅ Enterprise RBAC fully seeded!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
