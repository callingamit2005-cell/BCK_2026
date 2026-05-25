DROP INDEX IF EXISTS idx_gm_ghost_unique;
DROP INDEX IF EXISTS idx_gm_user_unique;

CREATE UNIQUE INDEX idx_gm_ghost_unique
ON group_members (group_id, ghost_id)
WHERE ghost_id IS NOT NULL;

CREATE UNIQUE INDEX idx_gm_user_unique
ON group_members (group_id, user_id)
WHERE user_id IS NOT NULL;
