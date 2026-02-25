import prisma from '../lib/prisma.js';
import { AppPermission } from '../generated/prisma/client.js';
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
    { 
      name: 'Admin', 
      permissions: ['MANAGE_USERS'] as AppPermission[]
    },
    { 
      name: 'User',
      permissions: [] as AppPermission[]
    },
    { 
      name: 'Reviewer',
      permissions: [] as AppPermission[]
    }
  ];

  for (const role of defaultRoles) {
    const existingRole = await prisma.role.findUnique({
      where: { name: role.name }
    });
    
    if (!existingRole) {
      await prisma.role.create({ data: role });
      console.log(`✅ Role created: ${role.name}`);
    } else {
      await prisma.role.update({
        where: { name: role.name },
        data: { permissions: role.permissions }
      });
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
      // Permissions are now on the role directly
    }
    
    console.log('✅ Admin user created:', admin.username);
  } else {
    console.log('ℹ️  Admin user already exists');
  }
  // await seedMajor();
  // await seedLevel();
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

async function seedMajor() {

  const defaultMajor = [
    { name: "Mathématique" },
    { name: "Informatique" },

  ];
  for (const major of defaultMajor) {
    const exist = await prisma.major.findUnique({
      where: {
        name: major.name
      }
    });
    if (!exist) {
      await prisma.major.create({ data: major })
    }

  }
}


// async function seedLevel(){
//       const defaultLevel = [
//       { name: "L1" },
//       { name: "L2" },
//       { name: "L3" },
//       { name: "M1" },
//       { name: "M2" },

//     ];
//      const majors = await prisma.major.findMany();
//      for(const major of majors){
//         for (const level of defaultLevel ){
//           const exist = await prisma.level.findFirst({
//             where: {
//               name: level.name,
//               majorId: major.id
//             }
//           });
//           if(!exist){
//             await prisma.level.create({
//               data:{
//                 name : level.name,
//                 majorId : major.id,
//               }
//             })
//           }

//         } 
//      }




//   }
