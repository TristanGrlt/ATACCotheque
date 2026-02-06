import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

async function main() {
  console.log('🌱 Starting database seed...');

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

    console.log('✅ Admin user created:', admin.username);
  } else {
    console.log('ℹ️  Admin user already exists');
  }
  // await seedMajor();
  // await seedLevel();
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
