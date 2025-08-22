-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE');

-- CreateEnum
CREATE TYPE "DietaryGoal" AS ENUM ('WEIGHT_LOSS', 'MUSCLE_GAIN', 'MAINTENANCE', 'BULKING', 'CUTTING');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');

-- CreateEnum
CREATE TYPE "NutriGrade" AS ENUM ('A', 'B', 'C', 'D');

-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('FATSECRET', 'USDA', 'MANUAL', 'ML_DETECTED');

-- CreateEnum
CREATE TYPE "DetectionMethod" AS ENUM ('MANUAL', 'BARCODE', 'ML_VISION', 'VOICE');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('DAILY_CALORIES', 'DAILY_PROTEIN', 'DAILY_CARBS', 'DAILY_FAT', 'WEIGHT_TARGET', 'BODY_FAT', 'MUSCLE_GAIN');

-- CreateEnum
CREATE TYPE "AchievementCategory" AS ENUM ('STREAK', 'MILESTONE', 'NUTRITION', 'SCANNING', 'SOCIAL', 'CHALLENGE');

-- CreateEnum
CREATE TYPE "AchievementTier" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "height" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "activityLevel" "ActivityLevel" NOT NULL DEFAULT 'MODERATE',
    "dietaryGoals" "DietaryGoal" NOT NULL DEFAULT 'MAINTENANCE',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_products" (
    "id" TEXT NOT NULL,
    "barcode" TEXT,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "servingSize" DOUBLE PRECISION NOT NULL,
    "servingUnit" TEXT NOT NULL DEFAULT 'g',
    "calories" DOUBLE PRECISION NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL,
    "carbohydrates" DOUBLE PRECISION NOT NULL,
    "sugars" DOUBLE PRECISION,
    "fat" DOUBLE PRECISION NOT NULL,
    "saturatedFat" DOUBLE PRECISION,
    "fiber" DOUBLE PRECISION,
    "sodium" DOUBLE PRECISION,
    "nutriGrade" "NutriGrade",
    "imageUrl" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "source" "DataSource" NOT NULL DEFAULT 'FATSECRET',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_foods" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "servingSize" DOUBLE PRECISION NOT NULL,
    "servingUnit" TEXT NOT NULL DEFAULT 'g',
    "calories" DOUBLE PRECISION NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL,
    "carbohydrates" DOUBLE PRECISION NOT NULL,
    "fat" DOUBLE PRECISION NOT NULL,
    "brand" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "baseProductId" TEXT,

    CONSTRAINT "custom_foods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_intakes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalCalories" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalProtein" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCarbohydrates" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalFat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalFiber" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSodium" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "waterIntake" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "calorieGoalMet" BOOLEAN NOT NULL DEFAULT false,
    "proteinGoalMet" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_intakes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intake_entries" (
    "id" TEXT NOT NULL,
    "dailyIntakeId" TEXT NOT NULL,
    "foodProductId" TEXT,
    "customFoodId" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'g',
    "mealType" "MealType" NOT NULL,
    "consumedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calories" DOUBLE PRECISION NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL,
    "carbohydrates" DOUBLE PRECISION NOT NULL,
    "fat" DOUBLE PRECISION NOT NULL,
    "detectedBy" "DetectionMethod" NOT NULL DEFAULT 'MANUAL',
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intake_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "GoalType" NOT NULL,
    "targetCalories" DOUBLE PRECISION,
    "targetProtein" DOUBLE PRECISION,
    "targetCarbohydrates" DOUBLE PRECISION,
    "targetFat" DOUBLE PRECISION,
    "targetWeight" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "AchievementCategory" NOT NULL,
    "tier" "AchievementTier" NOT NULL DEFAULT 'COMMON',
    "icon" TEXT NOT NULL,
    "condition" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 100,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite_foods" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "foodProductId" TEXT,
    "customFoodId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_foods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerkId_key" ON "users"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "food_products_barcode_key" ON "food_products"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "daily_intakes_userId_date_key" ON "daily_intakes"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "goals_userId_type_key" ON "goals"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_userId_achievementId_key" ON "user_achievements"("userId", "achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_foods_userId_foodProductId_key" ON "favorite_foods"("userId", "foodProductId");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_foods_userId_customFoodId_key" ON "favorite_foods"("userId", "customFoodId");

-- AddForeignKey
ALTER TABLE "custom_foods" ADD CONSTRAINT "custom_foods_baseProductId_fkey" FOREIGN KEY ("baseProductId") REFERENCES "food_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_foods" ADD CONSTRAINT "custom_foods_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_intakes" ADD CONSTRAINT "daily_intakes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intake_entries" ADD CONSTRAINT "intake_entries_customFoodId_fkey" FOREIGN KEY ("customFoodId") REFERENCES "custom_foods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intake_entries" ADD CONSTRAINT "intake_entries_dailyIntakeId_fkey" FOREIGN KEY ("dailyIntakeId") REFERENCES "daily_intakes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intake_entries" ADD CONSTRAINT "intake_entries_foodProductId_fkey" FOREIGN KEY ("foodProductId") REFERENCES "food_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "achievements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_foods" ADD CONSTRAINT "favorite_foods_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
