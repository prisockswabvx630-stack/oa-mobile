const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding default role permissions...');

  const rolesData = {
    'ROLE_USER': [
      'office',
      'office:attendance',
      'office:task',
      'office:schedule',
      'collaboration',
      'collaboration:document'
    ],
    'ROLE_MANAGER': [
      'dashboard',
      'office',
      'office:attendance',
      'office:approval',
      'office:process',
      'office:meeting',
      'office:task',
      'office:schedule',
      'business',
      'business:project',
      'business:performance',
      'collaboration',
      'collaboration:handover',
      'collaboration:announcement',
      'collaboration:document'
    ],
    'ROLE_HR': [
      'dashboard',
      'org',
      'org:user',
      'org:personnel',
      'office',
      'office:attendance',
      'office:approval',
      'office:task',
      'office:schedule',
      'business',
      'business:salary',
      'business:asset',
      'business:expense',
      'collaboration',
      'collaboration:announcement',
      'collaboration:document'
    ]
  };

  for (const [roleCode, permCodes] of Object.entries(rolesData)) {
    const role = await prisma.sys_role.findFirst({ where: { role_code: roleCode, is_deleted: 0 } });
    if (!role) {
      console.log(`Role ${roleCode} not found.`);
      continue;
    }

    // Query permission ids
    const perms = await prisma.sys_permission.findMany({
      where: {
        permission_code: { in: permCodes },
        is_deleted: 0,
        status: 1
      }
    });

    // Delete existing
    await prisma.sys_role_permission.deleteMany({ where: { role_id: role.id } });

    // Insert new
    if (perms.length > 0) {
      await prisma.sys_role_permission.createMany({
        data: perms.map(p => ({
          role_id: role.id,
          permission_id: p.id
        }))
      });
      console.log(`Seeded ${perms.length} permissions for role ${roleCode}`);
    }
  }
  console.log('Role permissions seeding finished.');
}

main()
  .catch(err => console.error('Error seeding role permissions:', err))
  .finally(() => prisma.$disconnect());
