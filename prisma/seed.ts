import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // --- Users ---
  const adminPassword = await bcrypt.hash("admin123", 10);
  const staffPassword = await bcrypt.hash("staff123", 10);

  const admin = await prisma.user.create({
    data: { email: "admin@example.com", password: adminPassword, role: "admin" },
  });

  const staff1 = await prisma.user.create({
    data: { email: "staff1@example.com", password: staffPassword, role: "staff" },
  });

  const staff2 = await prisma.user.create({
    data: { email: "staff2@example.com", password: staffPassword, role: "staff" },
  });

  // --- Sales ---
  await prisma.sale.createMany({
    data: [
      { userId: staff1.id, totalAmount: 1000, profit: 200 },
      { userId: staff1.id, totalAmount: 1500, profit: 300 },
      { userId: staff2.id, totalAmount: 2000, profit: 400 },
    ],
  });

  // --- Expenses ---
  await prisma.expense.createMany({
    data: [
      { amount: 500 },
      { amount: 300 },
    ],
  });

  // --- Stock Adjustments ---
  await prisma.stockAdjustment.createMany({
    data: [
      { reason: "Inventory correction", quantity: 5 },
      { reason: "Damaged goods", quantity: -2 },
    ],
  });

  console.log("✅ Database seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
