import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const emailToCheck = "hannah.admin@gmail.com";

  // Try Admin first
  const admin = await prisma.admin.findUnique({
    where: { email: emailToCheck },
  });

  if (admin) {
    console.log("Admin found:", admin);
    return;
  }

  // Try Staff
  const staff = await prisma.staff.findUnique({
    where: { email: emailToCheck },
  });

  if (staff) {
    console.log("Staff found:", staff);
    return;
  }

  console.log("User not found");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
