# 🏗️ BachatKaro — Complete Technical Documentation

**Document Version**: 1.0  
**Last Updated**: February 25, 2026  
**Framework**: React + TypeScript + Vite  
**Database**: Supabase (PostgreSQL)  

---

## 📋 TABLE OF CONTENTS

1. [Project Overview](#-project-overview)
2. [Project Structure](#-project-structure)
3. [Page-Level Documentation](#-page-level-documentation)
4. [Feature & Function Mapping](#-feature--function-mapping)
5. [Data Flow Explanation](#-data-flow-explanation)
6. [How to Update This Project](#-how-to-update-this-project)
7. [Dependencies & Tech Stack](#-dependencies--tech-stack)
8. [Risks & Important Notes](#-risks--important-notes)

---

## 1️⃣ PROJECT OVERVIEW

### 📱 Project Purpose
**BachatKaro** ("Manage Money" in Hindi) is an intelligent expense management and financial planning application designed specifically for India. It empowers users to track expenses, split bills with friends, plan loans/EMIs, set savings goals, and plan trips with cost breakdowns.

### 💡 Problem It Solves
- **Expense Tracking**: Manual expense management without clear categorization
- **Group Billing**: No easy way to split bills among friends and settle debts
- **EMI Management**: Complex loan tracking with interest calculations
- **Financial Planning**: Lack of visual insights into spending patterns and future wealth
- **Trip Planning**: No integrated tool for group trip budgeting and recommendations

### 👥 Target Users
- **Primary**: Young Indians (18-45) managing personal finances and group expenses
- **Secondary**: Small groups/roommates splitting bills
- **Tertiary**: Individual loan/EMI trackers

### 🎯 Key Modules
1. **Authentication Module** — Login, registration, password reset
2. **Dashboard** — Main expense tracking with real-time data and insights
3. **Group Expenses** — Create groups, split bills, settle debts
4. **Savings Goals** — Track and manage savings targets
5. **EMI/Loan Tracker** — Track loans with detailed interest calculations
6. **Trip Planning** — Generate trip itineraries and budget breakdowns
7. **Analytics** — Spending trends and financial health scoring

---

## 2️⃣ PROJECT STRUCTURE

### 📁 `/src` Directory Breakdown

```
src/
├── pages/                    # Page components (routes)
├── components/               # Reusable UI components
├── services/                 # API and business logic
├── utils/                    # Helper functions & utilities
├── hooks/                    # Custom React hooks
├── contexts/                 # React context providers (state)
├── config/                   # Configuration files
├── types/                    # TypeScript type definitions
├── i18n/                     # Internationalization (translations)
├── integrations/             # External service integrations
├── features/                 # Feature-specific modules
├── data/                     # Static data (destinations, etc.)
├── styles/                   # Global CSS
└── test/                     # Test setup and examples
```

---

### 📄 PAGES (`src/pages/`)

| Page | File | Purpose | Main UI Elements |
|------|------|---------|------------------|
| **Dashboard** | `Dashboard.tsx` | Main financial hub with 5 tabs (Daily, Planning, Future, Groups, Dreams) | Header, tabs, charts, expense forms, EMI tracker |
| **Index/Home** | `Index.tsx` | Alternative dashboard view - simpler expense interface | Navbar, salary input, budget input, EMI form, expense list |
| **Add Expense** | `AddExpense.tsx` | Dedicated page for adding expenses with voice input support | Voice input, form fields, category selector, date picker |
| **Group Expenses** | `GroupExpenses.tsx` | Group management and bill splitting interface | Group selector, expense tracker, member list, Bill Roulette, Trip Advisor |
| **Savings** | `Savings.tsx` | Savings goal management interface | Goal cards, create goal form, progress bars, goal summary |
| **Auth** | `Auth.tsx` | Login/Registration page | Tabs for login/register, forms, card layout |
| **Reset Password** | `ResetPassword.tsx` | Password reset flow | Email input, reset token field, new password input |
| **Analytics** | `Analytics.tsx` | Spending analytics and insights (lazy-loaded) | Charts, trends, financial health score |
| **Trip Plan View** | `TripPlanView.tsx` | Display generated trip plans with details | Trip details, budget breakdown, recommendations |
| **Trip Share Handler** | `TripShareHandler.tsx` | Handle trip sharing deep links | Route handler for shared trip plans |
| **Join Group** | `JoinGroup.tsx` | Join existing group via invite code | Input field, join button, validation |
| **Not Found** | `NotFound.tsx` | 404 error page | Error message, navigation links |
| **SMS Tester** | `SMSTester.tsx` | Development utility for testing SMS templates | Test form, SMS preview |

---

### 🧩 COMPONENTS (`src/components/`)

#### **Core Layout Components**
- `ProtectedRoute.tsx` — Guards authenticated routes, redirects unauthed users to login
- `NavLink.tsx` — Custom navigation link wrapper

#### **Authentication Components** (`src/components/auth/`)
- `LoginForm.tsx` — Login form with email/password validation
- `RegisterForm.tsx` — Registration form with new account creation

#### **Dashboard Components** (`src/components/dashboard/`)
- `ExpenseTotalsGrid.tsx` — Shows expense totals by category and time period
- `RecentExpenses.tsx` — List of recent transactions with delete/edit options
- `CategoryChart.tsx` — Pie/bar chart breakdown by expense category
- `DateFilter.tsx` — Filter selector (today, this week, this month, custom)
- `DeleteExpenseDialog.tsx` — Modal for confirming expense deletion
- `EditExpenseDialog.tsx` — Modal for editing existing expenses
- `DateTrendChart.tsx` — Line chart showing expense trends over time
- `SmartFinancialMentor.tsx` — AI-powered financial advice based on spending
- `FinancialHealthScore.tsx` — Score (0-100) of financial health with breakdown
- `FutureWealthPredictor.tsx` — Projects future wealth/savings based on patterns
- `VoiceExpenseAdder.tsx` — Voice-to-text expense entry component
- `GoalProgress.tsx` — Progress tracking for savings goals
- `SpendingOverview.tsx` — Summary card of current month's spending

#### **Group Components** (`src/components/groups/`)
- `BillRoulette.tsx` — Spinning wheel game to randomly select who pays
- `TripAdvisor.tsx` — Trip planning dialog with destination/budget inputs
- `tripProvider.ts` — State management for trip planning

#### **UI Components** (`src/components/ui/`) — shadcn-ui components
- Button, Card, Input, Dialog, Select, Tabs, Progress, etc.

#### **Feature-Specific Components**
- `EMIBillsCard.tsx` — Display individual EMI/loan card
- `EMILoanDetailsBlock.tsx` — Detailed EMI information with calculations
- `MonthlySnapshot.tsx` — Monthly income/expense summary

---

### 🔧 SERVICES (`src/services/`)

| Service | File | Purpose | Key Functions |
|---------|------|---------|----------------|
| **API** | `api.ts` | Supabase function calls | `sendGroupInvite()` — Send group invite emails |
| **Trip Planner** | `tripPlanner.ts` | Trip planning logic | `generatePlan()` — Generate trip itinerary + budget |
| **Trip Share** | `tripShareService.ts` | Trip sharing via WhatsApp | `createShareableLink()` — Generate shareable URLs |
| **Deep Link Handler** | `deepLinkHandler.ts` | Handle deep link routing | `handleDeepLink()` — Parse and route deep links |

---

### 🛠️ UTILITIES (`src/utils/`)

| Utility | File | Purpose |
|---------|------|---------|
| **Loan Calculator** | `loanCalculator.ts` | EMI, interest, and loan calculations (REDUCING & FLAT methods) |
| **Currency Formatter** | `currencyFormatter.ts` | Format numbers to INR currency display |
| **Destination Gradient** | `destinationGradient.ts` | Generate color gradients for destinations |
| **Transaction Parser** | `transactionParser.ts` | Parse SMS/text for transaction data |
| **WhatsApp Summary** | `whatsappSummary.ts` | Format expense data for WhatsApp sharing |

---

### 🎣 HOOKS (`src/hooks/`)

| Hook | File | Purpose |
|------|------|---------|
| **use-toast** | `use-toast.ts` | Toast notifications (Sonner library integration) |
| **use-mobile** | `use-mobile.tsx` | Detect mobile viewport breakpoint |
| **useOptimizedList** | `useOptimizedList.ts` | Virtual list rendering for performance |

---

### 🌍 CONTEXTS (`src/contexts/`)

| Context | File | Purpose | Provides |
|---------|------|---------|----------|
| **Auth** | `AuthContext.tsx` | Authentication state management | `user`, `session`, `loading`, `signOut()` |
| **Language** | `LanguageContext.tsx` | Language/locale management | `language`, `setLanguage()` |
| **Theme** | `ThemeContext.tsx` | Dark/light mode management | `theme`, `setTheme()` |

---

### ⚙️ CONFIGURATION (`src/config/`)

| Config | File | Purpose |
|--------|------|---------|
| **App Config** | `appConfig.ts` | Global app settings (country, currency, locale, version) |
| **Currency** | `currency.ts` | Currency formatting rules and locale settings |

---

### 🌐 INTERNATIONALIZATION (`src/i18n/`)

- `index.ts` — Translation key definitions and fallback strings
- `translations.ts` — Complete translation objects for English/Hindi
- Structured for easy addition of new languages

---

### 📊 TYPES (`src/types/`)

| Type File | Contains |
|-----------|----------|
| `emi.ts` | `EMIEntry`, `InterestCalculationType`, loan-related interfaces |
| `analytics.ts` | `CategoryTotal`, `MonthlyTotal`, analytics data structures |

---

### 📁 FEATURES (`src/features/`)

- **split-expense/** — Expense splitting logic and calculators
- **analytics/** — Analytics data hooks and components

---

### 📦 DATA (`src/data/`)

- `tripData.ts` — Dummy destination data (hotels, restaurants, travel advice)
- `DestinationsData.ts` — Destination reference data

---

### 🖼️ INTEGRATIONS (`src/integrations/`)

- **supabase/** — Supabase client initialization and configuration

---

## 3️⃣ PAGE-LEVEL DOCUMENTATION

### **DASHBOARD (`Dashboard.tsx`)**

**Purpose**: Main financial hub with comprehensive expenses, EMI, and goal tracking

**Tab Structure**:
1. **Daily Tab** — Track expenses day-by-day
2. **Planning Tab** — Salary, budget, and EMI setup
3. **Future Tab** — Wealth projections using patterns
4. **Groups Tab** — View group expenses and bills
5. **Dreams Tab** — Savings goals and targets

**Key Sections**:
- Header with theme toggle and logout
- Navigation tabs
- Date filter (Today/This Week/This Month/Custom)
- Expense totals grid
- Recent expenses list with edit/delete
- Category breakdown chart
- Financial health score
- Smart financial mentor recommendations

**User Actions**:
- Add expense (via form or voice)
- Delete expense
- Edit expense
- Update salary
- Set budget
- Add/edit EMI
- View spending trends
- Generate financial advice
- Create/view savings goals

**Connected APIs**:
- Supabase: `expenses`, `emis`, `budgets`, `salaries` tables

**Components Used**:
- `ExpenseTotalsGrid`, `RecentExpenses`, `CategoryChart`, `DateFilter`, `SmartFinancialMentor`, `FinancialHealthScore`, `FutureWealthPredictor`, `GoalProgress`, `VoiceExpenseAdder`, `EMILoanDetailsBlock`

---

### **INDEX / HOME (`Index.tsx`)**

**Purpose**: Simplified dashboard view focusing on core expense management

**Main Sections**:
- Navbar with logout
- Monthly salary input and display
- Monthly budget input
- EMI tracker with detailed loan form
- Expense quick-add button

**User Actions**:
- Save salary
- Set monthly budget
- Add detailed EMI/loan
- Edit/delete EMI
- Quick add expense

**Connected APIs**:
- Supabase: `salaries`, `budgets`, `emis` tables

**Key Difference from Dashboard**: Simpler, more focused UI; no analytics or charts

---

### **ADD EXPENSE (`AddExpense.tsx`)**

**Purpose**: Dedicated page for adding expenses with multiple input methods

**Sections**:
- Voice input section (auto-categorizes)
- Manual form fields:
  - Amount
  - Category selector
  - Payment mode
  - Note
  - Date

**Smart Features**:
- Keyword-based auto-categorization (e.g., "pizza" → Food)
- Supports Hindi keywords
- Voice-to-text with 10-second timeout
- Real-time validation

**User Actions**:
- Speak or type expense
- Select category
- Choose payment method
- Add optional notes
- Submit

**Connected APIs**:
- Supabase: `expenses` table

---

### **GROUP EXPENSES (`GroupExpenses.tsx`)**

**Purpose**: Group-based expense management and settlement

**Key Sections**:
- Group selector dropdown
- Create new group form
- Invite members
- Add expense form
- Bill settlement display
- Simplified debt tracker
- **Bill Roulette** — Spin to pick who pays
- **Trip Advisor** — Plan group trip

**User Actions**:
- Create group
- Add members
- Send invites
- Add group expense
- Select split type (equal, custom, itemized)
- View settlement balances
- Play Bill Roulette
- Plan trip with budget

**Connected APIs**:
- Supabase: `groups`, `group_members`, `group_expenses`, `trip_plans` tables

---

### **SAVINGS (`Savings.tsx`)**

**Purpose**: Savings goals management

**Sections**:
- Savings summary card
- Create goal form
- Goals grid with progress bars
- Delete goal option

**User Actions**:
- Create new goal
- View goal progress
- Delete goal
- See summary of total savings

**Connected APIs**:
- Supabase: `savings_goals` table

---

### **AUTH (`Auth.tsx`)**

**Purpose**: User authentication (login/register)

**Sections**:
- Tabs for login and register
- Login form: email + password
- Register form: email + password + confirm password
- Error messaging

**User Actions**:
- Create new account
- Login with credentials
- Auto-redirect to dashboard on successful login
- Handle redirect after login (via deep links)

**Connected APIs**:
- Supabase Auth: `signUp()`, `signIn()`, `signOut()`

---

## 4️⃣ FEATURE & FUNCTION MAPPING

### Core Features

| Feature | File | Main Function | What It Does |
|---------|------|---------------|--------------|
| **Add Expense** | `AddExpense.tsx` | `handleAddExpense()` | Validates form, inserts to `expenses` table |
| **Voice Input** | `VoiceExpenseAdder.tsx` | `handleVoiceCapture()` | Records audio, transcribes, auto-categorizes |
| **Edit Expense** | `Dashboard.tsx` / `EditExpenseDialog.tsx` | `handleEditExpense()` | Updates expense in DB |
| **Delete Expense** | `Dashboard.tsx` / `DeleteExpenseDialog.tsx` | `handleDeleteExpense()` | Removes expense from DB |
| **Salary Update** | `Dashboard.tsx` | `handleSaveSalary()` | Saves monthly salary to DB |
| **Budget Setting** | `Dashboard.tsx` | `handleSaveBudget()` | Sets monthly budget limit |
| **Create EMI** | `Dashboard.tsx` | `handleCreateEmi()` | Inserts EMI with loan details (optional) |
| **Edit EMI** | `Dashboard.tsx` | `handleEditEmi()` | Updates EMI record |
| **Delete EMI** | `Dashboard.tsx` | `handleDeleteEmi()` | Removes EMI from DB |
| **Calculate EMI** | `loanCalculator.ts` | `getLoanSummary()` | Computes EMI, interest, balance using reducing/flat methods |
| **Group Creation** | `GroupExpenses.tsx` | `handleCreateGroup()` | Creates new group in DB |
| **Add Group Member** | `GroupExpenses.tsx` | `handleAddMember()` | Adds member to group |
| **Send Invite** | `GroupExpenses.tsx` | `handleSendInvite()` | Calls `sendGroupInvite()` API |
| **Add Group Expense** | `GroupExpenses.tsx` | `handleAddGroupExpense()` | Inserts expense, calculates splits |
| **Calculate Split** | `split-expense/utils/splitCalculator.ts` | `calculateSplit()` | Divides expense among members per split type |
| **Simplify Debts** | `split-expense/utils/simplifyDebts.ts` | `simplifyDebts()` | Reduces multi-person debts to minimal transactions |
| **Create Savings Goal** | `Savings.tsx` | `handleCreateGoal()` | Inserts goal to `savings_goals` table |
| **Delete Savings Goal** | `Savings.tsx` | `handleDeleteGoal()` | Removes goal from DB |
| **Generate Trip Plan** | `tripPlanner.ts` | `generatePlan()` | Creates trip itinerary + budget, saves to DB |
| **Theme Toggle** | `Dashboard.tsx` | `setTheme()` | Switches dark/light mode |
| **Calculate Health Score** | `FinancialHealthScore.tsx` | `calculateScore()` | Generates 0-100 health score |
| **Predict Future Wealth** | `FutureWealthPredictor.tsx` | `predictWealth()` | Projects wealth based on spending patterns |

---

## 5️⃣ DATA FLOW EXPLANATION

### **Expense Addition Flow**

```
User Action (Click "Add Expense")
    ↓
AddExpense page loads
    ↓
User fills form OR speaks with voice input
    ↓
VoiceExpenseAdder (if voice):
  - Records audio
  - Sends to speech-to-text API
  - Auto-categorizes using CATEGORY_MAP
  ↓
Form Validation:
  - Check amount > 0
  - Check category selected
  - Check date valid
  ↓
handleAddExpense() function:
  - Gets current user from AuthContext
  ↓
Supabase Insert:
  - INSERT INTO expenses (user_id, amount, category, payment_mode, note, date)
  ↓
Success:
  - Show toast notification
  - Refetch expenses via React Query
  - Navigate back to Dashboard
  ↓
Dashboard useQuery hook:
  - Automatically refetches expenses
  - Updates UI
```

### **Group Expense & Settlement Flow**

```
User Action (Create Group)
    ↓
GroupExpenses page: handleCreateGroup()
    ↓
Supabase: INSERT INTO groups
    ↓
Add Members → Send Invites → Supabase: INSERT INTO group_members
    ↓
Add Expense to Group:
  - Select split type (equal/custom)
  - Fill amount, payer, description
  ↓
Calculate Split:
  - calculateSplit() divides expense
  - Creates entries in group_expenses table per member
  ↓
View Settlement:
  - computeBalances() sums who owes whom
  - simplifyDebts() reduces transactions
  ↓
Update UI:
  - Shows "Person X owes Person Y: ₹Amount"
```

### **EMI Calculation Flow**

```
User Input:
  - Principal, Interest Rate, Tenure, Start Date
    ↓
detectProviderType():
  - Checks if bank name contains keywords
  - Returns 'BANK' or 'APP'
    ↓
handleCreateEmi():
  - Validates all fields
  - Calculates monthsPaid from start date
    ↓
Supabase: INSERT INTO emis
    ↓
getLoanSummary() triggered when rendering EMI:
  - Loads EMI record
  - Calls calculateMonthlyEMI() or calculateFlatEMI()
  - Returns:
    * Monthly EMI amount
    * Total interest over full tenure
    * Outstanding balance
    * Interest/Principal breakdown
    ↓
Display in UI:
  - EMILoanDetailsBlock shows calculations
  - Updates in real-time if edited
```

### **Authentication Flow**

```
User arrives at app
    ↓
AuthContext useEffect:
  - Calls supabase.auth.getSession()
  - Sets initial session state
    ↓
onAuthStateChange listener:
  - Watches for login/logout events
    ↓
User clicks "Login" → LoginForm:
  - Enters email + password
  - Calls supabase.auth.signInWithPassword()
    ↓
Success:
  - AuthContext updates session/user state
  - App redirects to /dashboard
    ↓
Failure:
  - Toast error message
  - User stays on Auth page
```

### **Real-Time Synchronization**

```
Supabase Real-Time Subscriptions:
  - Dashboard listens to expenses table changes via useQuery
  - Every 2 minutes: refetch via React Query
  
Offline Support:
  - Network status listener detects online/offline
  - Shows banner "🔴 Offline" / "🟢 Back Online"
  - When back online: refetchQueries() to sync
```

---

## 6️⃣ HOW TO UPDATE THIS PROJECT

### 🎯 MOST IMPORTANT SECTION — Using This When Making Changes

---

#### **🔴 WHERE TO CHANGE UI (Frontend Appearance)**

| UI Element | File | How to Change |
|------------|------|---------------|
| **Navbar/Header** | `Dashboard.tsx` (line ~660) | Edit the `<header>` JSX block |
| | `Index.tsx` (line ~236) | Edit the `<nav>` JSX block |
| | `GroupExpenses.tsx` (line ~395) | Edit the nav bar JSX |
| **Navigation Tabs** | `Dashboard.tsx` (line ~715) | Modify tab array and styling |
| **Page Layout** | Individual page files (e.g., `Dashboard.tsx`) | Edit the main `<div>` wrapper and sections |
| **Card Styling** | Check imports: `@/components/ui/card` | Components use Tailwind CSS classes |
| **Color/Theme** | `Dashboard.tsx` line ~656: `gradientClass`, `cardClass` | Change Tailwind gradient/color classes |
| **Icons** | Any page using Lucide icons | Replace `<IconName />` with different icon |
| **Button Text** | Edit JSX text directly in any file | Find the button and change text string |
| **Input Fields** | `Dashboard.tsx`, `Index.tsx`, `AddExpense.tsx` | Modify `<Input>` components, placeholders, labels |
| **Charts** | `CategoryChart.tsx`, `CategoryChart.tsx` | Edit Recharts component configuration |
| **Modal Dialogs** | `Dashboard.tsx` (search "Dialog") | Modify Dialog component content and form fields |

**Quick Example - Edit Navbar:**
```tsx
// File: src/pages/Dashboard.tsx, line ~660
<header className={`sticky top-0 z-50 h-16 ${gradientClass} shadow-lg...`}>
  <div className="flex items-center gap-3 text-white">
    {/* Change here: update logo text, add new icon, change colors */}
    <Wallet className="h-5 w-5 text-white" />
    <h1 className="font-bold text-lg">BachatKaro</h1>  {/* ← Change this text */}
  </div>
</header>
```

---

#### **🟠 WHERE TO CHANGE LOGIC (Business Logic)**

| Logic/Feature | File | Function | How to Change |
|---------------|------|----------|--------------|
| **Add Expense Logic** | `AddExpense.tsx` | `handleAddExpense()` | Modify form validation, update insert query |
| **Voice Input** | `VoiceExpenseAdder.tsx` | `handleVoiceCapture()` | Change speech-to-text settings, timeout, callback |
| **Auto Categorization** | `AddExpense.tsx` | `CATEGORY_MAP` object | Add/remove keywords for categories |
| **EMI Calculation** | `loanCalculator.ts` | `getLoanSummary()` | Change formula, update interest calculation |
| **Group Settlement** | `split-expense/utils/simplifyDebts.ts` | `simplifyDebts()` | Modify debt reduction algorithm |
| **Financial Score** | `FinancialHealthScore.tsx` | `calculateScore()` | Change scoring formula/weights |
| **Trip Planning** | `tripPlanner.ts` | `generatePlan()` | Modify trip data fetching, budget logic |
| **Expense Filter** | `Dashboard.tsx` line ~600 | `const filtered = ...` | Change date range logic, filter conditions |

**Quick Example - Update Calculation:**
```typescript
// File: src/utils/loanCalculator.ts
export function getLoanSummary(params: LoanSummaryParams): LoanSummary {
  const { principal, annualRate, tenureMonths, monthsPaid, interestCalculationType } = params;
  
  // MODIFY THIS LOGIC:
  const monthlyRate = annualRate / 12 / 100;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / 
              (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  
  // Change formula here ↑
  
  return { emi, totalInterest, outstandingBalance, ... };
}
```

---

#### **🔵 WHERE TO CHANGE DATABASE CALLS (API/Supabase)**

| Operation | File | Query Location | How to Change |
|-----------|------|-----------------|--------------|
| **Fetch Expenses** | `Dashboard.tsx` | `useQuery` ~line 200 | Modify `.select()`, `.where()`, `.order()` |
| **Create Expense** | `AddExpense.tsx` | `handleAddExpense()` | Change `.insert()` fields and values |
| **Update Expense** | `Dashboard.tsx` | `handleEditExpense()` | Modify `.update()` fields |
| **Delete Expense** | `Dashboard.tsx` | `handleDeleteExpense()` | Change `.delete().eq()` condition |
| **Fetch Groups** | `GroupExpenses.tsx` | `useQuery` ~line 70 | Modify group selection logic, joins |
| **Create Group** | `GroupExpenses.tsx` | `handleCreateGroup()` | Change `.insert()` group fields |
| **Fetch EMIs** | `Dashboard.tsx` | `useQuery` ~line 250 | Modify EMI select query, filters |
| **Create EMI** | `Dashboard.tsx` | `handleCreateEmi()` | Add/remove EMI fields in `.insert()` |

**Quick Example - Change DB Query:**
```typescript
// File: src/pages/Dashboard.tsx, useQuery hook
const { data: expenses = [] } = useQuery({
  queryKey: ['expenses', user?.id, dateFilter],
  queryFn: async () => {
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      // MODIFY QUERY HERE:
      .gte('date', startDate)           // ← Change filter
      .lte('date', endDate)             // ← Change filter
      .order('date', { ascending: false })
      .limit(100);  // ← Change limit
    
    return data ?? [];
  },
});
```

---

#### **🟢 WHERE TO ADD NEW FEATURES**

| Feature Type | Location | Steps |
|--------------|----------|-------|
| **New Page** | Create `src/pages/NewPage.tsx` | 1. Create file, 2. Add route in `App.tsx`, 3. Add navigation link |
| **New Component** | Create `src/components/NewComponent.tsx` | 1. Create, 2. Import in needed pages, 3. Pass props |
| **New API Endpoint** | Update `src/services/api.ts` | 1. Add new function, 2. Call from component |
| **New Calculation Util** | Create in `src/utils/newUtil.ts` | 1. Export function, 2. Import where needed, 3. Use in component |
| **New Database Table** | Supabase → Add table | 1. Create table in Supabase, 2. Add queries in services, 3. Use in pages |
| **New Translation** | `src/i18n/translations.ts` | 1. Add key to type, 2. Add translation string, 3. Use with `t('key')` |

---

#### **📝 STEP-BY-STEP: How to Add a Feature**

**Example: Add "Export to CSV" button**

1. **Find UI location**: Dashboard → Add button in `Dashboard.tsx` header
   ```tsx
   <Button onClick={handleExportCSV} className="...">
     <Download className="h-4 w-4" />
     Export CSV
   </Button>
   ```

2. **Create utility function**: `src/utils/csvExporter.ts`
   ```typescript
   export function generateCSV(expenses: Expense[]): string {
     const headers = ['Date', 'Amount', 'Category', 'Note'];
     const rows = expenses.map(e => [e.date, e.amount, e.category, e.note]);
     return [headers, ...rows].map(r => r.join(',')).join('\n');
   }
   ```

3. **Add handler in component**:
   ```tsx
   const handleExportCSV = () => {
     const csv = generateCSV(expenses);
     const blob = new Blob([csv], { type: 'text/csv' });
     const url = URL.createObjectURL(blob);
     const link = document.createElement('a');
     link.href = url;
     link.download = `expenses-${new Date().toISOString()}.csv`;
     link.click();
   };
   ```

4. **Test**: Click button, verify CSV downloads

---

#### **🚀 Most Important Files to Know (Don't Break These)**

| File | Why Important | What Breaks If Changed |
|------|---------------|----------------------|
| `src/App.tsx` | Routes & authentication | Navigation, login flow, protected pages |
| `src/contexts/AuthContext.tsx` | User authentication state | Sign in/out, session management, protected routes |
| `src/integrations/supabase/client.ts` | Database connection | All data operations, API calls |
| `src/utils/loanCalculator.ts` | EMI calculations | EMI accuracy, financial numbers |
| `src/i18n/index.ts` | Translations | Text display, language switching |
| `src/features/split-expense/utils/simplifyDebts.ts` | Debt settlement | Group expense accuracy |

---

## 7️⃣ DEPENDENCIES & TECH STACK

### **Core Framework**
- **React** `^18.3.1` — UI library
- **TypeScript** `^5.8.3` — Type safety
- **Vite** `^5.4.19` — Build tool & dev server
- **React Router DOM** `^6.30.1` — Client-side routing

### **State Management & Data**
- **@tanstack/react-query** `^5.83.0` — Server state & caching
- **Context API** (built-in) — Local state (Auth, Language, Theme)

### **UI & Styling**
- **shadcn-ui** (custom components) — Pre-built accessible components
- **Tailwind CSS** `^3.4.17` — Utility-first CSS
- **Lucide React** `^0.462.0` — Icon library
- **Radix UI** — Headless component primitives
- **Sonner** `^1.7.4` — Toast notifications

### **Forms & Validation**
- **React Hook Form** `^7.61.1` — Form state & validation
- **Zod** `^3.25.76` — Schema validation
- **@hookform/resolvers** `^3.10.0` — Form resolver for Zod

### **Backend & Database**
- **Supabase** `@supabase/supabase-js ^2.95.3` — Backend-as-a-Service
  - PostgreSQL database
  - Real-time subscriptions
  - User authentication
  - Edge functions

### **Date & Time**
- **date-fns** `^3.6.0` — Date manipulation utilities

### **Theme & Internationalization**
- **next-themes** `^0.3.0` — Dark mode management
- **Custom i18n solution** (in `src/i18n`) — Translation management

### **Charts & Visualization**
- **recharts** `^2.15.4` — React chart library

### **Utilities**
- **Clsx** `^2.1.1` — Conditional CSS class builder
- **Tailwind-merge** `^2.6.0` — Merge Tailwind classes
- **Vaul** `^0.9.9` — Drawer component
- **Class-variance-authority** `^0.7.1` — Component styling patterns
- **Input-OTP** `^1.4.2` — OTP input component

### **Development Tools**
- **ESLint** `^9.32.0` — Code linting
- **TypeScript ESLint** `^8.38.0` — TS linting
- **Vitest** `^3.2.4` — Unit test framework
- **@testing-library/react** `^16.0.0` — React testing utilities
- **jsdom** `^20.0.3` — DOM simulation in tests

### **Build & Deployment**
- **Tailwind CSS** `^3.4.17` — Styles
- **PostCSS** `^8.5.6` — CSS processing
- **Autoprefixer** `^10.4.21` — Vendor prefixes
- **Vercel** (deployment platform)

---

## 8️⃣ RISKS & IMPORTANT NOTES

### 🚨 CRITICAL FILES (DO NOT BREAK)

1. **`src/App.tsx`**
   - ⚠️ Contains all routes
   - ⚠️ Authentication flow
   - ⚠️ Protected route wrapper
   - 🎯 Change with extreme caution

2. **`src/integrations/supabase/client.ts`**
   - ⚠️ Database connection initialization
   - ⚠️ All data operations depend on this
   - 🎯 Only update if Supabase configuration changes

3. **`src/contexts/AuthContext.tsx`**
   - ⚠️ Controls who is logged in
   - ⚠️ Used by `ProtectedRoute` and `PublicRoute`
   - 🎯 Test thoroughly after changes

4. **`src/utils/loanCalculator.ts`**
   - ⚠️ EMI calculations must be accurate
   - ⚠️ Users trust these numbers
   - 🎯 Unit test any formula changes

---

### ⚖️ PERFORMANCE CRITICAL AREAS

| Area | Issue | Mitigation |
|------|-------|-----------|
| **Large Expense Lists** | Rendering 1000+ expenses slows UI | Use `useOptimizedList` hook for virtual scrolling |
| **Real-time Subscriptions** | Too many listeners = lag | Supabase subscriptions are limited |
| **Complex Calculations** | EMI + settlement math blocks UI | Use `useMemo()` to prevent recalculation |
| **Image/Asset Loading** | Large trip plan images slow page | Lazy load images, use responsive sizes |
| **API Calls** | Too many calls = quota hit | Use React Query caching with staleTime |

---

### 🔒 SECURITY & DATA CONCERNS

1. **Authentication**
   - Supabase handles password hashing ✅
   - RLS (Row-Level Security) policies protect user data ✅
   - Verify user before any sensitive operation ✅

2. **Sensitive Data**
   - EMI interest rates = financial info
   - Expense amounts = personal data
   - Email addresses in group invites
   - 🎯 Ensure Supabase RLS prevents unauthorized access

3. **API Rate Limiting**
   - Supabase has rate limits
   - Group invites use API function (may have limits)
   - 🎯 Monitor usage in production

4. **Input Validation**
   - All forms use Zod validation ✅
   - Voice input could be abused
   - 🎯 Validate server-side too

---

### 🐛 KNOWN LIMITATIONS & TODO

| Item | Status | Impact |
|------|--------|--------|
| **SMS Tester Page** | Development only | Should be hidden in production |
| **Analytics Page** | Lazy-loaded | Only visible if `VITE_ENABLE_ANALYTICS=true` |
| **Trip Advisor** | Uses dummy data | Real API integration needed for production |
| **Offline Mode** | Partial support | Some features won't work offline |
| **Multilingual** | English/Hindi ready | Only English fully implemented |
| **Mobile Responsive** | 95% complete | Some edge cases on < 320px screens |

---

### 🔄 DATA SYNCHRONIZATION

- **Real-time**: Supabase subscriptions for live updates
- **Polling**: React Query refetches every 2 minutes (staleTime: 2 min)
- **Manual**: User can pull-to-refresh or navigate pages
- **Offline**: Data cached by React Query; syncs when online

---

### 📊 Database Schema Summary

**Main Tables:**

| Table | Columns | Purpose |
|-------|---------|---------|
| `expenses` | id, user_id, amount, category, date, payment_mode, note | Daily expenses |
| `emis` | id, user_id, name, amount, emi_day, loan_details | Loan/EMI tracking |
| `salaries` | id, user_id, amount, month | Monthly salary |
| `budgets` | id, user_id, amount, month | Monthly budget |
| `savings_goals` | id, user_id, goal_name, target_amount, saved_amount | Savings targets |
| `groups` | id, name, created_by | Group definitions |
| `group_members` | id, group_id, user_id, role | Group membership |
| `group_expenses` | id, group_id, amount, paid_by, title, notes, created_at | Group bills |
| `trip_plans` | id, group_id, version, plan_data, created_by | Trip itineraries |

---

### 🎬 Environment Variables Needed

```env
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_ENABLE_ANALYTICS=true|false
```

---

### 📚 How to Extend Translations

To add Hindi or new language:

1. **Add key to type** in `src/i18n/index.ts`:
   ```typescript
   export type TranslationKey = 
     | 'existing.key'
     | 'new.key'  // ← Add here
   ```

2. **Add translation** in `src/i18n/translations.ts`:
   ```typescript
   export const translations = {
     en: { 'new.key': 'English text' },
     hi: { 'new.key': 'हिंदी टेक्स्ट' }
   };
   ```

3. **Use in component**:
   ```tsx
   import { t } from '@/i18n';
   <div>{t('new.key')}</div>
   ```

---

### 🧪 Testing Files Location

- `src/test/setup.ts` — Vitest configuration
- `src/test/example.test.ts` — Example test
- Run tests: `npm run test`
- Watch mode: `npm run test:watch`

---

### 📦 Build & Deployment

**Build For Production**:
```bash
npm run build
```

**Preview Build Locally**:
```bash
npm run preview
```

**Deploy**: Vercel (auto-deploys on git push)

---

---

## ✅ PROJECT UNDERSTOOD — READY FOR FUTURE UPDATE INSTRUCTIONS

This documentation provides:
- ✅ Complete project overview and purpose
- ✅ Full folder-by-folder structure breakdown
- ✅ Purpose of every page and component
- ✅ Feature & function mapping with locations
- ✅ Clear data flow explanations
- ✅ **MOST IMPORTANT**: Exactly where to edit files for any change
- ✅ Comprehensive tech stack documentation
- ✅ Risks, security, and performance considerations

**Now any AI or developer can**:
- 👉 Instantly identify which file to edit for any requirement
- 👉 Understand the complete data flow
- 👉 Know which functions to modify
- 👉 Understand the architecture and dependencies
- 👉 Safely extend features without breaking core logic

---

**Document Status**: COMPLETE ✓  
**Last Updated**: February 25, 2026  
**Next Steps**: Ready for feature implementation based on clear, structured requirements.
