# Component Library & UI Documentation - BachatKaro

Complete reference for all React components, their props, and usage examples.

---

## Table of Contents

1. [Component Overview](#component-overview)
2. [UI Components (shadcn/ui)](#ui-components-shadcnui)
3. [Layout Components](#layout-components)
4. [Feature Components](#feature-components)
5. [Form Components](#form-components)
6. [Card & Summary Components](#card--summary-components)
7. [Best Practices](#best-practices)
8. [Creating New Components](#creating-new-components)

---

## Component Overview

### Component Hierarchy

```
App (root)
├── Layout
│   ├── Header
│   ├── Sidebar/NavBar
│   └── Content Area
│       └── Pages (Dashboard, AddExpense, etc.)
│           └── Feature Components (ExpenseCard, GroupList, etc.)
│               └── UI Components (Button, Input, Dialog, etc.)
└── Contexts & Providers
    ├── AuthProvider
    ├── QueryClientProvider
    ├── LanguageProvider
    └── ThemeProvider
```

### Component Types

| Type | Purpose | Location | Example |
|------|---------|----------|---------|
| **Page** | Full page route | `src/pages/` | Dashboard.tsx |
| **Container** | Manages state/logic | `src/components/` | ExpenseContainer |
| **Feature** | Feature-specific UI | `src/components/[feature]/` | ExpenseCard |
| **UI** | Reusable UI elements | `src/components/ui/` | Button, Input |
| **Layout** | Page structure | `src/components/layout/` | Header, Sidebar |

---

## UI Components (shadcn/ui)

All shadcn/ui base components are available in `src/components/ui/`

### Button

```tsx
import { Button } from "@/components/ui/button"

// Variants
<Button>Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>

// States
<Button disabled>Disabled</Button>
<Button isLoading>Loading...</Button>
```

### Input

```tsx
import { Input } from "@/components/ui/input"

<Input 
  type="text"
  placeholder="Enter name"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>

// With validation error styling
<Input 
  className={error ? "border-red-500" : ""}
/>
```

### Dialog / Modal

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Expense</DialogTitle>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

### Card

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Total Expenses</CardTitle>
    <CardDescription>This month</CardDescription>
  </CardHeader>
  <CardContent>
    <p>₹5,000</p>
  </CardContent>
</Card>
```

### Select

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

<Select value={category} onValueChange={setCategory}>
  <SelectTrigger>
    <SelectValue placeholder="Choose category" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="food">Food</SelectItem>
    <SelectItem value="transport">Transport</SelectItem>
    <SelectItem value="utilities">Utilities</SelectItem>
  </SelectContent>
</Select>
```

### Tabs

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

<Tabs defaultValue="personal">
  <TabsList>
    <TabsTrigger value="personal">Personal</TabsTrigger>
    <TabsTrigger value="groups">Groups</TabsTrigger>
  </TabsList>
  <TabsContent value="personal">
    {/* Personal expenses */}
  </TabsContent>
  <TabsContent value="groups">
    {/* Group expenses */}
  </TabsContent>
</Tabs>
```

### Toast

```tsx
import { useToast } from "@/components/ui/use-toast"

function MyComponent() {
  const { toast } = useToast()
  
  const handleSuccess = () => {
    toast({
      title: "Success!",
      description: "Expense added successfully",
      variant: "default"
    })
  }
  
  const handleError = () => {
    toast({
      title: "Error!",
      description: "Failed to add expense",
      variant: "destructive"
    })
  }
}
```

---

## Layout Components

### Header

```tsx
// src/components/layout/Header.tsx
import Header from "@/components/layout/Header"

<Header 
  title="Dashboard"
  subtitle="Welcome back"
  showBackButton={false}
/>
```

**Props**:
- `title`: Page title
- `subtitle`: Optional subtitle
- `showBackButton`: Show back navigation
- `actions`: Right-side action buttons

### Sidebar/Navigation

```tsx
// src/components/layout/Sidebar.tsx
import Sidebar from "@/components/layout/Sidebar"

<Sidebar 
  items={[
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 }
  ]}
/>
```

### Main Layout

```tsx
// Provides consistent page layout
import MainLayout from "@/components/layout/MainLayout"

<MainLayout>
  <h1>Page Title</h1>
  {/* Content */}
</MainLayout>
```

---

## Feature Components

### ExpenseCard

```tsx
import ExpenseCard from "@/components/ExpenseCard"

<ExpenseCard 
  expense={{
    id: '123',
    name: 'Chai',
    amount: 25,
    category: 'food',
    createdAt: '2026-02-27'
  }}
  onEdit={() => {}}
  onDelete={() => {}}
/>
```

### ExpenseList

```tsx
import ExpenseList from "@/components/ExpenseList"

<ExpenseList 
  expenses={expenses}
  onDelete={handleDelete}
  isLoading={isLoading}
  error={error}
/>
```

### GroupCard

```tsx
import GroupCard from "@/components/groups/GroupCard"

<GroupCard 
  group={groupData}
  onSelect={() => navigate(`/group/${groupData.id}`)}
  onLeave={() => {}}
/>
```

### SavingsGoalCard

```tsx
import SavingsGoalCard from "@/components/savings/SavingsGoalCard"

<SavingsGoalCard 
  goal={{
    id: '456',
    title: 'Vacation Fund',
    targetAmount: 50000,
    currentAmount: 15000,
    deadline: '2026-12-31'
  }}
  onUpdate={() => {}}
/>
```

### AnalyticsChart

```tsx
import AnalyticsChart from "@/components/AnalyticsChart"

<AnalyticsChart 
  data={expenseData}
  type="bar" // 'bar', 'line', 'pie'
  title="Monthly Spending"
/>
```

---

## Form Components

### ExpenseForm

```tsx
import ExpenseForm from "@/components/ExpenseForm"

<ExpenseForm 
  initialData={expense}
  onSubmit={handleAddExpense}
  isLoading={isLoading}
/>
```

**Form Fields**:
- Name (TextInput)
- Amount (NumberInput)
- Category (Select)
- Date (DatePicker)
- Payment Method (Select)
- Description (TextArea)
- Tags (MultiSelect)

### GroupForm

```tsx
<GroupForm 
  onSubmit={handleCreateGroup}
  submitLabel="Create Group"
/>
```

### SavingsGoalForm

```tsx
<SavingsGoalForm 
  goal={editingGoal}
  onSubmit={handleSaveGoal}
/>
```

---

## Card & Summary Components

## MonthlySnapshot

```tsx
import MonthlySnapshot from "@/components/MonthlySnapshot"

<MonthlySnapshot 
  income={50000}
  expenses={15000}
  savings={10000}
  month="February 2026"
/>
```

Shows:
- Total income
- Total expenses
- Net savings
- Pie chart breakdown by category

### EMIBillsCard

```tsx
import EMIBillsCard from "@/components/EMIBillsCard"

<EMIBillsCard 
  emis={emiList}
  totalMonthlyEMI={25000}
/>
```

Shows:
- List of active EMIs
- Monthly payment due
- Total remaining payment
- Interest breakdown

### SummaryWidget

```tsx
// Displays key metrics
<SummaryWidget 
  cards={[
    { title: 'Total Expenses', value: '₹5,000' },
    { title: 'Groups Active', value: '3' },
    { title: 'Savings Goals', value: '5' }
  ]}
/>
```

---

## Best Practices

### 1. **Props Interface**

Always define props interface:

```tsx
interface ExpenseCardProps {
  expense: Expense;
  onEdit?: (expense: Expense) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

export function ExpenseCard({ expense, onEdit, onDelete }: ExpenseCardProps) {
  // Component code
}
```

### 2. **Composition Over Inheritance**

```tsx
// ✅ Good: Compose components
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Content</p>
  </CardContent>
</Card>

// ❌ Avoid: Inheritance/extending components
class MyCard extends Card { ... }
```

### 3. **Controlled Components**

```tsx
// ✅ Good: Controlled input
const [value, setValue] = useState('');
<Input value={value} onChange={(e) => setValue(e.target.value)} />

// ❌ Avoid: Uncontrolled (hard to validate)
<input defaultValue={value} />
```

### 4. **Loading & Error States**

```tsx
if (isLoading) return <Skeleton />;
if (error) return <ErrorBoundary error={error} />;
return <Content data={data} />;
```

### 5. **Accessibility**

```tsx
// ✅ Good: Proper labels
<label htmlFor="expense-name">Expense Name</label>
<Input id="expense-name" />

// ❌ Avoid: Missing labels
<Input placeholder="Enter name" />
```

### 6. **Responsive Design**

```tsx
// ✅ Good: Use Tailwind responsive classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Responsive grid */}
</div>

// Use use-mobile hook
const isMobile = useIsMobile();
if (isMobile) return <MobileView />;
return <DesktopView />;
```

---

## Creating New Components

### Step 1: Create Component File

```tsx
// src/components/MyComponent.tsx

import React from 'react';
import { cn } from '@/lib/utils';

interface MyComponentProps {
  title: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export function MyComponent({
  title,
  children,
  variant = 'primary',
  className
}: MyComponentProps) {
  return (
    <div className={cn(
      'p-4 rounded-lg',
      variant === 'primary' ? 'bg-blue-50' : 'bg-gray-50',
      className
    )}>
      <h3 className="font-bold">{title}</h3>
      {children}
    </div>
  );
}
```

### Step 2: Export from Index

```tsx
// src/components/index.ts
export { MyComponent } from './MyComponent';
```

### Step 3: Test Component

```tsx
// Create component test file
import { render, screen } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent';

test('renders component', () => {
  render(<MyComponent title="Test">Content</MyComponent>);
  expect(screen.getByText('Test')).toBeInTheDocument();
});
```

### Step 4: Use in Page

```tsx
import { MyComponent } from '@/components';

export default function MyPage() {
  return (
    <MyComponent title="My Component">
      <p>Some content</p>
    </MyComponent>
  );
}
```

---

## Styling Guidelines

### Tailwind Classes

```tsx
// ✅ Good: Use utility classes
<div className="flex items-center gap-4 p-4 rounded-lg bg-white shadow">

// ❌ Avoid: Inline styles
<div style={{ display: 'flex', padding: '16px' }}>
```

### Theme Variables

```tsx
// Use Tailwind theme colors
<div className="bg-slate-50 dark:bg-slate-900">
  <p className="text-slate-900 dark:text-slate-50">
    Content with theme support
  </p>
</div>
```

### Responsive Breakpoints

```tsx
// Mobile first approach
<div className="
  w-full 
  md:w-1/2 
  lg:w-1/3
  p-2 
  md:p-4
  text-sm 
  md:text-base
">
```

---

## Component Testing

### Unit Tests

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('calls onClick handler', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Integration Tests

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import ExpenseForm from '@/components/ExpenseForm';

describe('ExpenseForm', () => {
  it('submits expense data', async () => {
    const handleSubmit = jest.fn();
    render(<ExpenseForm onSubmit={handleSubmit} />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/name/i), { 
      target: { value: 'Chai' }
    });
    
    // Submit
    fireEvent.click(screen.getByText(/submit/i));
    
    // Verify
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Chai' })
      );
    });
  });
});
```

---

## Common Patterns

### Loading State

```tsx
if (isLoading) {
  return <div className="animate-pulse">
    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
  </div>;
}
```

### Error State

```tsx
if (error) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded">
      <p className="text-red-800">{error.message}</p>
    </div>
  );
}
```

### Empty State

```tsx
if (!data || data.length === 0) {
  return (
    <div className="text-center py-8">
      <p className="text-gray-500">No data found</p>
    </div>
  );
}
```

---

## References

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Classes](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

*Last Updated: February 27, 2026*
