# BachatKaro - Developer Documentation

**Welcome to BachatKaro!** This is the complete developer guide to understand, build, and extend the project.

> **Quick Links**: [Setup Guide](#setup) | [Architecture](#architecture) | [Components](#components) | [API](#api) | [Database](#database) | [Contributing](#contributing)

---

## 📋 Table of Contents

1. [Quick Overview](#quick-overview)
2. [What is BachatKaro?](#what-is-bachatkaro)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Getting Started](#getting-started)
6. [Architecture Overview](#architecture-overview)
7. [Key Features](#key-features)
8. [Documentation Map](#documentation-map)
9. [Development Workflow](#development-workflow)
10. [Common Tasks](#common-tasks)

---

## Quick Overview

**BachatKaro** (meaning "Manage Money" in Hindi) is an intelligent financial management application for India. It helps users:

- 💰 Track personal expenses (manual, voice, or quick entry)
- 👥 Split bills with friends and groups
- 📊 Plan loans and calculate EMIs
- 🎯 Manage savings goals
- ✈️ Plan group trips with cost breakdowns
- 🎲 Play Bill Roulette (fun gamification)

**Repository Structure**:
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL) + Edge Functions
- **Deployment**: Vercel + Cloudflare Workers

---

## What is BachatKaro?

### Problem Statement

Young Indians face challenges with:
- **Manual expense tracking** without clear categorization
- **Group billing** - no easy way to split and settle bills
- **EMI management** - complex loan tracking with interest calculations
- **Financial insights** - lack of spending patterns and future projections
- **Trip planning** - no integrated budgeting tool for group travels

### Solution

BachatKaro provides an all-in-one platform that:
1. Automatically tracks expenses via multiple input methods
2. Manages group finances with smart debt tracking
3. Calculates loans/EMIs with visualization
4. Provides spending analytics
5. Plans trips with cost breakdowns
6. Works offline and syncs online

### Target Users

- **Primary**: Young Indians (18-45) managing personal finances
- **Secondary**: Roommates and friend groups splitting bills
- **Tertiary**: Freelancers and small businesses tracking EMIs

---

## Tech Stack

### Frontend

| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI framework | 18.3.1 |
| **TypeScript** | Type safety | 5.8 |
| **Vite** | Build tool | 5.4 |
| **TailwindCSS** | Styling | 3.4 |
| **shadcn/ui** | Component library | latest |
| **React Router** | Navigation | 6.30 |
| **React Query** | Data fetching | 5.83 |
| **React Hook Form** | Form management | 7.61 |
| **Zod** | Schema validation | 3.25 |
| **Lucide React** | Icons | 0.462 |
| **Recharts** | Charts/Analytics | 2.15 |
| **next-themes** | Dark mode | 0.3 |

### Backend

| Technology | Purpose |
|------------|---------|
| **Supabase** | PostgreSQL database + Auth + Real-time |
| **Supabase Functions** | Edge functions for backend logic |
| **Vercel** | Frontend hosting |
| **Wrangler** | Cloudflare Workers CLI |

### Development Tools

| Tool | Purpose |
|------|---------|
| **Bun** | Package manager + runtime (faster than npm) |
| **Vitest** | Unit testing |
| **ESLint** | Code linting |
| **TypeScript ESLint** | TypeScript linting |

---

## Project Structure

```
d:\MyProject\Bachatkaro\
├── src/
│   ├── App.tsx                    # Main app component
│   ├── main.tsx                   # Entry point
│   ├── index.css                  # Global styles
│   ├── components/                # React components
│   │   ├── auth/                  # Authentication components
│   │   ├── dashboard/             # Dashboard components
│   │   ├── groups/                # Group-related components
│   │   ├── layout/                # Layout components
│   │   ├── savings/               # Savings goal components
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── EMIBillsCard.tsx        # EMI display card
│   │   ├── MonthlySnapshot.tsx     # Monthly summary
│   │   └── ProtectedRoute.tsx      # Route protection
│   ├── contexts/                  # React contexts
│   │   ├── AuthContext.tsx        # Authentication state
│   │   ├── LanguageContext.tsx    # i18n state
│   │   └── ThemeContext.tsx       # Dark mode state
│   ├── pages/                     # Page components (routes)
│   │   ├── Dashboard.tsx          # Home/main page
│   │   ├── AddExpense.tsx         # Add expense page
│   │   ├── Savings.tsx            # Savings goals page
│   │   ├── GroupExpenses.tsx      # Group splitting page
│   │   ├── Analytics.tsx          # Analytics page
│   │   ├── Auth.tsx               # Login/signup page
│   │   ├── JoinGroup.tsx          # Join group page
│   │   ├── TripPlanView.tsx       # Trip planning view
│   │   └── SetupWizard.tsx        # First-time setup
│   ├── services/                  # Backend services
│   │   ├── api.ts                 # Supabase API calls
│   │   ├── aiParser.ts            # AI-powered parsing
│   │   ├── localParser.ts         # Local expense parsing
│   │   ├── hybridParser.ts        # Hybrid parsing
│   │   ├── tripPlanner.ts         # Trip planning logic
│   │   ├── tripShareService.ts    # Trip sharing
│   │   ├── deepLinkHandler.ts     # Deep link routing
│   │   └── mentorService.ts       # AI mentor service
│   ├── hooks/                     # Custom React hooks
│   │   ├── useOptimizedList.ts    # List optimization
│   │   ├── use-toast.ts           # Toast notifications
│   │   ├── use-mobile.tsx         # Responsive design
│   │   └── voice/                 # Voice input hooks
│   ├── types/                     # TypeScript types
│   │   ├── analytics.ts           # Analytics types
│   │   └── emi.ts                 # EMI types
│   ├── lib/                       # Utility libraries
│   │   ├── utils.ts               # General utilities
│   │   └── validators.ts          # Form validators
│   ├── utils/                     # Utility functions
│   │   ├── currencyFormatter.ts   # Currency formatting
│   │   ├── loanCalculator.ts      # EMI calculations
│   │   ├── transactionParser.ts   # Transaction parsing
│   │   └── voiceParser.ts         # Voice parsing
│   ├── i18n/                      # Internationalization
│   │   ├── index.ts               # i18n setup
│   │   └── translations.ts        # Translations
│   ├── config/                    # Configuration
│   │   ├── appConfig.ts           # App settings
│   │   └── currency.ts            # Currency config
│   ├── integrations/              # External integrations
│   │   └── supabase/              # Supabase client
│   ├── test/                      # Tests
│   │   ├── setup.ts               # Test setup
│   │   └── example.test.ts        # Example tests
│   └── data/                      # Static data
│       ├── DestinationsData.ts    # Trip destinations
│       └── tripData.ts            # Trip data

├── supabase/
│   ├── functions/                 # Edge functions
│   │   ├── send-invite/           # Email invites
│   │   └── direct-reset-password/ # Password reset
│   ├── migrations/                # Database migrations
│   └── config.toml                # Supabase config

├── public/
│   └── robots.txt                 # SEO robots file

├── Configuration Files:
│   ├── package.json               # Dependencies
│   ├── tsconfig.json              # TypeScript config
│   ├── vite.config.ts             # Vite configuration
│   ├── tailwind.config.ts         # Tailwind config
│   ├── postcss.config.js          # PostCSS config
│   ├── eslint.config.js           # Linting config
│   ├── vitest.config.ts           # Test config
│   └── vercel.json                # Vercel deployment
```

---

## Getting Started

### Prerequisites

- **Node.js**: v18+ (or use Bun)
- **Git**: For version control
- **Supabase Account**: For backend
- **Vercel Account**: For deployment (optional)

### Setup

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for complete setup instructions.

**Quick Start**:
```bash
# Clone repository
git clone <repo-url>
cd Bachatkaro

# Install dependencies
bun install  # or: npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase keys

# Start development server
bun run dev  # or: npm run dev

# Open http://localhost:5173 in browser
```

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Frontend (React)                    │
│  ┌──────────────────────────────────────────────┐   │
│  │ Pages (Dashboard, AddExpense, Analytics)     │   │
│  │ Components (UI, Auth, Groups, Savings)       │   │
│  │ Contexts (Auth, Language, Theme)             │   │
│  │ Hooks (Custom business logic)                │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────────┘
                   │ API Calls
                   ▼
┌─────────────────────────────────────────────────────┐
│         Backend (Supabase + PostgreSQL)             │
│  ┌──────────────────────────────────────────────┐   │
│  │ Authentication (JWT tokens)                  │   │
│  │ Database (Users, Expenses, Groups, EMIs)     │   │
│  │ Edge Functions (send-invite, reset-password) │   │
│  │ Real-time Subscriptions                      │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Action** (e.g., add expense) → 
2. **Component handles input** → 
3. **Custom Hook processes** → 
4. **Service layer calls API** → 
5. **Supabase executes** → 
6. **Component updates state** → 
7. **UI re-renders**

### State Management

- **React Context**: Authentication, Language, Theme
- **React Query**: Server state (expenses, groups, etc.)
- **Local State**: Component-level state (forms, UI)

---

## Key Features

### 1. Expense Tracking
- **Manual**: Type expense details
- **Voice**: Speak expense ("Paid 500 for chai")
- **Quick**: Fast buttons for common categories
- **Recurring**: Set EMIs and fixed bills

### 2. Group Expenses (Bill Splitting)
- Create groups with friends
- Add group expenses
- Auto-calculate who owes whom
- Settle with one click

### 3. EMI & Loan Management
- Track multiple loans
- Calculate interest (reducing/flat)
- View amortization schedule
- See monthly breakdown

### 4. Savings Goals
- Set savings target
- Track progress
- Visual progress bars
- Timeline to goal

### 5. Trip Planning
- Plan trip with friends
- Get auto-generated itinerary
- Budget breakdown per person
- Share via WhatsApp

### 6. Analytics & Insights
- Spending by category
- Monthly trends
- Savings progress
- Budget vs actual

### 7. Voice Input
- Speech-to-text powered by Capacitor
- AI parsing for smart extraction
- Multi-language support (English/Hindi)

### 8. Bill Roulette
- Gamified bill settlement
- Random selection
- Item-specific or amount-based
- Fun way to split

---

## Documentation Map

| Document | Audience | Read Time |
|----------|----------|-----------|
| [SETUP_GUIDE.md](SETUP_GUIDE.md) | Developers | 15 min |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Architects/Senior Devs | 20 min |
| [COMPONENTS.md](COMPONENTS.md) | Frontend Developers | 25 min |
| [API_DOCUMENTATION.md](API_DOCUMENTATION.md) | Backend/Full-stack Devs | 15 min |
| [DATABASE.md](DATABASE.md) | Database Developers | 20 min |
| [DEPLOYMENT.md](DEPLOYMENT.md) | DevOps/Deployment | 10 min |
| [CONTRIBUTING.md](CONTRIBUTING.md) | All Developers | 10 min |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | All Developers | 10 min |
| [USER_DOCUMENTATION.md](USER_DOCUMENTATION.md) | End Users | 30 min |
| [QUICK_START_GUIDE.md](QUICK_START_GUIDE.md) | New Users | 5 min |
| [TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md) | Technical Reference | 30 min |

---

## Development Workflow

### Branch Strategy

```
main (production-ready)
  ↑
staging (pre-release testing)
  ↑
develop (integration branch)
  ↑
feature/* (feature branches)
```

### Making Changes

1. **Create feature branch**:
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes** and test locally

3. **Run tests**:
   ```bash
   bun run test
   ```

4. **Check linting**:
   ```bash
   bun run lint
   ```

5. **Commit with clear message**:
   ```bash
   git commit -m "feat: add new feature description"
   ```

6. **Push and create PR**:
   ```bash
   git push origin feature/my-feature
   ```

7. **Submit Pull Request** on GitHub

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: fix a bug
docs: documentation changes
style: formatting, missing semicolons, etc.
refactor: code refactoring
perf: performance improvements
test: add tests
chore: dependency updates
```

---

## Common Tasks

### Add a New Page

1. Create file in `src/pages/MyPage.tsx`
2. Add route in `src/App.tsx`
3. Create protection if needed (ProtectedRoute)
4. Add navigation link

### Add a New Component

1. Create `src/components/MyComponent.tsx`
2. Import and use in page
3. Add TypeScript props interface
4. Document component purpose

### Add a New API Endpoint

1. Create Edge Function in `supabase/functions/`
2. Call from `src/services/api.ts`
3. Handle response in component
4. Add error handling

### Add a New Database Table

1. Create migration in `supabase/migrations/`
2. Run migration on Supabase
3. Create TypeScript types
4. Update API service
5. Update components

### Add Translations

1. Edit `src/i18n/translations.ts`
2. Add translations for all languages
3. Use in components with `useLanguage()`
4. Test with language switcher

### Deploy to Production

1. Push to main branch
2. Vercel auto-deploys
3. Monitor in Vercel Dashboard
4. Check Supabase logs for errors

---

## Key Concepts

### React Context
Used for global state:
- **AuthContext**: User authentication state
- **LanguageContext**: Multi-language support
- **ThemeContext**: Dark mode toggling

### React Query
Manages server state:
- Automatic caching
- Background refetching
- Error handling
- Loading states

### Supabase
Provides:
- PostgreSQL database
- User authentication
- Real-time subscriptions
- File storage
- Edge functions

### TypeScript
Ensures:
- Type safety
- Better IDE autocomplete
- Fewer runtime errors
- Self-documenting code

---

## Performance Optimization

### Code Splitting
- Analytics page lazy-loaded
- Only load when needed

### Image Optimization
- Use Next.js-style static imports
- Optimize with TailwindCSS

### Database Queries
- Pagination implemented
- Only fetch needed fields
- Use indexes on frequently queried columns

### Caching
- React Query caches API responses
- 2-minute stale time for most queries
- Manual refetch when needed

---

## Security

### Authentication
- JWT tokens from Supabase
- Protected routes check session
- Tokens refresh automatically

### Data Privacy
- Encryption in transit (HTTPS)
- User data isolated by user_id
- Row-level security in database

### Input Validation
- Zod schemas for all forms
- Server-side validation
- Sanitize user input

---

## Monitoring & Debugging

### Development Tools
- React DevTools browser extension
- Supabase Studio for database
- Browser DevTools Network tab

### Logging
- Console logs for debugging
- Supabase logs for backend
- Vercel logs for deployment

### Error Handling
- Try-catch blocks in services
- User-friendly error messages
- Toast notifications for feedback

---

## Resources

- **React Docs**: https://react.dev
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **React Router**: https://reactrouter.com/
- **React Query**: https://tanstack.com/query/latest

---

## Getting Help

1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Search project GitHub issues
3. Check Supabase documentation
4. Ask in project discussions
5. Contact team lead

---

## Next Steps

- ✅ Read this documentation
- 👉 Follow [SETUP_GUIDE.md](SETUP_GUIDE.md) for setup
- 👉 Read [ARCHITECTURE.md](ARCHITECTURE.md) for design
- 👉 Check [COMPONENTS.md](COMPONENTS.md) for UI components
- 👉 Review [CONTRIBUTING.md](CONTRIBUTING.md) before contributing

---

**Happy Coding! 🚀**

*Last Updated: February 27, 2026*
*Maintained by BachatKaro Development Team*
