-- Normalize expense category: ACTIVITIES → ACTIVITY (align with Memory category naming)
UPDATE "Expense" SET "category" = 'ACTIVITY' WHERE "category" = 'ACTIVITIES';
