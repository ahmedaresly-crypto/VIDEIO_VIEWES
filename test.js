const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const settings = await prisma.settings.findFirst();
    console.log("Settings:", settings);
    if (settings) {
      const updated = await prisma.settings.update({
        where: { id: settings.id },
        data: { videoUrl: "test2" }
      });
      console.log("Updated:", updated);
    } else {
      const created = await prisma.settings.create({
        data: { videoUrl: "test" }
      });
      console.log("Created:", created);
    }
  } catch (e) {
    console.error("Prisma Error:", e);
  }
}

main().finally(() => prisma.$disconnect());
