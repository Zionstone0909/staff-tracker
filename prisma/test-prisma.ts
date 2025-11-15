import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function test() {
  try {
    const users = await prisma.admin.findMany();
    console.log("DB connection successful:", users);
  } catch (err) {
    console.error("DB connection error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
