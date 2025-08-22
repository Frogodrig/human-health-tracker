# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking without emitting files

### Database Commands
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and run database migrations
- `npm run db:seed` - Seed database with initial data
- `npm run db:studio` - Open Prisma Studio for database GUI

### Specialized Commands
- `npm run test:fatsecret` - Test FatSecret API integration with comprehensive validation

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Database**: Prisma ORM with PostgreSQL (configured for production, SQLite for dev)
- **Authentication**: Clerk with webhook integration
- **State Management**: Zustand with persistence
- **UI**: shadcn/ui components with Tailwind CSS v4 + custom Pokemon-style food cards
- **AI/ML**: Clarifai Food Recognition API
- **Barcode Scanning**: react-zxing library

### Project Structure

#### Core Directories
- `app/` - Next.js 15 App Router structure
  - `(auth)/` - Authentication pages (sign-in, sign-up)
  - `(dashboard)/` - Main app pages with shared layout
  - `api/` - API routes for backend functionality
- `components/` - Reusable UI components
  - `ui/` - shadcn/ui base components
  - `forms/` - Form components with react-hook-form
  - `charts/` - Recharts visualization components
  - `scanner/` - Camera and barcode scanning components
- `lib/` - Utility libraries and configurations
  - `api/` - External API integrations (FatSecret, OpenFoodFacts)
  - `generated/prisma/` - Generated Prisma client
  - `services/` - Business logic services
  - `utils/` - Utility functions
- `types/` - TypeScript type definitions
- `store/` - Zustand state management
- `prisma/` - Database schema and migrations

#### Key App Routes
- `/dashboard` - Main dashboard with nutrition overview
- `/scan` - Barcode scanning interface
- `/camera` - Food recognition camera
- `/add-food` - Manual food entry
- `/analytics` - Nutrition analytics and charts
- `/goals` - Goal setting and tracking
- `/achievements` - Gamification features
- `/settings` - User preferences

#### API Structure
- `/api/products/` - Food product management
  - `[barcode]/` - Barcode-specific product lookup
  - `manual/` - Manual product creation
- `/api/intake/` - Daily intake tracking
  - `daily/` - Daily intake summaries
  - `entry/` - Individual food entries
- `/api/users/` - User management
  - `profile/` - User profile data
  - `goals/` - Nutrition goals
  - `achievements/` - Achievement system
- `/api/food-recognition/` - AI food detection
- `/api/webhooks/clerk/` - Clerk authentication webhooks

### Database Schema (Prisma)

#### Core Models
- `User` - User profiles with Clerk integration
- `FoodProduct` - Comprehensive food database with nutrition data
- `CustomFood` - User-created food items
- `DailyIntake` - Daily nutrition summaries
- `IntakeEntry` - Individual food consumption records
- `Goal` - User nutrition and fitness goals
- `Achievement` / `UserAchievement` - Gamification system
- `FavoriteFood` - User food preferences

#### Key Relationships
- Users have many DailyIntakes, Goals, and Achievements
- DailyIntake contains multiple IntakeEntries
- IntakeEntry references either FoodProduct or CustomFood
- CustomFood can be based on FoodProduct

### State Management (Zustand)

#### Stores
- `useAppStore` - Main app state (user, current date, daily intake)
- `useScannerStore` - Camera/barcode scanning state
- `useUIStore` - UI state (theme, sidebar, notifications)
- `useNutritionStore` - Nutrition goals and calculations
- `useFoodRecognitionStore` - Food recognition history

### External Integrations

#### Required Environment Variables
```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Clarifai Food Recognition
CLARIFAI_API_KEY=
CLARIFAI_MODEL_ID=
CLARIFAI_MODEL_VERSION_ID=
CLARIFAI_USER_ID=
CLARIFAI_APP_ID=

# Optional Nutrition APIs
NEXT_PUBLIC_FDC_API_KEY=
FATSECRET_CLIENT_ID=
FATSECRET_CLIENT_SECRET=

# Database
DATABASE_URL=
```

#### API Services
- **Clarifai**: Primary food recognition service with automated image analysis
- **FatSecret**: Primary nutrition data provider with OAuth 2.0 and barcode scanning (Premier tier)
- **OpenFoodFacts**: Secondary nutrition database with comprehensive product data
- **FDC (USDA)**: Government nutrition data fallback

