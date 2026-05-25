# API Documentation - BachatKaro

Complete reference for all API endpoints, services, and data models.

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Expenses API](#expenses-api)
4. [Groups API](#groups-api)
5. [Savings Goals API](#savings-goals-api)
6. [EMI/Loans API](#emiloans-api)
7. [Trip Planning API](#trip-planning-api)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)
10. [Examples](#examples)

---

## API Overview

### Base URL

```
Frontend: http://localhost:5173 (development)
Backend: https://your-project.supabase.co (production)
```

### Authentication

All API requests require Supabase authentication:

```typescript
// Supabase handles JWT tokens automatically
const { data, error } = await supabase
  .from('expenses')
  .select('*')
  .eq('user_id', user.id);
```

### Response Format

```json
{
  "data": [...],
  "error": null
}
```

---

## Authentication

### Sign Up

**Service**: `AuthContext.tsx` → Supabase Auth

```typescript
await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
});
```

**Response**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "authenticated",
    "app_metadata": {},
    "user_metadata": {},
    "aud": "authenticated",
    "created_at": "2026-02-27T..."
  },
  "session": {
    "access_token": "jwt_token",
    "token_type": "bearer",
    "expires_in": 3600,
    "refresh_token": "refresh_token",
    "user": { ... }
  }
}
```

### Sign In

```typescript
await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});
```

### Sign Out

```typescript
await supabase.auth.signOut();
```

### Password Reset

```typescript
await supabase.auth.resetPasswordForEmail('user@example.com');
```

---

## Expenses API

###  Get All Expenses

**Endpoint**: Supabase RPC / Table query

```typescript
// Service: api.ts
const { data, error } = await supabase
  .from('expenses')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(50);
```

**Response**:
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "group_id": null,
    "name": "Chai",
    "amount": 25,
    "category": "food",
    "description": "Morning chai",
    "created_at": "2026-02-27T08:30:00Z"
  }
]
```

### Add Expense

```typescript
const { data, error } = await supabase
  .from('expenses')
  .insert([{
    user_id: userId,
    name: 'Groceries',
    amount: 500,
    category: 'food',
    description: 'Weekly groceries',
    created_at: new Date().toISOString()
  }])
  .select();
```

### Update Expense

```typescript
const { data, error } = await supabase
  .from('expenses')
  .update({
    name: 'Updated name',
    amount: 600,
    category: 'utilities'
  })
  .eq('id', expenseId)
  .eq('user_id', userId) // Security: Only own expenses
  .select();
```

### Delete Expense

```typescript
const { data, error } = await supabase
  .from('expenses')
  .delete()
  .eq('id', expenseId)
  .eq('user_id', userId);
```

### Get Expense Statistics

```typescript
// Service: api.ts
const { data, error } = await supabase
  .rpc('get_expense_stats', {
    p_user_id: userId,
    p_start_date: startDate,
    p_end_date: endDate
  });
```

**Response**:
```json
{
  "total_expenses": 5000,
  "num_transactions": 25,
  "by_category": {
    "food": 1500,
    "transport": 800,
    "utilities": 2700
  },
  "average_transaction": 200
}
```

---

## Groups API

### Create Group

```typescript
const { data, error } = await supabase
  .from('groups')
  .insert([{
    name: 'Roommates',
    created_by: userId,
    description: 'Shared expenses for apartment'
  }])
  .select();
```

### Get User's Groups

```typescript
const { data, error } = await supabase
  .from('group_members')
  .select('groups (*)')
  .eq('user_id', userId);
```

### Add Member to Group

```typescript
const { data, error } = await supabase
  .from('group_members')
  .insert([{
    group_id: groupId,
    user_id: newUserId,
    balance_owed: 0
  }])
  .select();
```

### Remove Member from Group

```typescript
const { data, error } = await supabase
  .from('group_members')
  .delete()
  .eq('group_id', groupId)
  .eq('user_id', userId);
```

### Add Group Expense

```typescript
const { data, error } = await supabase
  .from('expenses')
  .insert([{
    user_id: paidByUserId,
    group_id: groupId,
    name: 'Pizza for team',
    amount: 1000,
    category: 'food',
    split_equally: true,
    num_people: 4
  }])
  .select();
```

### Settle Group Expense

```typescript
// Update balances after settling
const { data, error } = await supabase
  .from('group_members')
  .update({
    balance_owed: 0,
    settled_at: new Date().toISOString()
  })
  .eq('group_id', groupId);
```

### Get Group Settlement

Calculate who owes whom:

```typescript
const { data, error } = await supabase
  .rpc('calculate_group_settlement', {
    p_group_id: groupId
  });
```

**Response**:
```json
{
  "settlements": [
    {
      "from_user": "Alice",
      "to_user": "Bob",
      "amount": 500
    }
  ],
  "total_pending": 500
}
```

---

## Savings Goals API

### Create Savings Goal

```typescript
const { data, error } = await supabase
  .from('savings_goals')
  .insert([{
    user_id: userId,
    title: 'Vacation Fund',
    target_amount: 50000,
    current_amount: 0,
    deadline: '2026-12-31',
    category: 'travel'
  }])
  .select();
```

### Get Savings Goals

```typescript
const { data, error } = await supabase
  .from('savings_goals')
  .select('*')
  .eq('user_id', userId)
  .order('deadline', { ascending: true });
```

### Update Savings Goal

```typescript
const { data, error } = await supabase
  .from('savings_goals')
  .update({
    current_amount: newAmount
  })
  .eq('id', goalId)
  .eq('user_id', userId)
  .select();
```

### Add to Savings Goal

```typescript
const { data: goal, error } = await supabase
  .from('savings_goals')
  .select('current_amount, target_amount')
  .eq('id', goalId)
  .single();

const newAmount = (goal?.current_amount || 0) + amountToAdd;

const { data, error: updateError } = await supabase
  .from('savings_goals')
  .update({ current_amount: newAmount })
  .eq('id', goalId)
  .select();
```

### Delete Savings Goal

```typescript
const { error } = await supabase
  .from('savings_goals')
  .delete()
  .eq('id', goalId)
  .eq('user_id', userId);
```

---

## EMI/Loans API

### Add EMI

```typescript
const { data, error } = await supabase
  .from('emis')
  .insert([{
    user_id: userId,
    name: 'Car Loan',
    principal_amount: 500000,
    interest_rate: 8.5,
    tenure_months: 60,
    frequency: 'monthly',
    start_date: '2026-02-27',
    interest_type: 'reducing', // or 'flat'
    emi_amount: 10033
  }])
  .select();
```

### Get Amortization Schedule

```typescript
const { data, error } = await supabase
  .rpc('calculate_amortization', {
    p_principal: 500000,
    p_rate: 8.5,
    p_months: 60,
    p_interest_type: 'reducing'
  });
```

**Response**:
```json
[
  {
    "month": 1,
    "emi": 10033,
    "principal": 3200,
    "interest": 6833,
    "balance": 496800
  },
  {
    "month": 2,
    "emi": 10033,
    "principal": 3260,
    "interest": 6773,
    "balance": 493540
  }
]
```

### Get EMI Details

```typescript
const { data, error } = await supabase
  .from('emis')
  .select('*')
  .eq('user_id', userId)
  .order('start_date', { ascending: false });
```

### Update EMI

```typescript
const { data, error } = await supabase
  .from('emis')
  .update({
    emi_amount: newAmount,
    principal_amount: newPrincipal
  })
  .eq('id', emiId)
  .eq('user_id', userId)
  .select();
```

---

## Trip Planning API

### Create Trip Plan

```typescript
const { data, error } = await supabase
  .from('trip_plans')
  .insert([{
    user_id: userId,
    title: 'Goa Trip',
    destination: 'Goa, India',
    start_date: '2026-06-01',
    end_date: '2026-06-05',
    num_days: 5,
    num_people: 4,
    budget: 20000
  }])
  .select();
```

### Generate Trip Itinerary

```typescript
// Service: tripPlanner.ts
const itinerary = await generateTripItinerary({
  destination: 'Goa',
  numDays: 5,
  budget: 20000,
  interests: ['beach', 'food', 'culture']
});
```

**Response**:
```json
{
  "itinerary": [
    {
      "day": 1,
      "activities": [
        "Arrival at Goa",
        "Check-in at hotel",
        "Evening beach walk"
      ],
      "meals": ["Dinner"],
      "estimated_cost": 2000
    }
  ],
  "total_cost": 20000,
  "cost_per_person": 5000
}
```

### Share Trip Plan

```typescript
const shareUrl = await tripShareService.generateShareLink({
  tripId: tripId,
  expiresIn: 7 * 24 * 60 * 60 // 7 days
});

// Share on WhatsApp
const whatsappLink = `https://wa.me/?text=${encodeURIComponent(
  `Check our trip plan: ${shareUrl}`
)}`;
```

