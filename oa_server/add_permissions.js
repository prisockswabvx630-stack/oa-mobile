const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting permission seeding...');
  
  // New permissions to insert if they don't exist
  const newPerms = [
    { parent_id: 4, permission_code: 'business:project', permission_name: '项目管理', permission_type: 'menu', route_path: '/business/project', icon: 'project', sort: 3 },
    { parent_id: 4, permission_code: 'business:performance', permission_name: '绩效管理', permission_type: 'menu', route_path: '/business/performance', icon: 'perf', sort: 4 },
    { parent_id: 4, permission_code: 'business:expense', permission_name: '报销管理', permission_type: 'menu', route_path: '/business/expense', icon: 'expense', sort: 5 },
  ];

  for (const perm of newPerms) {
    const exists = await prisma.sys_permission.findFirst({
      where: { permission_code: perm.permission_code, is_deleted: 0 }
    });
    if (!exists) {
      await prisma.sys_permission.create({
        data: {
          parent_id: BigInt(perm.parent_id),
          permission_code: perm.permission_code,
          permission_name: perm.permission_name,
          permission_type: perm.permission_type,
          route_path: perm.route_path,
          icon: perm.icon,
          sort: perm.sort,
          status: 1
        }
      });
      console.log(`Created permission: ${perm.permission_code}`);
    } else {
      console.log(`Permission ${perm.permission_code} already exists.`);
    }
  }

  // Ensure Admin role (role_id = 1) has all permissions linked
  const adminRole = await prisma.sys_role.findFirst({ where: { id: BigInt(1) } });
  if (adminRole) {
    const allPerms = await prisma.sys_permission.findMany({ where: { is_deleted: 0, status: 1 } });
    await prisma.sys_role_permission.deleteMany({ where: { role_id: BigInt(1) } });
    await prisma.sys_role_permission.createMany({
      data: allPerms.map(p => ({
        role_id: BigInt(1),
        permission_id: p.id
      }))
    });
    console.log('Linked all permissions to Admin role.');
  } else {
    console.log('Admin role not found.');
  }
}

main()
  .catch(err => console.error('Error seeding permissions:', err))
  .finally(() => prisma.$disconnect());
