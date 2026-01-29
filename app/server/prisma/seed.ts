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
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