---

## Analytics API

### Get Spending Analytics

```typescript
const { data, error } = await supabase
  .rpc('get_spending_analytics', {
    p_user_id: userId,
    p_months: 12
  });
```

**Response**:
```json
{
  "monthly_spending": [
    { "month": "Jan", "amount": 5000 },
    { "month": "Feb", "amount": 6500 }
  ],
  "category_breakdown": {
    "food": 30,
    "transport": 25,
    "utilities": 20,
    "entertainment": 15,
    "other": 10
  },
  "insights": [
    "Your food spending is 20% higher than last month"
  ]
}
```

---

## Error Handling

### Error Response Format

```json
{
  "status": "400",
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "amount",
    "message": "Amount must be positive"
  }
}
```

### Common Error Codes

| Code | Meaning | HTTP Status |
|------|---------|-------------|
| `AUTH_ERROR` | Authentication failed | 401 |
| `VALIDATION_ERROR` | Input validation failed | 400 |
| `NOT_FOUND` | Resource not found | 404 |
| `PERMISSION_ERROR` | User not authorized | 403 |
| `CONFLICT_ERROR` | Data conflict | 409 |
| `SERVER_ERROR` | Internal server error | 500 |

### Handling Errors in Code

```typescript
try {
  const { data, error } = await supabase
    .from('expenses')
    .insert([expense]);
  
  if (error) {
    switch (error.code) {
      case 'VALIDATION_ERROR':
        toast.error('Please check your input');
        break;
      case 'AUTH_ERROR':
        router.push('/auth/login');
        break;
      default:
        toast.error('Something went wrong');
    }
    return;
  }
  
  toast.success('Expense added!');
} catch (error) {
  console.error('Unexpected error:', error);
  toast.error('Unexpected error occurred');
}
```

