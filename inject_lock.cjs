const fs = require('fs');
const content = fs.readFileSync('src/components/dashboard/RecentExpenses.tsx', 'utf8');

const lockComment = `/**
 * ====================================================================
 * PRODUCTION LOCK
 * ====================================================================
 *
 * This component receives amounts in PAISA.
 *
 * Storage layer:
 *   Database     -> Paisa
 *   SQLite       -> Paisa
 *   Native       -> Paisa
 *   Supabase     -> Paisa
 *   Business     -> Paisa
 *
 * ONLY this component converts Paisa -> Rupees for display using
 * convertToRupees().
 *
 * DO NOT move this conversion into helpers, services, sync logic,
 * SQLite layer, or business logic.
 *
 * Breaking this rule will cause Android/Web amount inconsistencies.
 *
 * ====================================================================
 */\n\n`;

if (!content.includes('PRODUCTION LOCK')) {
    const updatedContent = lockComment + content;
    fs.writeFileSync('src/components/dashboard/RecentExpenses.tsx', updatedContent);
    console.log('Production lock injected.');
} else {
    console.log('Production lock already present.');
}