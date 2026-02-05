import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const IS_DEV = process.env.NODE_ENV !== 'production';
const FORCE_SEED = process.env.FORCE_SEED === 'true';

async function isFirstStartup() {
  try {
    const userCount = await prisma.user.count();
    return userCount === 0;
  } catch (error) {
    return true;
  }
}

async function seedDefaultRoles() {
  const defaultRoles = [
    { name: 'Admin' },
    { name: 'User' },
    { name: 'Reviewer' }
  ];

  for (const role of defaultRoles) {
    const existingRole = await prisma.role.findUnique({
      where: { name: role.name }
    });
    
    if (!existingRole) {
      await prisma.role.create({ data: role });
      console.log(`✅ Role created: ${role.name}`);
    }
  }
}

async function seedDefaultAccesRights() {
  const defaultRights = [
    { name: 'CAN_MANAGE_USER' },
    { name: 'CAN_REVIEW_ANNALE' }
  ];

  // @ts-ignore - Prisma models
  for (const right of defaultRights) {
    const existingRight = await prisma.accesRight.findUnique({
      where: { name: right.name }
    });
    
    if (!existingRight) {
      // @ts-ignore - Prisma models
      await prisma.accesRight.create({ data: right });
      console.log(`✅ AccesRight created: ${right.name}`);
    }
  }
}

async function seedAdminUser() {
  const existingAdmin = await prisma.user.findUnique({
    where: { username: 'admin' }
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin', 10);
    
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword
      }
    });
    
    const adminRole = await prisma.role.findUnique({
      where: { name: 'Admin' }
    });

    if (adminRole) {
      await prisma.userRole.create({
        data: {
          userId: admin.id,
          roleId: adminRole.id
        }
      });

      const allAccesRights = await prisma.accesRight.findMany();
      
      for (const right of allAccesRights) {
        await prisma.roleAccesRight.create({
          data: {
            roleId: adminRole.id,
            accesRightId: right.id
          }
        });
      }
      
      console.log(`✅ Admin role granted ${allAccesRights.length} access rights`);
    }
    
    console.log('✅ Admin user created:', admin.username);
  } else {
    console.log('ℹ️  Admin user already exists');
  }
}

async function main() {
  const firstStartup = await isFirstStartup();
  
  console.log('🌱 Starting database seed...');
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔄 First startup detected: ${firstStartup}`);
  console.log(`⚙️  Force seed: ${FORCE_SEED}`);

  if (firstStartup || (IS_DEV && FORCE_SEED)) {
    console.log('▶️  Applying seed configuration...\n');
    
    await seedDefaultRoles();
    await seedDefaultAccesRights();
    await seedAdminUser();
    
    console.log('\n✨ Seed completed successfully!');
  } else {
    console.log('⏭️  Skipping seed - database already initialized (use FORCE_SEED=true in dev)');
  }
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