---

## Rate Limiting

### Limits

- **Authenticated Requests**: 1000/hour per user
- **Unauthenticated**: 100/hour per IP
- **File Uploads**: 100MB/file, 1GB/day per user

### Rate Limit Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640000000
```

### Handling Rate Limits

```typescript
const { error, status } = await supabase
  .from('expenses')
  .select('*');

if (status === 429) {
  toast.error('Too many requests. Please wait a moment.');
  // Implement exponential backoff
  setTimeout(retryRequest, 5000);
}
```

---

## Pagination

### Limit & Offset

```typescript
const pageSize = 20;
const page = 1;

const { data, error, count } = await supabase
  .from('expenses')
  .select('*', { count: 'exact' })
  .range(page * pageSize, (page + 1) * pageSize - 1);

const totalPages = Math.ceil(count / pageSize);
```

### Using Cursors (Better for Large Tables)

```typescript
let query = supabase
  .from('expenses')
  .select('*')
  .order('id', { ascending: true })
  .limit(20);

if (cursor) {
  query = query.gt('id', cursor);
}

const { data, error } = await query;
```

---

## Examples

### Example 1: Add Expense and Refetch

```typescript
// Component: AddExpense.tsx
async function handleAddExpense(expenseData) {
  try {
    // Add to database
    const { error } = await supabase
      .from('expenses')
      .insert([{
        user_id: user.id,
        ...expenseData
      }]);
    
    if (error) throw error;
    
    // Refetch expenses
    queryClient.invalidateQueries(['expenses']);
    
    // Show feedback
    toast.success('Expense added!');
    closeModal();
  } catch (error) {
    toast.error('Failed to add expense');
  }
}
```

### Example 2: Split Group Bill

```typescript
async function splitBill(groupId, billData) {
  // Add group expense
  const { data: expense, error: insertError } = await supabase
    .from('expenses')
    .insert([{
      user_id: currentUser.id,
      group_id: groupId,
      ...billData,
      split_equally: true
    }])
    .select()
    .single();
  
  if (insertError) throw insertError;
  
  // Get group members
  const { data: members } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId);
  
  // Calculate per-person share
  const sharePerPerson = billData.amount / members.length;
  
  // Update member balances
  const updates = members.map(member => ({
    group_id: groupId,
    user_id: member.user_id,
    balance_owed: member.balance_owed + sharePerPerson
  }));
  
  await supabase
    .from('group_members')
    .upsert(updates, { onConflict: 'group_id,user_id' });
  
  toast.success('Bill split successfully!');
}
```

### Example 3: Generate EMI Schedule

```typescript
async function getEMISchedule(emiId) {
  const { data: emi } = await supabase
    .from('emis')
    .select('*')
    .eq('id', emiId)
    .single();
  
  const { data: schedule } = await supabase
    .rpc('calculate_amortization', {
      p_principal: emi.principal_amount,
      p_rate: emi.interest_rate,
      p_months: emi.tenure_months,
      p_interest_type: emi.interest_type
    });
  
  return schedule;
}
```

---

## Real-time Subscriptions

### Listen for New Expenses

```typescript
useEffect(() => {
  const subscription = supabase
    .from(`expenses:user_id=eq.${userId}`)
    .on('*', payload => {
      console.log('New/Updated expense:', payload.new);
      
      // Refetch or update local state
      queryClient.invalidateQueries(['expenses']);
    })
    .subscribe();
  
  return () => {
    supabase.removeSubscription(subscription);
  };
}, [userId]);
```

---

## SDK Installation

### JavaScript/TypeScript

```bash
npm install @supabase/supabase-js
# or
bun install @supabase/supabase-js
```

### Usage

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

export default supabase
```

---

## Testing API Endpoints

### Using Insomnia/Postman

1. Get your JWT token from Supabase
2. Add header: `Authorization: Bearer {token}`
3. Make requests to `https://project.supabase.co/rest/v1/table_name`

### Using cURL

```bash
curl -X POST \
  https://project.supabase.co/rest/v1/expenses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"...","name":"Chai","amount":25}'
```

---

## API Versioning

Current API Version: **v1**

Breaking changes will increment version (v2, v3, etc.)
Backward compatible changes don't increment version.

---

## References

- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase REST API](https://supabase.com/docs/guides/api)
- [Supabase Real-time](https://supabase.com/docs/guides/realtime)

---

*Last Updated: February 27, 2026*
