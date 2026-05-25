# Database Schema Documentation - BachatKaro

Complete database schema, relationships, and management guide.

---

## Table of Contents

1. [Database Overview](#database-overview)
2. [Tables](#tables)
3. [Relationships](#relationships)
4. [Indexes](#indexes)
5. [Row-Level Security](#row-level-security)
6. [Functions & Stored Procedures](#functions--stored-procedures)
7. [Migrations](#migrations)
8. [Backup & Recovery](#backup--recovery)
9. [Performance Tips](#performance-tips)
10. [Data Dictionary](#data-dictionary)

---

## Database Overview

**Type**: PostgreSQL  
**Host**: Supabase (Cloud-hosted)  
**Access**: Via Supabase JavaScript Client or REST API  

### Database Statistics

```
Total Tables: 8
Total Records Estimated: 100K+
Storage Used: ~50MB
Last Backup: Daily (Supabase managed)
```

---

## Tables

### 1. **auth.users** (Managed by Supabase)

Stores user authentication information.

```sql
CREATE TABLE auth.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  raw_app_meta_data JSONB,
  raw_user_meta_data JSONB,
  is_super_admin BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  last_sign_in_at TIMESTAMP WITH TIME ZONE,
  ...
);
```

**Fields**:
- `id`: User unique identifier
- `email`: User's email address
- `raw_user_meta_data`: Custom user metadata (name, avatar, etc.)
- `created_at`: Account creation timestamp
- `last_sign_in_at`: Last login timestamp

**Usage**: Extended by user_profiles table

---

### 2. **user_profiles**

Extended user information beyond auth.

```sql
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  country TEXT,
  language TEXT DEFAULT 'en',
  currency TEXT DEFAULT 'INR',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Fields**:
- `id`: Foreign key to auth.users
- `full_name`: User's display name
- `avatar_url`: Profile picture URL
- `language`: Preferred language ('en', 'hi')
- `currency`: Preferred currency (INR, USD, etc.)
- `country`: Country of residence

**Policies**:
- Users can only read/write their own profile

---

### 3. **expenses**

Users' expense transactions.

```sql
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  payment_method TEXT, -- 'cash', 'card', 'upi'
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_frequency TEXT, -- 'daily', 'weekly', 'monthly'
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Fields**:
- `id`: Unique expense identifier
- `user_id`: User who recorded expense
- `group_id`: If null, personal expense; if set, group expense
- `amount`: Expense amount (₹)
- `category`: Type (food, transport, utilities, etc.)
- `is_recurring`: Whether this repeats
- `tags`: Array of tags for filtering

**Indexes**:
```sql
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_group_id ON expenses(group_id);
CREATE INDEX idx_expenses_created_at ON expenses(created_at DESC);
```

**Policies**:
- Users can only see own expenses (unless shared in group)

---

### 4. **groups**

Expense sharing groups (roommates, friends, etc.).

```sql
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  avatar_url TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'archived', 'settled'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Fields**:
- `id`: Group unique identifier
- `name`: Group name ("Roommates", "Trip 2026")
- `created_by`: User who created group
- `status`: 'active' = ongoing, 'settled' = all balances cleared

**Indexes**:
```sql
CREATE INDEX idx_groups_created_by ON groups(created_by);
```

---

### 5. **group_members**

Join table: Users in Groups (Many-to-Many)

```sql
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_owed DECIMAL(12, 2) DEFAULT 0, -- How much user owes group
  is_admin BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, user_id) -- Prevent duplicate membership
);
```

**Fields**:
- `group_id`: Which group
- `user_id`: Which user
- `balance_owed`: Amount user owes (-ve = they are owed)
- `is_admin`: Can manage group settings

**Indexes**:
```sql
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
```

---

### 6. **savings_goals**

Users' savings targets.

```sql
CREATE TABLE public.savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(12, 2) NOT NULL,
  current_amount DECIMAL(12, 2) DEFAULT 0,
  deadline DATE,
  category TEXT, -- 'vacation', 'car', 'education', etc.
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  icon_emoji TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'abandoned'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Fields**:
- `target_amount`: Goal amount (₹)
- `current_amount`: Savings so far
- `deadline`: Date to achieve goal by
- `priority`: Impact on dashboard sorting

**Example**:
```json
{
  "title": "Vacation Fund",
  "target_amount": 50000,
  "current_amount": 15000,
  "deadline": "2026-12-31",
  "category": "vacation"
}
```

---

### 7. **emis**

EMI and loan tracking.

```sql
CREATE TABLE public.emis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  principal_amount DECIMAL(12, 2) NOT NULL,
  interest_rate DECIMAL(5, 2),
  tenure_months INTEGER NOT NULL,
  frequency TEXT DEFAULT 'monthly',
  start_date DATE NOT NULL,
  end_date DATE,
  interest_type TEXT, -- 'reducing', 'flat', 'simple'
  emi_amount DECIMAL(12, 2),
  total_interest DECIMAL(12, 2),
  total_amount DECIMAL(12, 2),
  paid_amount DECIMAL(12, 2) DEFAULT 0,
  lender_name TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Fields**:
- `principal_amount`: Loan amount
- `interest_rate`: Annual interest rate (%)
- `tenure_months`: Loan duration
- `interest_type`: Calculation method
- `emi_amount`: Monthly payment
- `total_amount`: Principal + interest

**Example EMI Calculation**:
```
Principal: ₹5,00,000
Rate: 10% p.a.
Tenure: 5 years (60 months)
Monthly EMI: ₹10,622
Total Interest: ₹1,37,320
```

---

### 8. **trip_plans**

Trip planning and budgeting.

```sql
CREATE TABLE public.trip_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  destination TEXT,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  num_days INTEGER,
  num_people INTEGER,
  budget DECIMAL(12, 2),
  budget_per_person DECIMAL(12, 2),
  itinerary JSONB,
  status TEXT DEFAULT 'planning', -- 'planning', 'ongoing', 'completed'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Fields**:
- `itinerary`: JSON structure with daily plans
- `budget_per_person`: Auto-calculated (budget / num_people)
- `status`: Trip progress tracking

**Itinerary Structure**:
```json
{
  "days": [
    {
      "day": 1,
      "activities": ["Arrive at airport", "Check-in"]
    }
  ]
}
```

---

## Relationships

### Entity Relationship Diagram

```
┌─────────────────┐
│  auth.users     │
│ (Supabase Auth) │
└────────┬────────┘
         │
  ┌──────┼──────────────────────────────┐
  │      │                              │
  ▼      ▼                              ▼
expenses groups              user_profiles
  │      │
  │      ▼
  │  group_members
  │      │
  └──────┴────────────────────┐
                               │
  ┌─────────────────────────┐  │
  │  ┌──────────────────────┘  │
  │  │                         │
  ▼  ▼                         ▼
savings_goals              trip_plans
emis
```

### Relationships in Detail

#### 1. One-to-Many: User → Expenses
- One user has many expenses
- Delete user → delete all expenses (CASCADE)

```sql
ALTER TABLE expenses
ADD CONSTRAINT fk_expenses_user
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

#### 2. One-to-Many: User → Groups (through group_members)
- One user in multiple groups
- Join table to maintain many-to-many

#### 3. One-to-Many: Group → Expenses
- One group has many expenses
- Delete group → expense loses group_id (SET NULL)

```sql
ALTER TABLE expenses
ADD CONSTRAINT fk_expenses_group
FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;
```

#### 4. One-to-Many: User → Savings Goals
- One user has many goals
- Delete user → delete goals

#### 5. One-to-Many: User → EMIs
- One user has many loans
- Delete user → delete EMIs

---

## Indexes

### Performance Indexes

```sql
-- Frequently queried columns
CREATE INDEX idx_expenses_user_created 
ON expenses(user_id, created_at DESC);

CREATE INDEX idx_groups_user 
ON groups(created_by);

CREATE INDEX idx_group_members_user 
ON group_members(user_id);

CREATE INDEX idx_savings_user 
ON savings_goals(user_id, status);

CREATE INDEX idx_emis_user 
ON emis(user_id, start_date);

-- For filtering
CREATE INDEX idx_expenses_category 
ON expenses(category);

CREATE INDEX idx_trip_plans_user 
ON trip_plans(user_id, status);
```

### Index Maintenance

```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM expenses WHERE user_id = $1 ORDER BY created_at DESC;

-- Rebuild indexes if needed
REINDEX INDEX idx_expenses_user_created;

-- Check index size
SELECT schemaname, tablename, indexname, pg_size_pretty(pg_relation_size(indexrelid)) 
FROM pg_indexes 
WHERE tablename = 'expenses';
```

---

## Row-Level Security

All tables have RLS enabled. Users can only access their own data.

### Expense RLS Policy

```sql
-- Users can only see their own expenses
CREATE POLICY "Users see own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id OR group_id IN (
    SELECT group_id FROM group_members WHERE user_id = auth.uid()
  ));

-- Users can only insert their own expenses
CREATE POLICY "Users insert own expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own expenses
CREATE POLICY "Users update own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Group RLS Policy

```sql
-- Users see groups they're members of
CREATE POLICY "Users see their groups"
  ON groups FOR SELECT
  USING (auth.uid() = created_by OR id IN (
    SELECT group_id FROM group_members WHERE user_id = auth.uid()
  ));

-- Only group creator can update
CREATE POLICY "Only creator updates group"
  ON groups FOR UPDATE
  USING (auth.uid() = created_by);
```

---

## Functions & Stored Procedures

### Function 1: Calculate Group Settlement

```sql
CREATE OR REPLACE FUNCTION calculate_group_settlement(p_group_id UUID)
RETURNS TABLE (
  from_user_id UUID,
  to_user_id UUID,
  amount DECIMAL(12, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT gm1.user_id, gm2.user_id, ABS(gm1.balance_owed)
  FROM group_members gm1
  JOIN group_members gm2 ON gm1.group_id = gm2.group_id
  WHERE gm1.group_id = p_group_id 
    AND gm1.balance_owed > 0 
    AND gm2.balance_owed < 0
  LIMIT 100;
END;
$$ LANGUAGE plpgsql;
```

### Function 2: Calculate EMI Amount

```sql
CREATE OR REPLACE FUNCTION calculate_emi(
  p_principal DECIMAL,
  p_rate DECIMAL,
  p_months INTEGER
)
RETURNS DECIMAL AS $$
DECLARE
  v_monthly_rate DECIMAL;
  v_emi DECIMAL;
BEGIN
  v_monthly_rate := p_rate / 100 / 12;
  
  IF v_monthly_rate = 0 THEN
    v_emi := p_principal / p_months;
  ELSE
    v_emi := p_principal * (v_monthly_rate * (1 + v_monthly_rate)^p_months) 
      / (((1 + v_monthly_rate)^p_months) - 1);
  END IF;
  
  RETURN ROUND(v_emi, 2);
END;
$$ LANGUAGE plpgsql;
```

### Function 3: Get Expense Stats

```sql
CREATE OR REPLACE FUNCTION get_expense_stats(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  total_amount DECIMAL,
  num_transactions INTEGER,
  by_category JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(amount), 0) as total_amount,
    COUNT(*) as num_transactions,
    jsonb_object_agg(category, amount) as by_category
  FROM expenses
  WHERE user_id = p_user_id
    AND DATE(created_at) BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql;
```

---

## Migrations

### Creating Migration Files

```bash
# Generate migration file
supabase migration new add_new_table

# File created: supabase/migrations/20260227120000_add_new_table.sql
```

### Running Migrations

```bash
# Push to production
supabase db push

# Reset local database
supabase db reset

# Pull changes from production
supabase db pull
```

### Migration Example

```sql
-- supabase/migrations/20260227120000_add_new_feature.sql

-- Create new table
CREATE TABLE IF NOT EXISTS feature_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE feature_table ENABLE ROW LEVEL SECURITY;

-- Add policy
CREATE POLICY "Users see own records"
  ON feature_table FOR SELECT
  USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_feature_table_user ON feature_table(user_id);
```

---

## Backup & Recovery

### Automated Backups

Supabase automatically backs up daily:

```
Retention: 30 days free
Location: Encrypted cloud storage
Frequency: Daily
```

### Manual Backup

```bash
# Export database
pg_dump \
  postgresql://user:password@host:5432/postgres > backup.sql

# Import backup
psql postgresql://user:password@host:5432/postgres < backup.sql
```

### Point-in-Time Recovery

1. Go to Supabase Dashboard
2. Settings → Backups
3. Select point in time
4. Click "Restore"

---

## Performance Tips

### Query Optimization

```sql
-- ❌ Slow: N+1 query
SELECT * FROM groups WHERE created_by = $1;
-- Then for each group, query: SELECT * FROM group_members WHERE group_id = $group_id;

-- ✅ Fast: Join query
SELECT g.*, gm.* FROM groups g
LEFT JOIN group_members gm ON g.id = gm.group_id
WHERE g.created_by = $1;
```

### Indexing Strategy

- Index foreign keys
- Index columns used in WHERE clauses
- Index columns used in ORDER BY
- Consider composite indexes for common combined filters

### Pagination for Large Tables

```sql
-- ❌ Slow for large offsets
SELECT * FROM expenses OFFSET 100000 LIMIT 20;

-- ✅ Fast: Cursor-based
SELECT * FROM expenses WHERE id > $last_id ORDER BY id LIMIT 20;
```

### Connection Pooling

Use Supabase connection pooling in production:

```
Settings → Database → Connection Pooling
Mode: Transaction
Max Pool Size: Auto (recommended)
```

---

## Data Dictionary

| Table | Field | Type | Purpose |
|-------|-------|------|---------|
| expenses | amount | DECIMAL(12,2) | Transaction amount |
| expenses | category | TEXT | Type classification |
| groups | status | TEXT | active/archived/settled |
| savings_goals | current_amount | DECIMAL(12,2) | Saved so far |
| emis | interest_type | TEXT | reducing/flat/simple |
| trip_plans | budget | DECIMAL(12,2) | Total trip cost |

---

## Maintenance Checklist

- [ ] Monitor database size weekly
- [ ] Check slow query logs monthly
- [ ] Analyze index performance monthly
- [ ] Test backup restoration quarterly
- [ ] Update RLS policies as features change
- [ ] Archive old data annually

---

## Disaster Recovery Plan

1. **Detection**: Monitor Supabase alerts
2. **Assessment**: Check backup logs
3. **Restoration**: Use point-in-time recovery
4. **Verification**: Run data integrity checks
5. **Communication**: Notify users if needed

---

*Last Updated: February 27, 2026*
