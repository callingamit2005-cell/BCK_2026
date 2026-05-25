# Intelligence Engine

## Architecture
- `src/intelligence/categoryLearning.ts` keeps the merchant-to-category map and exposes `learnMerchant`/`getLearnedCategory`.
- Other intelligence modules (insights, alerts, duplicate detection) run asynchronously and update `user_insights` / `user_alerts`.
- The intelligence layer is passive: it plugs into the expense save lifecycle so there is no change to the existing UI or primary save logic.

## Data flow
- Every saved expense writes to `expenses` and triggers the intelligence helpers.
- The intelligence helpers are responsible for caching results (`merchant_category_map`), computing spending insights, and flagging duplicates/alerts.
- `TransactionAutoDetector` keeps the loop closed by emitting drafts for native/web detection.

## Learning logic
- When an expense saves with a category, `categoryLearning.learnMerchant` upserts the merchant, increments its confidence, and logs the action.
- When the user edits the note/title field, `getLearnedCategory` checks for a high-confidence category and auto-applies it (if the learned value differs from the current selection).
- Confidence thresholds protect against false positives while allowing the model to adapt quickly.

## Merchant Learning Lifecycle
1. Expense save (Add Expense or auto-detected) sends `{ merchant, category }` to `categoryLearning.learnMerchant`.
2. The helper inserts or updates `merchant_category_map`, logs the learning event, and bumps confidence.
3. `AddExpense` listens to changes in the merchant/notes input and calls `getLearnedCategory`.
4. If the learned category has sufficient confidence and differs from the current selection, `setCategory` applies it and logs the application.
5. No UI logic changes were needed; the intelligence layer remains additive and easy to disable if required.

## Future improvements
- Track merchant aliases by storing raw message fingerprints and running fuzzy matching.
- Surface learning confidence in the dashboard widget or settings screen.
- Allow users to approve/deny suggested categories before commit.
