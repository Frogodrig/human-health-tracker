import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create sample achievements
  await prisma.achievement.createMany({
    data: [
      {
        name: "First Scan",
        description: "Scan your first barcode!",
        category: "SCANNING",
        tier: "COMMON",
        icon: "🔍",
        condition: { scans: 1 },
      },
      {
        name: "Nutrition Newbie",
        description: "Log food for 3 consecutive days",
        category: "STREAK",
        tier: "COMMON",
        icon: "📱",
        condition: { streak: 3 },
      },
      {
        name: "Health Hero",
        description: "Maintain a 30-day logging streak",
        category: "STREAK",
        tier: "EPIC",
        icon: "🏆",
        condition: { streak: 30 },
      },
    ],
  });

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
