# Health Tracker MVP

A comprehensive health tracking application built with Next.js 15, featuring AI-powered food recognition, barcode scanning, and nutrition analytics.

## Features

- 📸 **AI Food Recognition**: Take photos of food and get instant nutrition information
- 📊 **Barcode Scanning**: Scan product barcodes for nutritional data
- 📈 **Analytics Dashboard**: Track your nutrition goals and progress
- 🎯 **Goal Setting**: Set and monitor health and nutrition targets
- 🏆 **Achievements**: Gamified progress tracking
- 📱 **Mobile-First Design**: Optimized for mobile devices

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Authentication**: Clerk
- **Database**: Prisma with SQLite
- **State Management**: Zustand
- **UI Components**: shadcn/ui with Tailwind CSS
- **AI/ML**: Clarifai Food Recognition API
- **Barcode Scanning**: react-zxing
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- Clarifai API key (for food recognition)
- Clerk account (for authentication)

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# AI Food Recognition (Clarifai)
CLARIFAI_API_KEY=your_clarifai_api_key
CLARIFAI_MODEL_ID=food-item-recognition
CLARIFAI_MODEL_VERSION_ID=get-your-own
CLARIFAI_USER_ID=clarifai
CLARIFAI_APP_ID=main

# Nutrition APIs (Optional - fallbacks available)
NEXT_PUBLIC_FDC_API_KEY=your_fdc_api_key_or_demo_key
FATSECRET_CLIENT_ID=your_fatsecret_client_id
FATSECRET_CLIENT_SECRET=your_fatsecret_client_secret

# Database
DATABASE_URL="file:./dev.db"
```

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up the database:

```bash
npx prisma generate
npx prisma db push
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