### Development Guidelines

#### Database Operations
- Always use `npm run db:generate` after schema changes
- Use `npm run db:push` for development schema updates
- Create proper migrations with `npm run db:migrate` for production
- Prisma client is generated to `lib/generated/prisma/`

#### Type Safety
- All types are defined in `types/` directory
- Database types are auto-generated from Prisma schema
- Use strict TypeScript configuration
- Run `npm run type-check` before commits

#### State Management Patterns
- Use Zustand stores for global state
- Persist user preferences and authentication state
- Keep component state local when possible
- Use React Query for server state (configured in providers)

#### API Route Patterns
- Return consistent response format: `{ data, message?, error? }`
- Handle authentication with Clerk helpers
- Validate input with Zod schemas (in `lib/validations.ts`)
- Use proper HTTP status codes

#### Component Architecture
- Follow shadcn/ui patterns for base components
- Use react-hook-form for form management
- Implement proper loading and error states
- Follow mobile-first responsive design

#### Testing and Quality
- Run linting with `npm run lint`
- Type-check with `npm run type-check`
- Test API integrations with specialized test scripts
- Verify database operations in Prisma Studio

### Recent Enhancements

#### FatSecret API Integration (Fixed & Enhanced)
- **OAuth 2.0 Implementation**: Proper token acquisition with retry logic and caching
- **Barcode Scanning**: Supports both basic and Premier tiers with graceful fallbacks
- **Food Search**: Full nutrition data retrieval with detailed mapping
- **Rate Limiting**: Built-in rate limiting with configurable thresholds
- **Error Handling**: Comprehensive error categorization and recovery
- **Testing**: Comprehensive test suite with environment validation

**Important Configuration**:
- Set `FATSECRET_PREMIER_ACCESS=true` only if you have Premier tier access
- Basic tier provides food search, Premier tier adds barcode scanning
- Test with `npm run test:fatsecret` to validate configuration

#### OpenFoodFacts Integration (Fixed & Validated)
- **API Version**: Updated to use correct v0 endpoint as per 2025 documentation
- **User-Agent**: Required header properly implemented for API compliance
- **Energy Conversion**: Proper kJ to kcal conversion (kJ * 0.23900573614)
- **Fallback Integration**: Seamlessly integrated as secondary data source
- **Product Mapping**: Comprehensive nutrition data extraction and validation

#### Pokemon-Style Food Cards
- **Dynamic Rarity System**: Cards ranked by nutrition quality (Common → Legendary)
- **Holographic Effects**: CSS-based holographic animations and gradients
- **Interactive Elements**: Mouse tracking for 3D tilt and lighting effects
- **Nutrition Scoring**: Algorithm based on Nutri-Score, protein, fiber, sodium content
- **Visual Hierarchy**: Color-coded rarities with appropriate icons and effects

**Component Location**: `components/ui/food-card.tsx`
**Usage**: Import `FoodCard` or `FoodCardGrid` components

#### UI/UX Improvements
- **Skeleton Loading**: Comprehensive skeleton components for all UI states
- **Toast Notifications**: Custom toast system integrated with Zustand store
- **Enhanced Forms**: Better validation and user feedback
- **Error Boundaries**: Proper error handling throughout the app

#### Authentication & User Management
- **Auto User Creation**: `ensureUserExists()` function creates users if webhook fails
- **Profile Management**: Fixed profile API routes with proper error handling
- **Type Safety**: Enhanced TypeScript types for better development experience

### API Integration Patterns

#### Multi-Source Product Lookup
1. **Internal Database** (fastest, cached data)
2. **FatSecret API** (primary external source)
3. **Local OpenFoodFacts Cache** (previously fetched OFF data)
4. **OpenFoodFacts API** (secondary external source, most comprehensive)

#### Error Handling Strategy
- **Graceful Degradation**: App continues working even if APIs fail
- **User Feedback**: Clear error messages and suggested actions
- **Retry Logic**: Exponential backoff for transient failures
- **Logging**: Comprehensive logging for debugging and monitoring

### Performance Optimizations
- **Token Caching**: FatSecret tokens cached with proper expiration
- **Database Caching**: External API results cached in local database
- **Rate Limiting**: Prevents API quota exhaustion
- **Lazy Loading**: Components load only when needed