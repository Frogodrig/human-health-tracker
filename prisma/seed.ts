// Fixed with proper imports
import { PrismaClient } from "../lib/generated/prisma";

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
      {
        name: "Scanner Master",
        description: "Scan 50 different products",
        category: "SCANNING",
        tier: "RARE",
        icon: "📷",
        condition: { unique_scans: 50 },
      },
      {
        name: "Macro Master",
        description: "Hit all your macro goals for 7 days",
        category: "NUTRITION",
        tier: "EPIC",
        icon: "🎯",
        condition: { macro_goals_met: 7 },
      },
      {
        name: "AI Explorer",
        description: "Use AI food recognition 20 times",
        category: "SCANNING",
        tier: "RARE",
        icon: "🤖",
        condition: { ai_scans: 20 },
      },
      {
        name: "Consistency Champion",
        description: "Log meals every day for 2 weeks",
        category: "STREAK",
        tier: "RARE",
        icon: "📅",
        condition: { streak: 14 },
      },
      {
        name: "Legendary Logger",
        description: "Maintain a 100-day logging streak",
        category: "STREAK",
        tier: "LEGENDARY",
        icon: "🏅",
        condition: { streak: 100 },
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
