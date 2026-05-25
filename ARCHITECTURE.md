# Architecture & Design - BachatKaro

Complete guide to BachatKaro's architecture, design patterns, and technical decisions.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Folder Structure & Rationale](#folder-structure--rationale)
3. [Component Architecture](#component-architecture)
4. [State Management](#state-management)
5. [Data Flow](#data-flow)
6. [Authentication & Security](#authentication--security)
7. [Database Design](#database-design)
8. [API Architecture](#api-architecture)
9. [Performance Considerations](#performance-considerations)
10. [Design Patterns](#design-patterns)

---

## Architecture Overview

### System Architecture Diagram

```
User Browser
    │
    ├─→ React 18 + TypeScript (Frontend)
    │   ├─ Routes (React Router)
    │   ├─ Components (UI + Business Logic)
    │   ├─ Contexts (Auth, Language, Theme)
    │   ├─ Hooks (Custom business logic)
    │   └─ Services (API calls)
    │
    ├─→ HTTP API Requests (REST + Real-time WebSocket)
    │
    ├─→ Supabase Backend
        ├─ PostgreSQL Database
        ├─ User Authentication (JWT)
        ├─ Row-Level Security (RLS)
        └─ Edge Functions (Backend Logic)
    
    ├─→ External Services
        ├─ AI Parser Service (for expenses)
        ├─ Trip Planner API
        └─ WhatsApp Integration
    
    └─→ Hosting
        ├─ Frontend: Vercel
        ├─ Backend: Supabase
        └─ Workers: Cloudflare
```

### Technology Stack

**Frontend Layer**:
- React 18: UI rendering
- TypeScript: Type safety
- Vite: Build tool & dev server
- TailwindCSS: Styling
- shadcn/ui: Component library

**State Management Layer**:
- React Context: Global state (Auth, Language, Theme)
- React Query: Server state (Data fetching + caching)
- React Hooks: Local component state

**Backend Layer**:
- Supabase: Database + Auth + Real-time
- PostgreSQL: Data persistence
- Edge Functions: Backend logic

**Infrastructure**:
- Vercel: Frontend hosting
- Supabase Cloud: Backend hosting
- Cloudflare Workers: Optional serverless

---

## Folder Structure & Rationale

### `/src/pages/` - Page Components

**Purpose**: Each file is a full page route (not a reusable component)

```
pages/
├── Dashboard.tsx        # Home page, main view
├── AddExpense.tsx       # Add expense modal/page
├── Analytics.tsx        # Spending analytics
├── Auth.tsx             # Login/signup
├── Savings.tsx          # Savings goals
├── GroupExpenses.tsx    # Group bill splitting
├── TripPlanView.tsx     # Trip planning
└── ...
```

**Design Decision**: Each route gets its own page file for easy navigation structure.

### `/src/components/` - Reusable Components

**Purpose**: Smaller, reusable components used by pages

```
components/
├── auth/                # Authentication components
│   ├── LoginForm.tsx
│   ├── SignupForm.tsx
│   └── ForgotPassword.tsx
├── dashboard/           # Dashboard widgets
│   ├── ExpenseCard.tsx
│   ├── SummaryWidget.tsx
│   └── CategoryBreakdown.tsx
├── groups/              # Group management
├── layout/              # Layout components
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── BottomNav.tsx
├── savings/             # Savings goal components
├── ui/                  # shadcn/ui components
└── ...
```

**Design Decision**: Components are organized by feature/domain for easy discovery.

### `/src/services/` - Business Logic & API

**Purpose**: Fetching data and business logic (separated from UI)

```
services/
├── api.ts               # Supabase API calls
├── aiParser.ts          # AI-powered expense parsing
├── localParser.ts       # Client-side parsing
├── hybridParser.ts      # AI + Local hybrid approach
├── tripPlanner.ts       # Trip planning logic
├── tripShareService.ts  # Trip sharing logic
└── mentorService.ts     # AI mentor chatbot
```

**Design Decision**: Isolate API calls and business logic for easier testing and reusability.

### `/src/hooks/` - Custom React Hooks

**Purpose**: Reusable custom hooks for specific functionality

```
hooks/
├── useOptimizedList.ts  # Efficient list rendering
├── use-toast.ts         # Toast notifications
├── use-mobile.tsx       # Mobile responsiveness detection
└── voice/
    ├── useVoiceInput.ts # Speech-to-text hook
    └── ...
```

**Design Decision**: Custom hooks encapsulate complex logic for reuse across components.

### `/src/contexts/` - Global State (Context)

**Purpose**: Global state that doesn't need React Query

```
contexts/
├── AuthContext.tsx      # Authentication state (user, session)
├── LanguageContext.tsx  # Language selection state
└── ThemeContext.tsx     # Dark mode state
```

**Design Decision**: Use Context instead of Redux for simpler state management (no Redux boilerplate).

### `/src/types/` - TypeScript Definitions

**Purpose**: Shared TypeScript interfaces and types

```
types/
├── analytics.ts         # Analytics-related types
├── emi.ts               # EMI/Loan types
├── index.ts             # Exported common types
└── ...
```

**Design Decision**: Centralized types for easy discovery and consistency.

### `/src/lib/` - Utility Libraries

**Purpose**: Reusable utility functions

```
lib/
├── utils.ts             # General utilities (cn() for Tailwind merging)
└── validators.ts        # Form validators (Zod schemas)
```

**Design Decision**: Separate utilities from features for better organization.

### `/src/utils/` - Feature-Specific Utilities

**Purpose**: Utilities tied to specific features

```
utils/
├── currencyFormatter.ts # Format currency values
├── loanCalculator.ts    # EMI calculations
├── transactionParser.ts # Parse transactions
└── voiceParser.ts       # Parse voice input
```

**Design Decision**: Keep feature-specific utilities separate from general utilities.

### `/src/integrations/` - External Service Integrations

**Purpose**: Centralized integration points with external services

```
integrations/
└── supabase/
    └── client.ts        # Supabase client initialization
```

**Design Decision**: Isolate external integrations for easier switching/mocking in tests.

---

## Component Architecture

### Component Types

#### 1. **Page Components** (in `/pages/`)
- Full-page components
- Handle routing
- Connect to services
- Manage page-level state
- Usually not reused

```tsx
// Example: Dashboard.tsx
export default function Dashboard() {
  const { user } = useAuth();
  const { data: expenses } = useQuery(['expenses'], fetchExpenses);
  return (
    <MainLayout>
      <ExpenseList expenses={expenses} />
      <SummaryWidget />
    </MainLayout>
  );
}
```

#### 2. **Container Components** (in `/components/`)
- Manage state and logic for feature
- Connect to services
- Pass data to presentational components
- Example: `ExpenseContainer` manages expense list state

#### 3. **Presentational Components** (in `/components/ui/`)
- Pure UI components
- Receive props only
- No direct API calls
- Reusable across features
- Example: `Button`, `Card`, `Input`

#### 4. **Smart Components** (in `/components/`)
- Medium complexity
- May connect to services
- Often wrapped in container
- Example: `ExpenseCard` displays expense + handles interactions

### Component Communication Patterns

#### Props Drilling
```tsx
// Avoid deep prop drilling
// ❌ Bad:
<GrandParent>
  <Parent expenseData={data}>
    <Child expenseData={data}>
      <GrandChild expenseData={data} />
    </Child>
  </Parent>
</GrandParent>

// ✅ Good: Use Context
<ExpenseProvider>
  <GrandParent>
    <Parent>
      <Child>
        <GrandChild /> {/* Gets from Context */}
      </Child>
    </Parent>
  </GrandParent>
</ExpenseProvider>
```

#### Data Flow
```
User Interaction
    ↓
Component Handler
    ↓
Hook/Context
    ↓
Service/API
    ↓
Supabase
    ↓
Response
    ↓
Update State
    ↓
Re-render Component
```

### Component Size Guidelines

- **Small**: <100 lines - Simple presentational component
- **Medium**: 100-300 lines - Container + some presentation
- **Large**: 300+ lines - Consider splitting

---

## State Management

### Three Layers of State

#### 1. **Global State** - React Context
For state needed across entire app:

```tsx
// ✅ Use Context for:
- Authenticated user
- Language preference
- Theme (dark/light mode)

// Example: AuthContext.tsx
const AuthContext = createContext<AuthContextType>(/* ... */);

// Usage in component:
const { user, session } = useAuth();
```

#### 2. **Server State** - React Query
For data from backend:

```tsx
// ✅ Use React Query for:
- Expenses (frequently changes)
- Groups (shared across components)
- Analytics data
- Any API response

// Example usage:
const { data: expenses } = useQuery(
  ['expenses'],
  fetchExpenses,
  { staleTime: 1000 * 60 * 5 } // 5 minute cache
);
```

#### 3. **Local State** - useState
For component-level state:

```tsx
// ✅ Use useState for:
- Form inputs (before submission)
- UI toggles (open/close modals)
- Component visibility
- Temporary calculations

// Example:
const [isModalOpen, setIsModalOpen] = useState(false);
```

### State Management Decision Tree

```
Is this data from backend?
  ├─ Yes → Use React Query
  └─ No → Next question

Does multiple components need this?
  ├─ Yes → Is it global app state?
  │   ├─ Yes → Use Context
  │   └─ No → Use React Query
  └─ No → Use useState
```

---

## Data Flow

### Adding an Expense - Complete Flow

```
1. User enters expense in AddExpense.tsx
   └─ Component state: Form data

2. User clicks "Save"
   └─ Calls service: addExpense()

3. addExpense service in api.ts
   └─ Makes API call to Supabase
   └─ Supabase validates & stores

4. Supabase returns response
   └─ Service returns data

5. Component updates React Query cache
   └─ queryClient.invalidateQueries(['expenses'])

6. React Query re-fetches expenses
   └─ Dashboard component automatically updates

7. Dashboard re-renders with new expense
```

### Code Example

```tsx
// In AddExpense.tsx component
async function handleSaveExpense(data: ExpenseForm) {
  try {
    // Call service
    const result = await addExpense(data);
    
    // Invalidate cache to refetch
    queryClient.invalidateQueries(['expenses']);
    
    // Show success
    toast.success("Expense added!");
    
    // Close modal/redirect
    navigate('/dashboard');
  } catch (error) {
    toast.error("Failed to add expense");
  }
}
```

### Real-time Updates

Supabase provides real-time subscriptions:

```tsx
// Listen for new expenses
useEffect(() => {
  const subscription = supabase
    .from('expenses')
    .on('*', payload => {
      // Refetch or update local cache
      queryClient.invalidateQueries(['expenses']);
    })
    .subscribe();
  
  return () => subscription.unsubscribe();
}, []);
```

---

## Authentication & Security

### Authentication Flow

```
1. User enters credentials
   └─ Component: Auth.tsx → SignupForm.tsx

2. Form validates locally
   └─ Zod validator in lib/validators.ts

3. Submit to Supabase Auth
   └─ Service: api.ts → supabase.auth.signUp()

4. Supabase validates & creates user
   └─ JWT token generated

5. Token stored in browser (Supabase manages)
   └─ httpOnly cookie (secure)

6. AuthContext checks for session
   └─ useAuth() hook returns user if authenticated

7. ProtectedRoute checks session
   └─ If no session → redirect to /auth
   └─ If session → allow access
```

### Protected Routes

All protected pages wrap children with `ProtectedRoute`:

```tsx
// In App.tsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>

// ProtectedRoute component:
function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!session) return <Navigate to="/auth" />;
  
  return children;
}
```

### Security Features

#### 1. **Row-Level Security (RLS)**
Database rules enforce user isolation:

```sql
-- Only user can see their own expenses
CREATE POLICY "Users can only see their expenses"
  ON expenses
  FOR SELECT
  USING (auth.uid() = user_id);
```

#### 2. **Input Validation**
All forms validated before sending:

```tsx
// Zod schema in lib/validators.ts
const expenseSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  category: z.enum([...]),
});

// Used in form
const { register, handleSubmit } = useForm({
  resolver: zodResolver(expenseSchema)
});
```

#### 3. **Environment Variables**
Sensitive data in `.env.local`:

```env
# Never commit to Git
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

#### 4. **JWT Token Management**
Supabase auto-manages:
- Token generation on login
- Auto-refresh before expiry
- Secure storage

---

## Database Design

### Entity Relationship Diagram

```
users (Supabase Auth)
  │
  ├─→ expenses (1:N)
  │
  ├─→ groups (N:N) ─→ group_members (join table)
  │
  ├─→ savings_goals (1:N)
  │
├─→ trip_plans (1:N)
  │
└─→ emis (1:N)
```

### Key Tables

#### 1. **expenses**
```sql
- id (UUID): Primary key
- user_id (UUID): Foreign key to auth.users
- group_id (UUID): Optional, if group expense
- name: Description
- amount: Numeric value
- category: Transaction category
- created_at: Timestamp
```

#### 2. **groups**
```sql
- id (UUID): Primary key
- name: Group name
- created_by (UUID): Creator user_id
- created_at: Timestamp
```

#### 3. **group_members**
```sql
- id (UUID): Primary key
- group_id (UUID): Foreign key
- user_id (UUID): Foreign key
- balance_owed: How much user owes group
- joined_at: Timestamp
```

#### 4. **savings_goals**
```sql
- id (UUID): Primary key
- user_id (UUID): Foreign key
- title: Goal name
- target_amount: Goal amount
- current_amount: Saved so far
- deadline: Target date
- created_at: Timestamp
```

### Database Relationships

**One-to-Many**: User → Expenses
- User can have many expenses
- Each expense belongs to one user

**Many-to-Many**: Users ↔ Groups
- User can join multiple groups
- Group can have multiple users
- Implemented with `group_members` join table

**Cascade Delete**:
```sql
-- Delete group → delete all group expenses
ALTER TABLE expenses
ADD CONSTRAINT fk_expenses_groups
FOREIGN KEY (group_id)
REFERENCES groups(id)
ON DELETE CASCADE;
```

---

## API Architecture

### API Call Pattern

```tsx
// Service layer (api.ts)
export async function fetchExpenses(userId: string) {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// React Query setup (Dashboard.tsx)
const { data: expenses, isLoading, error } = useQuery(
  ['expenses', userId],
  () => fetchExpenses(userId),
  { staleTime: 5 * 60 * 1000 } // 5 min cache
);

// Component usage
{isLoading && <Skeleton />}
{error && <ErrorMessage error={error} />}
{expenses?.map(e => <ExpenseCard key={e.id} expense={e} />)}
```

### Error Handling

```tsx
try {
  const data = await fetchExpenses(userId);
  setExpenses(data);
} catch (error: any) {
  // Log for debugging
  console.error('Fetch error:', error);
  
  // Show user-friendly message
  toast.error('Failed to load expenses');
  
  // Optionally: Report to error tracking service
  logError(error);
}
```

### API Response Types

```typescript
// Complete error response
{
  success: false
  error: {
    code: 'VALIDATION_ERROR'
    message: 'Invalid input'
    details: {}
  }
}

// Complete success response
{
  success: true
  data: [...]
}
```

---

## Performance Considerations

### Code Splitting

Lazy-load pages to reduce initial bundle:

```tsx
// In App.tsx
const Analytics = lazy(() => import('./pages/Analytics'));

// Only loads when route is accessed
<Suspense fallback={<LoadingSpinner />}>
  <Analytics />
</Suspense>
```

### React Query Optimization

```tsx
// ✅ Good: Only refetch when needed
const { data } = useQuery(
  ['expenses', filters],
  () => fetchExpenses(filters),
  {
    staleTime: 5 * 60 * 1000, // 5 min cache
    cacheTime: 10 * 60 * 1000, // 10 min in memory
    refetchOnWindowFocus: false // Avoid on window focus
  }
);

// ❌ Bad: Refetches constantly
useQuery(['expenses'], fetchExpenses); // Defaults = aggressive refetch
```

### Infinite Scrolling / Pagination

For large lists:

```tsx
// Use useInfiniteQuery for pagination
const { data, hasNextPage, fetchNextPage } = useInfiniteQuery(
  ['expenses'],
  ({ pageParam = 0 }) => fetchExpenses(pageParam),
  {
    getNextPageParam: (lastPage, allPages) => allPages.length
  }
);
```

### Image & Asset Optimization

```tsx
// ✅ Use static imports
import logo from '@/assets/logo.png';

// ❌ Avoid
<img src="/assets/logo.png" /> // Might not optimize
```

---

## Design Patterns

### 1. **Component Composition**
Build complex UIs from simple components:

```tsx
// Small components
<Button />
<Card />
<Input />

// Composed into features
<ExpenseForm>
  <Input />
  <Select />
  <Button />
</ExpenseForm>

// Composed into pages
<Dashboard>
  <ExpenseForm />
  <ExpenseList />
  <Summary />
</Dashboard>
```

### 2. **Custom Hooks Pattern**
Extract logic into reusable hooks:

```tsx
// Before: Logic in component
function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  useEffect(() => {
    fetchData().then(setExpenses);
  }, []);
  return <div>{expenses.map(...)}</div>;
}

// After: Logic in hook
function useExpenses() {
  return useQuery(['expenses'], fetchExpenses);
}

function Dashboard() {
  const { data: expenses } = useExpenses();
  return <div>{expenses?.map(...)}</div>;
}
```

### 3. **Context + Reducer Pattern** (when needed)
For complex global state:

```tsx
const [state, dispatch] = useReducer(expenseReducer, initialState);

// Instead of:
setState({ expenses: [], loading: false, error: null });

// Do this:
dispatch({ type: 'SET_EXPENSES', payload: [...] });
```

### 4. **Separation of Concerns**
Each layer has single responsibility:

```
Component (UI only)
  ↓
Hook (Logic + State)
  ↓
Service (API calls)
  ↓
Supabase (Data)
```

---

## Scalability Considerations

### If Adding 100K+ Users

1. **Database Optimization**:
   - Add indexes on frequently queried columns
   - Consider database partitioning
   - Archive old data

2. **API Optimization**:
   - Implement pagination (not fetching all at once)
   - Add rate limiting
   - Cache frequently accessed data

3. **Frontend Optimization**:
   - Lazy-load features
   - Implement virtual scrolling for large lists
   - Compress images and assets

4. **Infrastructure**:
   - Monitor Supabase performance
   - Set up CDN for static assets
   - Consider Database replicas

---

## Testing Strategy

### Unit Tests
Test individual functions:

```tsx
// utils/__tests__/loanCalculator.test.ts
test('calculates EMI correctly', () => {
  const emi = calculateEMI({
    principal: 100000,
    rate: 10,
    months: 12
  });
  expect(emi).toBeCloseTo(8791, 0);
});
```

### Component Tests
Test component behavior:

```tsx
// components/__tests__/ExpenseCard.test.tsx
test('displays expense data', () => {
  const { getByText } = render(
    <ExpenseCard expense={mockExpense} />
  );
  expect(getByText('₹500')).toBeInTheDocument();
});
```

### Integration Tests
Test feature workflows:

```tsx
// pages/__tests__/AddExpense.test.tsx
test('adds new expense flow', async () => {
  // Render component
  // Fill form
  // Click save
  // Verify it appears in list
});
```

---

## Monitoring & Debugging

### Development Tools

1. **React DevTools**: Inspect component tree
2. **Redux DevTools**: View action history
3. **Network Tab**: Monitor API calls
4. **Console Logging**: Debug execution flow

### Production Monitoring

1. **Supabase Studio**: Database performance
2. **Vercel Analytics**: Page performance
3. **Error Tracking**: Sentry or equivalent
4. **Performance Metrics**: Core Web Vitals

---

## Security Best Practices

1. **Never expose secrets**: Keep .env.local in .gitignore
2. **Validate input**: Use Zod schemas for all forms
3. **Use RLS**: Force Row-Level Security on all tables
4. **Escape output**: React prevents XSS automatically
5. **HTTPS only**: All communications encrypted
6. **Regular updates**: Keep dependencies current

---

## Decision Log

| Decision | Reason | Date |
|----------|--------|------|
| React Context (not Redux) | Simpler, less boilerplate | Feb 2026 |
| React Query | Better for async data | Feb 2026 |
| Supabase (not custom backend) | Faster development | Feb 2026 |
| Tailwind + shadcn/ui | Consistent, fast iteration | Feb 2026 |
| TypeScript | Type safety, DX | Feb 2026 |

---

## References

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Guide](https://supabase.com/docs)
- [React Query Guide](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

*Last Updated: February 27, 2026*
