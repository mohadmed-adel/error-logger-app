import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const defaultEmail = process.env.DEFAULT_USER_EMAIL || 'admin@aictime.com';
  const defaultPassword = process.env.DEFAULT_USER_PASSWORD || 'admin123';

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: defaultEmail },
  });

  if (existingUser) {
    console.log('✅ Default user already exists:', defaultEmail);
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // Create default user
  const user = await prisma.user.create({
    data: {
      email: defaultEmail,
      password: hashedPassword,
      name: 'Admin User',
    },
  });

  console.log('✅ Default user created successfully!');
  console.log('📧 Email:', defaultEmail);
  console.log('🔑 Password:', defaultPassword);
  console.log('\n⚠️  Please change the default password after first login!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

