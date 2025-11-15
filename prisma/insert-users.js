import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Insert Admin user
  await prisma.admin.create({
    data: {
      email: 'admin@example.com',
      password: '$2b$10$jwB2Y2LUsjXTo0.CLdQAROLhLYNPW3/97xvecFnDpfWPMszFu7g2m',
    },
  });

  // Insert Staff user
  await prisma.staff.create({
    data: {
      email: 'staff@example.com',
      password: '$2b$10$PXycHuku3ovog5B8TOds8OtgTOYIdk0z4tT0mZx9xB5PBHncTyi/m',
    },
  });

  console.log('Admin and Staff users inserted successfully!');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
