
-- Phase 2: Database Fix
-- Description: Remove duplicate members and splits, and add unique constraints.

-- 1. Remove duplicate members
DELETE FROM group_members
WHERE id NOT IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY group_id, user_id ORDER BY created_at ASC) as row_num
        FROM group_members
    ) t
    WHERE t.row_num = 1
);

-- 2. Add constraint to prevent future duplicate members
ALTER TABLE group_members
ADD CONSTRAINT unique_group_user UNIQUE (group_id, user_id);

-- 3. Remove duplicate splits
DELETE FROM expense_splits
WHERE id NOT IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY expense_id, user_id ORDER BY created_at ASC) as row_num
        FROM expense_splits
    ) t
    WHERE t.row_num = 1
);

-- 4. Add constraint to prevent future duplicate splits
ALTER TABLE expense_splits
ADD CONSTRAINT unique_expense_user UNIQUE (expense_id, user_id);
