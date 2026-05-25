// src/i18n/translations.ts
import { Language } from '@/contexts/LanguageContext';

export type TranslationKey =
  | 'app.name'
  | 'common.loading'
  | 'common.error'
  | 'common.save'
  | 'common.cancel'
  | 'common.edit'
  | 'common.delete'
  | 'common.update'
  | 'common.confirm'
  | 'common.set'
  | 'common.add'
  | 'common.invalid'
  | 'common.deleted'  
  | 'common.onlineTitle'
  | 'common.onlineDesc'
  | 'common.offlineTitle'
  | 'common.offlineDesc'
  | 'common.offline'
  | 'common.switchToLight'
  | 'common.switchToDark'
  | 'common.viewAnalytics'
  | 'common.salary'
  | 'common.budget'
  | 'common.autoSaved'
  | 'common.updatedTo'
  | 'common.autoSaveFailed'
  | 'common.selectLanguage'
  | 'common.chooseLanguage'
  | 'common.apply'
  | 'common.languagePersistMessage'
  | 'common.languageChanged'
  | 'common.saveFailed'
  | 'common.continueEnglish'
  | 'nav.dashboard'
  | 'nav.saving'
  | 'nav.split'
  | 'nav.signOut'
  | 'tabs.daily'
  | 'tabs.planning'
  | 'tabs.future'
  | 'tabs.groups'
  | 'tabs.dreams'
  | 'tabs.daily.description'
  | 'tabs.planning.description'
  | 'tabs.future.description'
  | 'tabs.groups.description'
  | 'tabs.dreams.description'
  | 'tabs.dailyDescription'
  | 'tabs.planningDescription'
  | 'tabs.futureDescription'
  | 'tabs.groupsDescription'
  | 'tabs.dreamsDescription'
  | 'monthlySnapshot.title'
  | 'monthlySnapshot.description'
  | 'monthlySnapshot.income'
  | 'monthlySnapshot.expenses'
  | 'monthlySnapshot.savings'
  | 'monthlySnapshot.totalInflow'
  | 'monthlySnapshot.totalOutflow'
  | 'monthlySnapshot.netCashFlow'
  | 'monthlySnapshot.budget'
  | 'monthlySnapshot.spent'
  | 'monthlySnapshot.saved'
  | 'emiBills.title'
  | 'emiBills.description'
  | 'emiBills.dueLabel'
  | 'emiBills.pay'
  | 'emiBills.paid'
  | 'emiBills.noBills'
  | 'emiBills.addEmiLoan'
  | 'emiBills.edit'
  | 'emiBills.delete'
  | 'emiBills.editAria'
  | 'emiBills.deleteAria'
  | 'emi.loanDetails'
  | 'emi.months'
  | 'emi.tenure'
  | 'emi.flat'
  | 'emi.completed'
  | 'emi.active'
  | 'emi.loanProgress'
  | 'emi.of'
  | 'emi.principalAmount'
  | 'emi.originalLoanAmountDesc'
  | 'emi.remainingBalance'
  | 'emi.left'
  | 'emi.totalInterest'
  | 'emi.overFullTenure'
  | 'emi.monthsRemaining'
  | 'emi.currentMonthBreakdown'
  | 'emi.principal'
  | 'emi.interest'
  | 'emi.totalEMI'
  | 'emi.note'
  | 'emi.noteFlat'
  | 'emi.noteReducing'
  | 'emi.calculationError'
  | 'emi.name'
  | 'emi.amount'
  | 'emi.dayOptional'
  | 'emi.providerNamePlaceholder'
  | 'emi.providerType'
  | 'emi.bank'
  | 'emi.app'
  | 'emi.loanTypePlaceholder'
  | 'emi.interestRatePlaceholder'
  | 'emi.interestType'
  | 'emi.reducingRecommended'
  | 'emi.interestTypeHint'
  | 'emi.tenureYears'
  | 'emi.tenureMonths'
  | 'emi.startDateOptional'
  | 'emi.editTitle'
  | 'emi.editName'
  | 'emi.editAmount'
  | 'emi.editDay'
  | 'dashboard.title'
  | 'dashboard.description'
  | 'dashboard.addExpense'
  | 'dashboard.spendingTrends'
  | 'dashboard.salarySetup'
  | 'dashboard.salarySetupDesc'
  | 'dashboard.budgetSetup'
  | 'dashboard.budgetSetupDesc'
  | 'dashboard.enterAmount'
  | 'dashboard.setLimit'
  | 'dashboard.overBudget'
  | 'dashboard.spentSoFar'
  | 'dashboard.used'
  | 'dashboard.totalCommitments'
  | 'dashboard.emiNamePlaceholder'
  | 'dashboard.emiAmountPlaceholder'
  | 'dashboard.emiDayPlaceholder'
  | 'dashboard.addRecurringBill'
  | 'dashboard.addEmiWithDetails'
  | 'dashboard.dayOfMonth'
  | 'dashboard.noEmis'
  | 'dashboard.salaryUpdated'
  | 'dashboard.budgetUpdated'
  | 'dashboard.emiAdded'
  | 'dashboard.emiWithDetailsAdded'
  | 'reports.title'
  | 'reports.description'
  | 'groups.title'
  | 'groups.description'
  | 'groups.inviteWhatsApp'
  | 'groups.viewGroups'
  | 'groups.whatsappMessage'
  | 'dreams.comingSoon'
  // Health Score related
  | 'healthScore.title'
  | 'healthScore.listenBtn'
  | 'healthScore.speaking'
  | 'healthScore.scoreLabel'
  | 'healthScore.smartStep'
  | 'healthScore.noDataStatus'
  | 'healthScore.noDataMsg'
  | 'healthScore.actionIncome'
  | 'healthScore.statusCritical'
  | 'healthScore.actionCritical'
  | 'healthScore.statusStable'
  | 'healthScore.actionStable'
  | 'healthScore.statusExcellent'
  | 'healthScore.actionExcellent'
  // Additional keys (if used)
  | 'healthScore.Elite'
  | 'healthScore.healthScore'
  | 'recentExpenses.Elite'
  | 'recentExpenses.addEvent'
  | 'recentExpenses.transactions'
  // RecentExpenses keys
  | 'recentExpenses.title'
  | 'recentExpenses.noTransactions'
  | 'recentExpenses.addFirst'
  | 'WealthPredictor'
  | 'wealth_predictor.title'
  | 'wealth_predictor.subtitle'
  | 'wealth_predictor.projected_wealth_label'
  | 'wealth_predictor.projected_wealth_value'
  | 'wealth_predictor.monthly_investment'
  | 'wealth_predictor.duration'
  | 'wealth_predictor.expected_return'
  | 'wealth_predictor.principal_invested'
  | 'wealth_predictor.wealth_gained'
  | 'wealth_predictor.footer_note';

export const translations: Partial<Record<Language, Partial<Record<TranslationKey, string>>>> = {
  // English (full)
  en: {
    'app.name': 'BachatKaro',
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.update': 'Update',
    'common.confirm': 'Confirm',
    'common.set': 'Set',
    'common.add': 'Add',
    'common.invalid': 'Invalid',
    'common.deleted': 'Deleted',
    'common.onlineTitle': 'Back Online! 🟢',
    'common.onlineDesc': 'Data synced.',
    'common.offlineTitle': 'Offline Mode 🔴',
    'common.offlineDesc': 'Functionality limited.',
    'common.offline': 'Offline',
    'common.switchToLight': 'Switch to light mode',
    'common.switchToDark': 'Switch to dark mode',
    'common.viewAnalytics': 'View Analytics',
    'common.salary': 'Salary',
    'common.budget': 'Budget',
    'common.autoSaved': 'Auto-Saved! ⚡',
    'common.updatedTo': 'Updated to {{amount}}',
    'common.autoSaveFailed': 'Auto-Save Failed',
    'common.selectLanguage': 'Select Language',
    'common.chooseLanguage': 'Choose your preferred language',
    'common.apply': 'Apply',
    'common.languagePersistMessage': 'Language preference saved for future visits',
    'common.languageChanged': 'Language changed to {{name}}',
    'common.saveFailed': 'Failed to save preference',
    'common.continueEnglish': 'Continue in English',
    'nav.dashboard': 'Dashboard',
    'nav.saving': 'Saving',
    'nav.split': 'Split',
    'nav.signOut': 'Sign Out',
    'tabs.daily': 'Daily',
    'tabs.planning': 'Planning',
    'tabs.future': 'Future',
    'tabs.groups': 'Groups',
    'tabs.dreams': 'Dreams',
    'tabs.daily.description': 'Track daily expenses and view spending trends',
    'tabs.planning.description': 'Set salary, budget, and manage recurring EMIs',
    'tabs.future.description': 'Project your wealth and see future savings',
    'tabs.groups.description': 'Split bills with friends and family',
    'tabs.dreams.description': 'Track your savings goals and dreams',
    'tabs.dailyDescription': 'Track daily expenses and view spending trends',
    'tabs.planningDescription': 'Set salary, budget, and manage recurring EMIs',
    'tabs.futureDescription': 'Project your wealth and see future savings',
    'tabs.groupsDescription': 'Split bills with friends and family',
    'tabs.dreamsDescription': 'Track your savings goals and dreams',
    'monthlySnapshot.title': '{{month}} Snapshot',
    'monthlySnapshot.description': 'Monthly cash flow – actual money in and out',
    'monthlySnapshot.income': 'Income',
    'monthlySnapshot.expenses': 'Expenses',
    'monthlySnapshot.savings': 'Savings',
    'monthlySnapshot.totalInflow': 'Total Inflow',
    'monthlySnapshot.totalOutflow': 'Total Outflow',
    'monthlySnapshot.netCashFlow': 'Net Cash Flow',
    'monthlySnapshot.budget': 'Budget',
    'monthlySnapshot.spent': 'Spent',
    'monthlySnapshot.saved': 'Saved',
    'emiBills.title': 'EMI & Fixed Bills',
    'emiBills.description': 'Manage your recurring EMI commitments',
    'emiBills.dueLabel': 'Due',
    'emiBills.pay': 'Pay',
    'emiBills.paid': 'Paid',
    'emiBills.noBills': 'No EMI bills found.',
    'emiBills.addEmiLoan': 'Add EMI Loan Details',
    'emiBills.edit': 'Edit',
    'emiBills.delete': 'Delete',
    'emiBills.editAria': 'Edit bill',
    'emiBills.deleteAria': 'Delete bill',
    'emi.loanDetails': 'Loan Details',
    'emi.months': 'months',
    'emi.tenure': 'tenure',
    'emi.flat': 'Flat',
    'emi.completed': 'Completed',
    'emi.active': 'Active',
    'emi.loanProgress': 'Loan Progress',
    'emi.of': 'of',
    'emi.principalAmount': 'Principal Amount',
    'emi.originalLoanAmountDesc': 'Original loan amount',
    'emi.remainingBalance': 'Remaining Balance',
    'emi.left': 'left',
    'emi.totalInterest': 'Total Interest',
    'emi.overFullTenure': 'over full tenure',
    'emi.monthsRemaining': 'Months Remaining',
    'emi.currentMonthBreakdown': 'Current Month Breakdown',
    'emi.principal': 'Principal',
    'emi.interest': 'Interest',
    'emi.totalEMI': 'Total EMI',
    'emi.note': 'Note',
    'emi.noteFlat': 'Flat interest: interest calculated on entire principal for full tenure.',
    'emi.noteReducing': 'Reducing balance: interest calculated on outstanding principal.',
    'emi.calculationError': 'Invalid loan parameters.',
    'emi.name': 'EMI Name',
    'emi.amount': 'Monthly EMI',
    'emi.dayOptional': 'Day (optional)',
    'emi.providerNamePlaceholder': 'Provider Name (e.g. HDFC)',
    'emi.providerType': 'Provider Type',
    'emi.bank': 'Bank',
    'emi.app': 'App',
    'emi.loanTypePlaceholder': 'Loan Type (e.g. Home Loan)',
    'emi.interestRatePlaceholder': 'Interest Rate % p.a.',
    'emi.interestType': 'Interest Type',
    'emi.reducingRecommended': 'Standard EMI (Reducing) — Recommended',
    'emi.interestTypeHint': 'Most bank loans use Standard EMI (Reducing). Flat interest is usually used in some consumer or showroom loans.',
    'emi.tenureYears': 'Tenure Years',
    'emi.tenureMonths': 'Tenure Months',
    'emi.startDateOptional': 'Start Date (optional)',
    'emi.editTitle': 'Edit EMI',
    'emi.editName': 'EMI Name',
    'emi.editAmount': 'Monthly Amount',
    'emi.editDay': 'Day of Month (optional)',
    'dashboard.title': 'Dashboard',
    'dashboard.description': 'Overview of your finances',
    'dashboard.addExpense': 'Add New Expense',
    'dashboard.spendingTrends': 'Spending Trends',
    'dashboard.salarySetup': 'Monthly Salary Setup',
    'dashboard.salarySetupDesc': 'Enter your fixed monthly income.',
    'dashboard.budgetSetup': 'Monthly Budget Limit',
    'dashboard.budgetSetupDesc': 'Variable expenses limit.',
    'dashboard.enterAmount': 'Enter Amount',
    'dashboard.setLimit': 'Set Limit (e.g. 5000)',
    'dashboard.overBudget': 'Over Budget!',
    'dashboard.spentSoFar': 'Spent so far',
    'dashboard.used': 'Used',
    'dashboard.totalCommitments': 'Total Commitments',
    'dashboard.emiNamePlaceholder': 'Name',
    'dashboard.emiAmountPlaceholder': 'Amount',
    'dashboard.emiDayPlaceholder': 'Day',
    'dashboard.addRecurringBill': 'Add Recurring Bill',
    'dashboard.addEmiWithDetails': 'Add EMI with Loan Details',
    'dashboard.dayOfMonth': 'Day {{day}} of month',
    'dashboard.noEmis': 'No EMIs or Bills added yet.',
    'dashboard.salaryUpdated': 'Salary Updated',
    'dashboard.budgetUpdated': 'Budget Updated',
    'dashboard.emiAdded': 'EMI Added',
    'dashboard.emiWithDetailsAdded': 'EMI with Loan Details Added',
    'reports.title': 'Reports',
    'reports.description': 'Insights and trends',
    'groups.title': 'Split Bills with Friends',
    'groups.description': 'Trip, Party ya Room Rent? WhatsApp par group invite bhejein aur hisaab barabar karein.',
    'groups.inviteWhatsApp': 'Invite on WhatsApp',
    'groups.viewGroups': 'View Groups',
    'groups.whatsappMessage': 'Hey! 👋 I am using BachatKaro to manage expenses. Join my group to split bills! 🚀\n\n👇 Download App here:\n{{link}}',
    'dreams.comingSoon': 'More goal features coming soon! 🚀',
    // Health Score keys
    'healthScore.title': 'Health Score',
    'healthScore.listenBtn': 'Listen Advice',
    'healthScore.speaking': 'Speaking...',
    'healthScore.scoreLabel': 'SCORE',
    'healthScore.smartStep': 'Smart Step',
    'healthScore.noDataStatus': 'Starting Up',
    'healthScore.noDataMsg': 'Please add your income so we can prepare a perfect financial roadmap for you!',
    'healthScore.actionIncome': 'Set up Income',
    'healthScore.statusCritical': 'Budget Tight',
    'healthScore.actionCritical': 'Review Expenses',
    'healthScore.statusStable': 'Safe Zone',
    'healthScore.actionStable': 'Save 10% More',
    'healthScore.statusExcellent': 'Financial Guru',
    'healthScore.actionExcellent': 'Start Investing',
    // Additional keys (from screenshot, if used)
    'healthScore.Elite': 'Elite',
    'healthScore.healthScore': 'Health Score',
    'recentExpenses.Elite': 'Elite',
    'recentExpenses.addEvent': 'Add Event',
    'recentExpenses.transactions': 'Transactions',
    // RecentExpenses keys
    'recentExpenses.title': 'Recent Transactions',
    'recentExpenses.noTransactions': 'No transactions yet',
    'recentExpenses.addFirst': 'Add your first expense to get started',
    'wealth_predictor.title': 'Wealth Analytics',
    'wealth_predictor.subtitle': 'Compound Interest & Growth Projection',
    'wealth_predictor.projected_wealth_label': 'Estimated Portfolio Valuation',
    'wealth_predictor.projected_wealth_value': 'Total Wealth',
    'wealth_predictor.monthly_investment': 'Systematic Monthly Contribution',
    'wealth_predictor.duration': 'Investment Time Horizon',
    'wealth_predictor.expected_return': 'Target Annual Growth (%)',
    'wealth_predictor.principal_invested': 'Total Capital Contributed',
    'wealth_predictor.wealth_gained': 'Estimated Capital Gains',
    'wealth_predictor.footer_note': 'BachatKaro® Analysis Engine: Projections are based on historical market averages.',
  },

  // Hindi (detailed)
  hi: {
    'app.name': 'BachatKaro',
...
    'dashboard.emi.empty': 'अभी कोई EMI या बिल नहीं जोड़ा गया है।',
    'wealth_predictor.title': 'संपत्ति एनालिटिक्स',
    'wealth_predictor.subtitle': 'चक्रवृद्धि ब्याज और विकास अनुमान',
    'wealth_predictor.projected_wealth_label': 'अनुमानित पोर्टफोलियो मूल्यांकन',
    'wealth_predictor.projected_wealth_value': 'कुल संपत्ति',
    'wealth_predictor.monthly_investment': 'नियमित मासिक योगदान',
    'wealth_predictor.duration': 'निवेश समय सीमा',
    'wealth_predictor.expected_return': 'लक्ष्य वार्षिक वृद्धि (%)',
    'wealth_predictor.principal_invested': 'कुल निवेशित पूंजी',
    'wealth_predictor.wealth_gained': 'अनुमानित पूंजीगत लाभ',
    'wealth_predictor.footer_note': 'BachatKaro® एनालिसिस इंजन: अनुमान ऐतिहासिक बाजार औसत पर आधारित हैं।',
  },
    'common.loading': 'लोड हो रहा है...',
    'common.error': 'एक त्रुटि हुई',
    'common.save': 'सेव करें',
    'common.cancel': 'रद्द करें',
    'common.edit': 'संपादित करें',
    'common.delete': 'हटाएँ',
    'common.update': 'अपडेट करें',
    'common.confirm': 'पुष्टि करें',
    'common.set': 'सेट करें',
    'common.add': 'जोड़ें',
    'common.invalid': 'अमान्य',
    'common.deleted': 'हटा दिया गया',
    'common.onlineTitle': 'फिर से ऑनलाइन 🟢',
    'common.onlineDesc': 'डेटा सिंक हो गया',
    'common.offlineTitle': 'ऑफलाइन मोड 🔴',
    'common.offlineDesc': 'कुछ फीचर सीमित हैं',
    'common.offline': 'ऑफलाइन',
    'common.switchToLight': 'लाइट मोड',
    'common.switchToDark': 'डार्क मोड',
    'common.viewAnalytics': 'एनालिटिक्स देखें',
    'common.salary': 'सैलरी',
    'common.budget': 'बजट',
    'common.autoSaved': 'ऑटो सेव हुआ ⚡',
    'common.updatedTo': '{{amount}} पर अपडेट',
    'common.autoSaveFailed': 'ऑटो सेव विफल',
    'common.selectLanguage': 'भाषा चुनें',
    'common.chooseLanguage': 'अपनी भाषा चुनें',
    'common.apply': 'लागू करें',
    'common.languagePersistMessage': 'भाषा सेव हो गई',
    'common.languageChanged': 'भाषा बदली {{name}}',
    'common.saveFailed': 'सेव नहीं हो पाया',
    'common.continueEnglish': 'English में जारी रखें',
    'nav.dashboard': 'डैशबोर्ड',
    'nav.saving': 'बचत',
    'nav.split': 'स्प्लिट',
    'nav.signOut': 'साइन आउट',
    'tabs.daily': 'डेली',
    'tabs.planning': 'प्लानिंग',
    'tabs.future': 'फ्यूचर',
    'tabs.groups': 'ग्रुप्स',
    'tabs.dreams': 'ड्रीम्स',
    'tabs.daily.description': 'डेली खर्च ट्रैक करें',
    'tabs.planning.description': 'बजट और EMI सेट करें',
    'tabs.future.description': 'भविष्य की बचत देखें',
    'tabs.groups.description': 'दोस्तों के साथ खर्च बाँटें',
    'tabs.dreams.description': 'सेविंग लक्ष्य ट्रैक करें',
    'tabs.dailyDescription': 'डेली खर्च ट्रैक करें',
    'tabs.planningDescription': 'बजट और EMI सेट करें',
    'tabs.futureDescription': 'भविष्य की बचत देखें',
    'tabs.groupsDescription': 'दोस्तों के साथ खर्च बाँटें',
    'tabs.dreamsDescription': 'सेविंग लक्ष्य ट्रैक करें',
    'dashboard.title': 'डैशबोर्ड',
    'dashboard.description': 'आपके वित्त का ओवरव्यू',
    'dashboard.addExpense': 'नया खर्च जोड़ें',
    'dashboard.spendingTrends': 'खर्च ट्रेंड',
    'dashboard.salarySetup': 'मासिक सैलरी सेटअप',
    'dashboard.salarySetupDesc': 'अपनी आय दर्ज करें',
    'dashboard.budgetSetup': 'मासिक बजट',
    'dashboard.budgetSetupDesc': 'खर्च सीमा',
    'dashboard.enterAmount': 'राशि दर्ज करें',
    'dashboard.setLimit': 'सीमा सेट करें',
    'dashboard.overBudget': 'बजट से ज्यादा',
    'dashboard.spentSoFar': 'अब तक खर्च',
    'dashboard.used': 'उपयोग',
    'dashboard.totalCommitments': 'कुल प्रतिबद्धताएँ',
    'dashboard.addRecurringBill': 'रिकरिंग बिल जोड़ें',
    'dashboard.addEmiWithDetails': 'EMI जोड़ें',
    'dashboard.noEmis': 'कोई EMI नहीं',
    'reports.title': 'रिपोर्ट्स',
    'reports.description': 'इनसाइट्स',
    'groups.title': 'दोस्तों के साथ खर्च बाँटें',
    'groups.description': 'ग्रुप बनाकर खर्च बाँटें',
    'groups.inviteWhatsApp': 'व्हाट्सऐप पर आमंत्रित करें',
    'groups.viewGroups': 'ग्रुप देखें',
    'groups.whatsappMessage': 'मैं BachatKaro इस्तेमाल कर रहा हूँ — ग्रुप जॉइन करें!',
    'dreams.comingSoon': 'नए फीचर जल्द आ रहे हैं 🚀',
    // Add other keys as needed (will fallback to English)
  },

  // Hinglish (detailed)
  hinglish: {
    'app.name': 'BachatKaro',
    'common.loading': 'Loading ho raha hai...',
    'common.error': 'Error aaya',
    'common.save': 'Save karo',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit karo',
    'common.delete': 'Delete karo',
    'common.update': 'Update karo',
    'common.confirm': 'Confirm',
    'common.set': 'Set karo',
    'common.add': 'Add karo',
    'common.invalid': 'Invalid',
    'common.deleted': 'Delete ho gaya',
    'common.selectLanguage': 'Language select karo',
    'common.apply': 'Apply',
    'common.continueEnglish': 'English mein continue karo',
    'nav.dashboard': 'Dashboard',
    'nav.saving': 'Saving',
    'nav.split': 'Split',
    'nav.signOut': 'Sign Out',
    'tabs.daily': 'Daily',
    'tabs.planning': 'Planning',
    'tabs.future': 'Future',
    'tabs.groups': 'Groups',
    'tabs.dreams': 'Dreams',
    'dashboard.title': 'Dashboard',
    'dashboard.addExpense': 'Expense add karo',
    'groups.title': 'Friends ke saath split karo',
    'dreams.comingSoon': 'Feature jaldi aayega 🚀',
  },

  // Awadhi
  aw: {
    'app.name': 'BachatKaro',
    'common.loading': 'लोड होत ह',
    'common.save': 'सेव कर',
    'common.cancel': 'रद्द कर',
    'tabs.daily': 'रोज',
    'dashboard.title': 'डैशबोर्ड',
    'groups.title': 'समूह खर्च',
    'dreams.comingSoon': 'जल्दी आई',
  },

  // Bhojpuri
  bho: {
    'app.name': 'BachatKaro',
    'common.loading': 'लोड होत बा',
    'common.save': 'सेव करा',
    'common.cancel': 'रद्द करा',
    'tabs.daily': 'रोज',
    'dashboard.title': 'डैशबोर्ड',
    'groups.title': 'ग्रुप खर्च',
    'dreams.comingSoon': 'जल्दी आई 🚀',
  },

  // Urdu
  ur: {
    'app.name': 'BachatKaro',
    'common.loading': 'لوڈ ہو رہا ہے',
    'common.save': 'محفوظ کریں',
    'common.cancel': 'منسوخ کریں',
    'tabs.daily': 'روزانہ',
    'dashboard.title': 'ڈیش بورڈ',
    'groups.title': 'گروپ اخراجات',
    'dreams.comingSoon': 'جلد آرہا ہے',
  },

  // Sanskrit
  sa: {
    'app.name': 'BachatKaro',
    'common.loading': 'लोडयति...',
    'common.save': 'संचय',
    'common.cancel': 'निरस्त',
    'tabs.daily': 'दैनिकम्',
    'dashboard.title': 'डैशबोर्ड',
    'groups.title': 'समूह व्ययः',
    'dreams.comingSoon': 'शीघ्र आगच्छति',
  },

  // Bengali
  bn: {
    'app.name': 'BachatKaro',
    'common.loading': 'লোড হচ্ছে',
    'common.save': 'সেভ করুন',
    'common.cancel': 'বাতিল',
    'tabs.daily': 'দৈনিক',
    'dashboard.title': 'ড্যাশবোর্ড',
    'groups.title': 'গ্রুপ খরচ',
    'dreams.comingSoon': 'শীঘ্রই আসছে',
  },

  // Marathi
  mr: {
    'app.name': 'BachatKaro',
    'common.loading': 'लोड होत आहे',
    'common.save': 'सेव्ह करा',
    'common.cancel': 'रद्द करा',
    'tabs.daily': 'दैनिक',
    'dashboard.title': 'डॅशबोर्ड',
    'groups.title': 'गट खर्च',
    'dreams.comingSoon': 'लवकरच येत आहे',
  },

  // Gujarati
  gu: {
    'app.name': 'BachatKaro',
    'common.loading': 'લોડ થઈ રહ્યું છે',
    'common.save': 'સેવ કરો',
    'common.cancel': 'રદ કરો',
    'tabs.daily': 'દૈનિક',
    'dashboard.title': 'ડેશબોર્ડ',
    'groups.title': 'ગ્રુપ ખર્ચ',
    'dreams.comingSoon': 'જલ્દી આવશે',
  },

  // Punjabi
  pa: {
    'app.name': 'BachatKaro',
    'common.loading': 'ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ',
    'common.save': 'ਸੇਵ ਕਰੋ',
    'common.cancel': 'ਰੱਦ ਕਰੋ',
    'tabs.daily': 'ਰੋਜ਼ਾਨਾ',
    'dashboard.title': 'ਡੈਸ਼ਬੋਰਡ',
    'groups.title': 'ਗਰੁੱਪ ਖਰਚ',
    'dreams.comingSoon': 'ਜਲਦੀ ਆ ਰਿਹਾ ਹੈ',
  },

  // Tamil
  ta: {
    'app.name': 'BachatKaro',
    'common.loading': 'ஏற்றுகிறது',
    'common.save': 'சேமிக்க',
    'common.cancel': 'ரத்து',
    'tabs.daily': 'தினசரி',
    'dashboard.title': 'டாஷ்போர்டு',
    'groups.title': 'குழு செலவு',
    'dreams.comingSoon': 'விரைவில் வரும்',
  },

  // Telugu
  te: {
    'app.name': 'BachatKaro',
    'common.loading': 'లోడ్ అవుతోంది',
    'common.save': 'సేవ్ చేయండి',
    'common.cancel': 'రద్దు చేయండి',
    'tabs.daily': 'దినసరి',
    'dashboard.title': 'డాష్‌బోర్డ్',
    'groups.title': 'గ్రూప్ ఖర్చులు',
    'dreams.comingSoon': 'త్వరలో వస్తుంది',
  },

  // Kannada
  kn: {
    'app.name': 'BachatKaro',
    'common.loading': 'ಲೋಡ್ ಆಗುತ್ತಿದೆ',
    'common.save': 'ಉಳಿಸಿ',
    'common.cancel': 'ರದ್ದು',
    'tabs.daily': 'ದಿನಸಿ',
    'dashboard.title': 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    'groups.title': 'ಗುಂಪು ಖರ್ಚು',
    'dreams.comingSoon': 'ಶೀಘ್ರ ಬರುತ್ತದೆ',
  },

  // Malayalam
  ml: {
    'app.name': 'BachatKaro',
    'common.loading': 'ലോഡ് ചെയ്യുന്നു',
    'common.save': 'സേവ് ചെയ്യുക',
    'common.cancel': 'റദ്ദാക്കുക',
    'tabs.daily': 'ദിവസം',
    'dashboard.title': 'ഡാഷ്ബോർഡ്',
    'groups.title': 'ഗ്രൂപ്പ് ചെലവ്',
    'dreams.comingSoon': 'ഉടൻ വരും',
  },

  // Odia
  or: {
    'app.name': 'BachatKaro',
    'common.loading': 'ଲୋଡ୍ ହେଉଛି',
    'common.save': 'ସେଭ୍ କରନ୍ତୁ',
    'common.cancel': 'ବାତିଲ୍',
    'tabs.daily': 'ଦୈନିକ',
    'dashboard.title': 'ଡାଶବୋର୍ଡ',
    'groups.title': 'ଗ୍ରୁପ୍ ଖର୍ଚ୍ଚ',
    'dreams.comingSoon': 'ଶୀଘ୍ର ଆସୁଛି',
  },

  // Maithili
  mai: {
    'app.name': 'BachatKaro',
    'common.loading': 'लोड भ रहल अछि',
    'common.save': 'सेभ करू',
    'common.cancel': 'रद्द करू',
    'dashboard.title': 'डैशबोर्ड',
    'groups.title': 'समूह खर्च',
    'dreams.comingSoon': 'जल्द आबि रहल अछि',
  },

  // Santali
  sat: {
    'app.name': 'BachatKaro',
    'common.loading': 'ᱞᱳᱰ ᱚᱱ ᱢᱮ',
    'common.save': 'ᱥᱮᱵ',
    'common.cancel': 'ᱨᱚᱫ',
    'dashboard.title': 'ᱰᱮᱥᱵᱚᱨᱰ',
    'groups.title': 'ᱜᱨᱩᱯ ᱠᱷᱚᱨᱪ',
    'dreams.comingSoon': 'ᱡᱚᱞᱫᱤ ᱟᱹᱥᱟᱹᱨ ᱢᱮ',
  },
};

// Canonical namespace aliases to support legacy keys without breaking UI.
const TRANSLATION_KEY_ALIASES: Record<string, string> = {
  "expenseTotals.today": "dashboard.expenseTotals.today",
  "expenseTotals.thisWeek": "dashboard.expenseTotals.thisWeek",
  "expenseTotals.thisMonth": "dashboard.expenseTotals.thisMonth",
  "dateFilter.today": "dashboard.dateFilter.today",
  "dateFilter.thisWeek": "dashboard.dateFilter.thisWeek",
  "dateFilter.lastWeek": "dashboard.dateFilter.lastWeek",
  "dateFilter.thisMonth": "dashboard.dateFilter.thisMonth",
  "dateFilter.custom": "dashboard.dateFilter.custom",
  "dateFilter.filterLabel": "dashboard.dateFilter.filterLabel",
  "dateFilter.from": "dashboard.dateFilter.from",
  "dateFilter.to": "dashboard.dateFilter.to",
  "wealthPredictor.title": "WealthPredictor",
  "wealthPredictor.subtitle": "dashboard.wealthPredictor.subtitle",
  "wealthPredictor.years": "dashboard.wealthPredictor.years",
  "wealthPredictor.projectedWealthLabel": "dashboard.wealthPredictor.projectedWealthLabel",
  "wealthPredictor.projectedWealthValue": "dashboard.wealthPredictor.projectedWealthValue",
  "wealthPredictor.totalAmount": "dashboard.wealthPredictor.totalAmount",
  "wealthPredictor.monthlyInvestment": "dashboard.wealthPredictor.monthlyInvestment",
  "wealthPredictor.duration": "dashboard.wealthPredictor.duration",
  "wealthPredictor.expectedReturn": "dashboard.wealthPredictor.expectedReturn",
  "wealthPredictor.yourMoney": "dashboard.wealthPredictor.yourMoney",
  "wealthPredictor.freeMoney": "dashboard.wealthPredictor.freeMoney",
  "wealthPredictor.lakhs": "dashboard.wealthPredictor.lakhs",
  "wealthPredictor.footerStart": "dashboard.wealthPredictor.footerStart",
  "wealthPredictor.footerEnd": "dashboard.wealthPredictor.footerEnd",
  "goalProgress.title": "dashboard.goalProgress.title",
  "goalProgress.goalNameLabel": "dashboard.goalProgress.goalNameLabel",
  "goalProgress.goalNamePlaceholder": "dashboard.goalProgress.goalNamePlaceholder",
  "goalProgress.targetAmountLabel": "dashboard.goalProgress.targetAmountLabel",
  "goalProgress.targetAmountPlaceholder": "dashboard.goalProgress.targetAmountPlaceholder",
  "goalProgress.setGoalButton": "dashboard.goalProgress.setGoalButton",
  "goalProgress.targetGoal": "dashboard.goalProgress.targetGoal",
  "goalProgress.saved": "dashboard.goalProgress.saved",
  "goalProgress.target": "dashboard.goalProgress.target",
  "goalProgress.percentComplete": "dashboard.goalProgress.percentComplete",
  "goalProgress.prediction": "dashboard.goalProgress.prediction",
  "goalProgress.predictionNever": "dashboard.goalProgress.predictionNever",
  "goalProgress.goalAchieved": "dashboard.goalProgress.goalAchieved",
  "goalProgress.enterGoalName": "dashboard.goalProgress.enterGoalName",
  "goalProgress.enterValidAmount": "dashboard.goalProgress.enterValidAmount",
  "goalProgress.saveFailed": "dashboard.goalProgress.saveFailed",
  "healthScore.title": "dashboard.health.title",
  "healthScore.listenBtn": "dashboard.health.listen",
  "healthScore.speaking": "dashboard.health.speaking",
  "healthScore.scoreLabel": "dashboard.health.scoreLabel",
  "healthScore.smartStep": "dashboard.health.smartStep",
  "healthScore.noDataStatus": "dashboard.health.noDataStatus",
  "healthScore.noDataMsg": "dashboard.health.noDataMessage",
  "healthScore.actionIncome": "dashboard.health.actionIncome",
  "healthScore.statusCritical": "dashboard.health.statusCritical",
  "healthScore.actionCritical": "dashboard.health.actionCritical",
  "healthScore.statusStable": "dashboard.health.statusStable",
  "healthScore.actionStable": "dashboard.health.actionStable",
  "healthScore.statusExcellent": "dashboard.health.statusExcellent",
  "healthScore.actionExcellent": "dashboard.health.actionExcellent",
  "recentExpenses.title": "dashboard.transactions.title",
  "recentExpenses.noTransactions": "dashboard.transactions.empty",
  "recentExpenses.addFirst": "dashboard.transactions.emptyHint",
  "emiBills.title": "dashboard.emi.title",
  "dashboard.noEmis": "dashboard.emi.empty",
};

const EN_ADDITIONAL_TRANSLATIONS: Record<string, string> = {
  "dashboard.expenseTotals.today": "Today",
  "dashboard.expenseTotals.thisWeek": "This Week",
  "dashboard.expenseTotals.thisMonth": "This Month",
  "dashboard.dateFilter.today": "Today",
  "dashboard.dateFilter.thisWeek": "This Week",
  "dashboard.dateFilter.lastWeek": "Last Week",
  "dashboard.dateFilter.thisMonth": "This Month",
  "dashboard.dateFilter.custom": "Custom",
  "dashboard.dateFilter.filterLabel": "Filter",
  "dashboard.dateFilter.from": "From",
  "dashboard.dateFilter.to": "To",
  "WealthPredictor": "Wealth Prediction",
  "dashboard.wealthPredictor.subtitle": "Wealth Projection Insights",
  "dashboard.wealthPredictor.years": "Years",
  "dashboard.wealthPredictor.projectedWealthLabel": "Total Estimated Portfolio Value",
  "dashboard.wealthPredictor.projectedWealthValue": "{{amount}} in {{years}} years",
  "dashboard.wealthPredictor.totalAmount": "Total: {{amount}}",
  "dashboard.wealthPredictor.monthlyInvestment": "Monthly Systematic Contribution",
  "dashboard.wealthPredictor.duration": "Investment Time Horizon",
  "dashboard.wealthPredictor.expectedReturn": "Anticipated Annual Growth Rate (%)",
  "dashboard.wealthPredictor.yourMoney": "Principal Invested Amount",
  "dashboard.wealthPredictor.freeMoney": "Estimated Wealth Gains (Returns)",
  "dashboard.wealthPredictor.lakhs": "{{value}} L",
  "dashboard.wealthPredictor.footerStart": "BachatKaro® Analysis Engine",
  "dashboard.wealthPredictor.footerEnd": "",
  "dashboard.goalProgress.title": "Goal Progress",
  "dashboard.goalProgress.goalNameLabel": "Goal Name",
  "dashboard.goalProgress.goalNamePlaceholder": "Enter goal name",
  "dashboard.goalProgress.targetAmountLabel": "Target Amount",
  "dashboard.goalProgress.targetAmountPlaceholder": "Enter target amount",
  "dashboard.goalProgress.setGoalButton": "Set Goal",
  "dashboard.goalProgress.targetGoal": "Target Goal",
  "dashboard.goalProgress.saved": "Saved: {{amount}}",
  "dashboard.goalProgress.target": "Target: {{amount}}",
  "dashboard.goalProgress.percentComplete": "{{percent}}% complete",
  "dashboard.goalProgress.prediction": "Goal can be reached in {{months}} months",
  "dashboard.goalProgress.predictionNever": "Goal cannot be reached with current savings",
  "dashboard.goalProgress.goalAchieved": "Goal achieved",
  "dashboard.goalProgress.enterGoalName": "Enter a goal name",
  "dashboard.goalProgress.enterValidAmount": "Enter a valid amount",
  "dashboard.goalProgress.saveFailed": "Could not save goal",
  "dashboard.health.title": "Health Score",
  "dashboard.health.listen": "Listen Advice",
  "dashboard.health.speaking": "Speaking...",
  "dashboard.health.scoreLabel": "Score",
  "dashboard.health.smartStep": "Smart Step",
  "dashboard.health.noDataStatus": "Starting Up",
  "dashboard.health.noDataMessage": "Please add your income so we can prepare a financial roadmap.",
  "dashboard.health.actionIncome": "Set up Income",
  "dashboard.health.statusCritical": "Budget Tight",
  "dashboard.health.actionCritical": "Review Expenses",
  "dashboard.health.statusStable": "Safe Zone",
  "dashboard.health.actionStable": "Save 10% More",
  "dashboard.health.statusExcellent": "Financial Guru",
  "dashboard.health.actionExcellent": "Start Investing",
  "dashboard.transactions.title": "Recent Transactions",
  "dashboard.transactions.empty": "No transactions yet",
  "dashboard.transactions.emptyHint": "Add your first expense to get started",
  "dashboard.emi.title": "EMI & Fixed Bills",
  "dashboard.emi.empty": "No EMIs or Bills added yet.",
  "common.endToEndEncrypted": "End-to-end encrypted",
  "split.group.create.title": "Create Or Select Group Name",
  "split.group.create.inputPlaceholder": "Enter group name",
  "split.group.create.button": "Create",
  "split.group.select.or": "Or Select",
  "split.group.select.placeholder": "Select a group",
  "split.group.tools.title": "Group Tools",
  "split.group.tools.subtitle": "Plan & Play",
  "split.group.tools.planTrip": "Plan Trip",
  "split.group.tools.viewTripPlan": "View Trip Plan",
  "split.group.members.title": "Add Members Name",
  "split.group.members.inputPlaceholder": "Enter member name",
  "split.group.members.empty": "No members yet",
  "split.group.invite.emailPlaceholder": "Email address",
  "split.group.invite.button": "Invite",
  "split.group.invite.shareLink": "Share Invite Link",
  "split.group.delete.button": "Delete Group",
  "split.group.stats.total": "Total",
  "split.group.stats.perPerson": "Per Person",
  "split.group.expense.addTitle": "Add Expense",
  "split.group.expense.titleLabel": "Title",
  "split.group.expense.titlePlaceholder": "e.g., Dinner",
  "split.group.expense.amountLabel": "Amount",
  "split.group.expense.amountPlaceholder": "0.00",
  "split.group.expense.paidByLabel": "Paid By",
  "split.group.expense.selectMember": "Select member",
  "split.group.expense.splitLabel": "Split",
  "split.group.expense.selectSplit": "Select split",
  "split.group.expense.splitEqual": "Equal",
  "split.group.expense.splitUnequal": "Unequal",
  "split.group.expense.save": "Save Expense",
  "split.group.expense.saving": "Saving...",
  "split.group.expense.error.generic": "Something went wrong",
  "split.group.activity.title": "Recent Activity",
  "groupExpenses.addExpenseVoice": "Add Expense by Voice",
  "groupExpenses.stopListening": "Stop Listening",
  "groupExpenses.youSaid": "You said",
  "groupExpenses.paid": "paid",
  "groupExpenses.whoOwesWho": "Who Owes Who",
  "groupExpenses.groupNotFound": "Group not found",
  "groupExpenses.errorAddingExpense": "Error adding expense",
  "groupExpenses.errorSavingSplits": "Error saving splits",
  "groupExpenses.errorCreatingGroup": "Error creating group",
  "groupExpenses.confirmDeleteGroup": "Are you sure you want to delete this group?",
  "groupExpenses.groupDeleted": "Group deleted",
  "groupExpenses.memberAdded": "Member added",
  "groupExpenses.inviteSent": "Invite sent",
  "groupExpenses.inviteFailed": "Invite failed",
  "groupExpenses.linkCopied": "Invite link copied",
  "groupExpenses.expenseAdded": "Expense added",
  "common.success": "Success",
  "savings.form.addNewGoal": "Add New Goal",
  "savings.form.createTitle": "Create New Goal",
  "savings.form.createDescription": "Set a savings target to track",
  "savings.form.goalNameLabel": "Goal Name",
  "savings.form.goalNamePlaceholder": "e.g., Emergency Fund, Vacation",
  "savings.form.targetAmountLabel": "Target Amount (INR)",
  "savings.form.targetAmountPlaceholder": "e.g., 50000",
  "savings.form.createButton": "Create Goal",
  "savings.goal.created": "Goal created!",
  "savings.goal.achieved": "Goal achieved!",
  "savings.goal.toGo": "to go",
  "savings.goal.progress": "Progress",
  "savings.goal.saved": "Saved",
  "savings.goal.target": "Target",
  "savings.summary.totalSaved": "Total Saved",
  "savings.summary.totalTarget": "Total Target",
  "savings.summary.completed": "Completed",
  "savings.page.title": "Savings Goals",
  "savings.page.yourGoals": "Your Goals",
  "savings.page.active": "active",
  "savings.page.emptyTitle": "No savings goals yet",
  "savings.page.emptyHint": "Start by creating your first savings goal above!",
  "savings.page.tipsTitle": "Savings Tips",
  "savings.page.tip1": "Set realistic targets based on your monthly income",
  "savings.page.tip2": "Prioritize emergency fund before other goals",
  "savings.page.tip3": "Review and update your progress weekly",
  "savings.page.tip4": "Celebrate small wins to stay motivated!",
  "split.trip.title": "Smart Trip Planner",
  "split.trip.destinationLabel": "Destination",
  "split.trip.groupLabel": "Group",
  "split.trip.membersLabel": "Number of Members",
  "split.trip.membersPlaceholder": "e.g., 4",
  "split.trip.budgetLabel": "Budget per Person (INR)",
  "split.trip.budgetPlaceholder": "e.g., 5000",
  "split.trip.generateButton": "Generate Trip Plan",
  "split.trip.generating": "Planning...",
  "split.trip.generated": "Trip plan generated and saved!",
  "split.trip.errorTitle": "Error Saving Plan",
  "split.trip.errorGeneric": "Failed to generate plan",
  "split.trip.validation.members": "Please enter valid number of members",
  "split.trip.validation.budget": "Please enter valid budget per person",
  "split.trip.validation.groupMissing": "Group information missing.",
  "split.trip.validation.loginRequired": "You must be logged in.",
  "split.trip.validation.invalidKeyword": "Trip planning is not available for rent/bill entries",
  "split.trip.tab.flights": "Flights",
  "split.trip.tab.hotels": "Hotels",
  "split.trip.tab.villas": "Villas",
  "split.trip.tab.packages": "Packages",
  "split.trip.tab.trains": "Trains",
  "split.trip.tab.buses": "Buses",
  "split.trip.tab.cabs": "Cabs",
  "split.trip.tab.tours": "Tours",
  "split.trip.tab.cruise": "Cruise",
  "split.trip.output.title": "Your Trip Plan",
  "split.trip.output.places": "Best Places to Visit",
  "split.trip.output.noPlaces": "No places listed",
  "split.trip.output.hotels": "Recommended Hotels",
  "split.trip.output.noHotels": "No hotels listed",
  "split.trip.output.food": "Local Food",
  "split.trip.output.travel": "Local Travel",
  "split.trip.output.budget": "Budget Breakdown",
  "split.trip.output.notSpecified": "Not specified",
  "split.trip.output.advice": "Smart Advice",
  "split.trip.output.noAdvice": "No advice available",
  "split.trip.openMaps": "Open in Google Maps",
  "split.trip.shareWhatsApp": "Share via WhatsApp",
  "split.roulette.title": "Wheel of Fortune",
  "split.roulette.subtitle": "Members auto-loaded from group",
  "split.roulette.openButton": "Spin Wheel",
  "split.roulette.waiting": "Waiting for members...",
  "split.roulette.minimumMembers": "Add at least 2 members to the group first!",
  "split.roulette.winnerLabel": "And the winner is",
  "split.roulette.screenshotHint": "Take a screenshot and share!",
  "split.roulette.shareButton": "Share",
  "split.roulette.spinAgain": "Spin Again",
  "split.roulette.addNamePlaceholder": "Add extra name...",
  "split.roulette.spinning": "Spinning...",
  "split.roulette.spinAction": "Spin the Wheel",
  "split.roulette.share.title": "BachatKaro Bill Roulette",
  "split.roulette.share.winnerPrefix": "Today winner",
  "split.roulette.share.messagePrefix": "Message",
  "split.roulette.share.cta": "Download the BachatKaro app and play with your group!",
  "split.roulette.share.nativeTitle": "BachatKaro Bill Winner",
  "split.roulette.share.copied": "Text copied! Paste it in WhatsApp.",
  "split.roulette.share.copyFailed": "Failed to copy. Please take a screenshot manually.",};

const HI_ADDITIONAL_TRANSLATIONS: Record<string, string> = {
  "dashboard.expenseTotals.today": "आज",
  "dashboard.expenseTotals.thisWeek": "इस सप्ताह",
  "dashboard.expenseTotals.thisMonth": "इस महीने",
  "dashboard.dateFilter.today": "आज",
  "dashboard.dateFilter.thisWeek": "यह सप्ताह",
  "dashboard.dateFilter.lastWeek": "पिछला सप्ताह",
  "dashboard.dateFilter.thisMonth": "यह महीना",
  "dashboard.dateFilter.custom": "कस्टम",
  "dashboard.dateFilter.filterLabel": "फ़िल्टर",
  "dashboard.dateFilter.from": "से",
  "dashboard.dateFilter.to": "तक",
  "WealthPredictor": "भविष्य संपत्ति अनुमान",
  "dashboard.wealthPredictor.subtitle": "चक्रवृद्धि (Compounding) की शक्ति देखें",
  "dashboard.wealthPredictor.years": "वर्ष",
  "dashboard.wealthPredictor.projectedWealthLabel": "अनुमानित संपत्ति",
  "dashboard.wealthPredictor.projectedWealthValue": "{{years}} साल में {{amount}}",
  "dashboard.wealthPredictor.totalAmount": "कुल: {{amount}}",
  "dashboard.wealthPredictor.monthlyInvestment": "मासिक बचत",
  "dashboard.wealthPredictor.duration": "समय अवधि",
  "dashboard.wealthPredictor.expectedReturn": "अपेक्षित वार्षिक रिटर्न (%)",
  "dashboard.wealthPredictor.yourMoney": "कुल निवेश राशि",
  "dashboard.wealthPredictor.freeMoney": "अर्जित धन (रिटर्न)",
  "dashboard.wealthPredictor.lakhs": "{{value}} लाख",
  "dashboard.wealthPredictor.footerStart": "अपनी बचत को एडजस्ट करने के लिए स्लाइड करें और अपनी भविष्य की संपत्ति को बढ़ते हुए देखें।",
  "dashboard.wealthPredictor.footerEnd": "",
  "dashboard.goalProgress.title": "लक्ष्य प्रगति",
  "dashboard.goalProgress.goalNameLabel": "लक्ष्य नाम",
  "dashboard.goalProgress.goalNamePlaceholder": "लक्ष्य नाम लिखें",
  "dashboard.goalProgress.targetAmountLabel": "लक्ष्य राशि",
  "dashboard.goalProgress.targetAmountPlaceholder": "लक्ष्य राशि लिखें",
  "dashboard.goalProgress.setGoalButton": "लक्ष्य सेट करें",
  "dashboard.goalProgress.targetGoal": "लक्ष्य",
  "dashboard.goalProgress.saved": "बचत: {{amount}}",
  "dashboard.goalProgress.target": "लक्ष्य: {{amount}}",
  "dashboard.goalProgress.percentComplete": "{{percent}}% पूरा",
  "dashboard.goalProgress.prediction": "{{months}} महीनों में लक्ष्य पूरा हो सकता है",
  "dashboard.goalProgress.predictionNever": "वर्तमान बचत से लक्ष्य नहीं पहुंचेगा",
  "dashboard.goalProgress.goalAchieved": "लक्ष्य पूरा हुआ",
  "dashboard.goalProgress.enterGoalName": "लक्ष्य नाम लिखें",
  "dashboard.goalProgress.enterValidAmount": "सही राशि लिखें",
  "dashboard.goalProgress.saveFailed": "लक्ष्य सेव नहीं हो पाया",
  "dashboard.health.title": "हेल्थ स्कोर",
  "dashboard.health.listen": "सलाह सुनें",
  "dashboard.health.speaking": "बोला जा रहा है...",
  "dashboard.health.scoreLabel": "स्कोर",
  "dashboard.health.smartStep": "स्मार्ट स्टेप",
  "dashboard.health.noDataStatus": "शुरुआत",
  "dashboard.health.noDataMessage": "कृपया आय जोड़ें, ताकि सही वित्तीय मार्गदर्शन मिले।",
  "dashboard.health.actionIncome": "आय सेट करें",
  "dashboard.health.statusCritical": "बजट टाइट",
  "dashboard.health.actionCritical": "खर्च देखें",
  "dashboard.health.statusStable": "सुरक्षित स्थिति",
  "dashboard.health.actionStable": "10% और बचत करें",
  "dashboard.health.statusExcellent": "फाइनेंशियल गुरु",
  "dashboard.health.actionExcellent": "निवेश शुरू करें",
  "dashboard.transactions.title": "हाल की ट्रांजैक्शन्स",
  "dashboard.transactions.empty": "अभी कोई ट्रांजैक्शन नहीं है",
  "dashboard.transactions.emptyHint": "शुरू करने के लिए पहला खर्च जोड़ें",
  "dashboard.emi.title": "EMI और फिक्स्ड बिल",
  "dashboard.emi.empty": "अभी कोई EMI या बिल नहीं जोड़ा गया है।",
  "common.endToEndEncrypted": "एंड-टू-एंड एन्क्रिप्टेड",
  "split.group.create.title": "ग्रुप बनाएं या चुनें",
  "split.group.create.inputPlaceholder": "ग्रुप नाम लिखें",
  "split.group.create.button": "बनाएं",
  "split.group.select.or": "या चुनें",
  "split.group.select.placeholder": "ग्रुप चुनें",
  "split.group.tools.title": "ग्रुप टूल्स",
  "split.group.tools.subtitle": "प्लान और खेल",
  "split.group.tools.planTrip": "ट्रिप प्लान करें",
  "split.group.tools.viewTripPlan": "ट्रिप प्लान देखें",
  "split.group.members.title": "सदस्यों के नाम जोड़ें",
  "split.group.members.inputPlaceholder": "सदस्य का नाम लिखें",
  "split.group.members.empty": "अभी कोई सदस्य नहीं",
  "split.group.invite.emailPlaceholder": "ईमेल पता",
  "split.group.invite.button": "निमंत्रण भेजें",
  "split.group.invite.shareLink": "इनवाइट लिंक शेयर करें",
  "split.group.delete.button": "ग्रुप हटाएं",
  "split.group.stats.total": "कुल",
  "split.group.stats.perPerson": "प्रति व्यक्ति",
  "split.group.expense.addTitle": "खर्च जोड़ें",
  "split.group.expense.titleLabel": "शीर्षक",
  "split.group.expense.titlePlaceholder": "जैसे, डिनर",
  "split.group.expense.amountLabel": "राशि",
  "split.group.expense.amountPlaceholder": "0.00",
  "split.group.expense.paidByLabel": "किसने भुगतान किया",
  "split.group.expense.selectMember": "सदस्य चुनें",
  "split.group.expense.splitLabel": "स्प्लिट",
  "split.group.expense.selectSplit": "स्प्लिट चुनें",
  "split.group.expense.splitEqual": "बराबर",
  "split.group.expense.splitUnequal": "असमान",
  "split.group.expense.save": "खर्च सेव करें",
  "split.group.expense.saving": "सेव हो रहा है...",
  "split.group.expense.error.generic": "कुछ गलत हो गया",
  "split.group.activity.title": "हाल की गतिविधि",
  "groupExpenses.addExpenseVoice": "आवाज़ से खर्च जोड़ें",
  "groupExpenses.stopListening": "सुनना रोकें",
  "groupExpenses.youSaid": "आपने कहा",
  "groupExpenses.paid": "ने भुगतान किया",
  "groupExpenses.whoOwesWho": "किसे कितना देना है",
  "groupExpenses.groupNotFound": "ग्रुप नहीं मिला",
  "groupExpenses.errorAddingExpense": "खर्च जोड़ने में त्रुटि",
  "groupExpenses.errorSavingSplits": "स्प्लिट सेव करने में त्रुटि",
  "groupExpenses.errorCreatingGroup": "ग्रुप बनाने में त्रुटि",
  "groupExpenses.confirmDeleteGroup": "क्या आप यह ग्रुप हटाना चाहते हैं?",
  "groupExpenses.groupDeleted": "ग्रुप हटाया गया",
  "groupExpenses.memberAdded": "सदस्य जोड़ा गया",
  "groupExpenses.inviteSent": "निमंत्रण भेजा गया",
  "groupExpenses.inviteFailed": "निमंत्रण असफल",
  "groupExpenses.linkCopied": "इनवाइट लिंक कॉपी हुआ",
  "groupExpenses.expenseAdded": "खर्च जोड़ा गया",
};

const LANGUAGE_NATIVE_OVERRIDES: Partial<Record<Language, Record<string, string>>> = {
  bn: {
    "dashboard.health.title": "স্বাস্থ্য স্কোর",
    "dashboard.transactions.title": "সাম্প্রতিক লেনদেন",
    "dashboard.transactions.empty": "এখনও কোনো লেনদেন নেই",
    "dashboard.emi.title": "EMI ও নির্দিষ্ট বিল",
    "dashboard.emi.empty": "এখনও কোনো EMI বা বিল যোগ করা হয়নি।",
    "split.group.create.title": "গ্রুপ তৈরি করুন বা বাছুন",
    "split.group.create.button": "তৈরি করুন",
    "split.group.members.empty": "এখনও কোনো সদস্য নেই",
    "split.group.expense.addTitle": "খরচ যোগ করুন",
    "split.group.expense.save": "খরচ সংরক্ষণ করুন",
    "split.group.activity.title": "সাম্প্রতিক কার্যকলাপ",
  },
  mr: {
    "dashboard.health.title": "हेल्थ स्कोर",
    "dashboard.transactions.title": "अलीकडील व्यवहार",
    "dashboard.transactions.empty": "अजून कोणतेही व्यवहार नाहीत",
    "dashboard.emi.title": "EMI आणि निश्चित बिले",
    "dashboard.emi.empty": "अजून कोणतेही EMI किंवा बिल जोडलेले नाहीत.",
    "split.group.create.title": "ग्रुप तयार करा किंवा निवडा",
    "split.group.create.button": "तयार करा",
    "split.group.members.empty": "अजून सदस्य नाहीत",
    "split.group.expense.addTitle": "खर्च जोडा",
    "split.group.expense.save": "खर्च सेव्ह करा",
    "split.group.activity.title": "अलीकडील हालचाल",
  },
  gu: {
    "dashboard.health.title": "હેલ્થ સ્કોર",
    "dashboard.transactions.title": "તાજેતરના ટ્રાન્ઝેક્શન",
    "dashboard.transactions.empty": "હજુ સુધી કોઈ ટ્રાન્ઝેક્શન નથી",
    "dashboard.emi.title": "EMI અને નિશ્ચિત બિલ",
    "dashboard.emi.empty": "હજુ સુધી કોઈ EMI અથવા બિલ ઉમેર્યું નથી.",
    "split.group.create.title": "ગ્રુપ બનાવો અથવા પસંદ કરો",
    "split.group.create.button": "બનાવો",
    "split.group.members.empty": "હજુ સભ્યો નથી",
    "split.group.expense.addTitle": "ખર્ચ ઉમેરો",
    "split.group.expense.save": "ખર્ચ સેવ કરો",
    "split.group.activity.title": "તાજેતરની પ્રવૃત્તિ",
  },
  ta: {
    "dashboard.health.title": "ஆரோக்கிய மதிப்பெண்",
    "dashboard.transactions.title": "சமீபத்திய பரிவர்த்தனைகள்",
    "dashboard.transactions.empty": "இன்னும் பரிவர்த்தனைகள் இல்லை",
    "dashboard.emi.title": "EMI மற்றும் நிலையான பில்கள்",
    "dashboard.emi.empty": "இன்னும் EMI அல்லது பில்கள் சேர்க்கப்படவில்லை.",
    "split.group.create.title": "குழுவை உருவாக்கவும் அல்லது தேர்வு செய்யவும்",
    "split.group.create.button": "உருவாக்கு",
    "split.group.members.empty": "இன்னும் உறுப்பினர்கள் இல்லை",
    "split.group.expense.addTitle": "செலவு சேர்க்கவும்",
    "split.group.expense.save": "செலவை சேமிக்கவும்",
    "split.group.activity.title": "சமீபத்திய செயல்பாடு",
  },
  te: {
    "dashboard.health.title": "హెల్త్ స్కోర్",
    "dashboard.transactions.title": "ఇటీవలి లావాదేవీలు",
    "dashboard.transactions.empty": "ఇంకా లావాదేవీలు లేవు",
    "dashboard.emi.title": "EMI మరియు స్థిర బిల్లులు",
    "dashboard.emi.empty": "ఇంకా EMI లేదా బిల్లులు జోడించలేదు.",
    "split.group.create.title": "గ్రూప్ సృష్టించండి లేదా ఎంచుకోండి",
    "split.group.create.button": "సృష్టించండి",
    "split.group.members.empty": "ఇంకా సభ్యులు లేరు",
    "split.group.expense.addTitle": "ఖర్చు జోడించండి",
    "split.group.expense.save": "ఖర్చు సేవ్ చేయండి",
    "split.group.activity.title": "ఇటీవలి కార్యకలాపం",
  },
  kn: {
    "dashboard.health.title": "ಆರೋಗ್ಯ ಅಂಕೆ",
    "dashboard.transactions.title": "ಇತ್ತೀಚಿನ ವ್ಯವಹಾರಗಳು",
    "dashboard.transactions.empty": "ಇನ್ನೂ ಯಾವುದೇ ವ್ಯವಹಾರಗಳಿಲ್ಲ",
    "dashboard.emi.title": "EMI ಮತ್ತು ನಿಗದಿತ ಬಿಲ್ಲುಗಳು",
    "dashboard.emi.empty": "ಇನ್ನೂ EMI ಅಥವಾ ಬಿಲ್ ಸೇರಿಸಲಾಗಿಲ್ಲ.",
    "split.group.create.title": "ಗುಂಪು ರಚಿಸಿ ಅಥವಾ ಆಯ್ಕೆಮಾಡಿ",
    "split.group.create.button": "ರಚಿಸಿ",
    "split.group.members.empty": "ಇನ್ನೂ ಸದಸ್ಯರಿಲ್ಲ",
    "split.group.expense.addTitle": "ಖರ್ಚು ಸೇರಿಸಿ",
    "split.group.expense.save": "ಖರ್ಚು ಉಳಿಸಿ",
    "split.group.activity.title": "ಇತ್ತೀಚಿನ ಚಟುವಟಿಕೆ",
  },
  ml: {
    "dashboard.health.title": "ഹെൽത്ത് സ്കോർ",
    "dashboard.transactions.title": "സമീപകാല ഇടപാടുകൾ",
    "dashboard.transactions.empty": "ഇപ്പോൾ ഇടപാടുകളില്ല",
    "dashboard.emi.title": "EMIയും സ്ഥിര ബില്ലുകളും",
    "dashboard.emi.empty": "ഇപ്പോൾ EMI അല്ലെങ്കിൽ ബിൽ ചേർത്തിട്ടില്ല.",
    "split.group.create.title": "ഗ്രൂപ്പ് സൃഷ്ടിക്കുകയോ തിരഞ്ഞെടുക്കുകയോ ചെയ്യുക",
    "split.group.create.button": "സൃഷ്ടിക്കുക",
    "split.group.members.empty": "ഇന്നും അംഗങ്ങളില്ല",
    "split.group.expense.addTitle": "ചെലവ് ചേർക്കുക",
    "split.group.expense.save": "ചെലവ് സേവ് ചെയ്യുക",
    "split.group.activity.title": "സമീപകാല പ്രവർത്തനം",
  },
  or: {
    "dashboard.health.title": "ହେଲ୍ଥ ସ୍କୋର",
    "dashboard.transactions.title": "ସମ୍ପ୍ରତିକ ଲେନଦେନ",
    "dashboard.transactions.empty": "ଏଯାବତ୍ କୌଣସି ଲେନଦେନ ନାହିଁ",
    "dashboard.emi.title": "EMI ଏବଂ ନିର୍ଦ୍ଧାରିତ ବିଲ୍",
    "dashboard.emi.empty": "ଏଯାବତ୍ କୌଣସି EMI କିମ୍ବା ବିଲ୍ ଯୋଡାଯାଇନାହିଁ।",
    "split.group.create.title": "ଗ୍ରୁପ୍ ସୃଷ୍ଟି କରନ୍ତୁ କିମ୍ବା ବାଛନ୍ତୁ",
    "split.group.create.button": "ସୃଷ୍ଟି କରନ୍ତୁ",
    "split.group.members.empty": "ଏଯାବତ୍ ସଦସ୍ୟ ନାହାନ୍ତି",
    "split.group.expense.addTitle": "ଖର୍ଚ୍ଚ ଯୋଡନ୍ତୁ",
    "split.group.expense.save": "ଖର୍ଚ୍ଚ ସେଭ୍ କରନ୍ତୁ",
    "split.group.activity.title": "ସମ୍ପ୍ରତିକ କାର୍ଯ୍ୟକଳାପ",
  },
  pa: {
    "dashboard.health.title": "ਹੈਲਥ ਸਕੋਰ",
    "dashboard.transactions.title": "ਤਾਜ਼ਾ ਲੈਣ-ਦੇਣ",
    "dashboard.transactions.empty": "ਹਾਲੇ ਕੋਈ ਲੈਣ-ਦੇਣ ਨਹੀਂ",
    "dashboard.emi.title": "EMI ਅਤੇ ਫਿਕਸਡ ਬਿੱਲ",
    "dashboard.emi.empty": "ਹਾਲੇ ਕੋਈ EMI ਜਾਂ ਬਿੱਲ ਜੋੜਿਆ ਨਹੀਂ ਗਿਆ।",
    "split.group.create.title": "ਗਰੁੱਪ ਬਣਾਓ ਜਾਂ ਚੁਣੋ",
    "split.group.create.button": "ਬਣਾਓ",
    "split.group.members.empty": "ਹਾਲੇ ਕੋਈ ਮੈਂਬਰ ਨਹੀਂ",
    "split.group.expense.addTitle": "ਖਰਚਾ ਜੋੜੋ",
    "split.group.expense.save": "ਖਰਚਾ ਸੇਵ ਕਰੋ",
    "split.group.activity.title": "ਤਾਜ਼ਾ ਗਤੀਵਿਧੀ",
  },
  as: {
    "dashboard.health.title": "হেল্থ স্কোৰ",
    "dashboard.transactions.title": "শেহতীয়া লেনদেন",
    "dashboard.transactions.empty": "এতিয়ালৈ কোনো লেনদেন নাই",
    "dashboard.emi.title": "EMI আৰু স্থিৰ বিল",
    "dashboard.emi.empty": "এতিয়ালৈ কোনো EMI বা বিল যোগ কৰা হোৱা নাই।",
    "split.group.create.title": "গ্ৰুপ তৈয়াৰ কৰক বা বাছনি কৰক",
    "split.group.create.button": "তৈয়াৰ কৰক",
    "split.group.members.empty": "এতিয়ালৈ সদস্য নাই",
    "split.group.expense.addTitle": "খৰচ যোগ কৰক",
    "split.group.expense.save": "খৰচ সংৰক্ষণ কৰক",
    "split.group.activity.title": "শেহতীয়া কাৰ্যকলাপ",
  },
};

const VIEW_TRIP_PLAN_NATIVE_LABELS: Partial<Record<Language, string>> = {
  bn: "ট্রিপ প্ল্যান দেখুন",
  mr: "ट्रिप प्लॅन पहा",
  gu: "ટ્રિપ પ્લાન જુઓ",
  ta: "ட்ரிப் ப்ளான் பார்க்க",
  te: "ట్రిప్ ప్లాన్ చూడండి",
  kn: "ಟ್ರಿಪ್ ಪ್ಲ್ಯಾನ್ ನೋಡಿ",
  ml: "ട്രിപ്പ് പ്ലാൻ കാണുക",
  or: "ଟ୍ରିପ୍ ପ୍ଲାନ ଦେଖନ୍ତୁ",
  pa: "ਟ੍ਰਿਪ ਪਲਾਨ ਵੇਖੋ",
  as: "ট্ৰিপ প্লান চাওক",
};

const applyAdditionalTranslations = () => {
  if (!translations.en) translations.en = {};
  Object.assign(translations.en, EN_ADDITIONAL_TRANSLATIONS);

  // Ensure every supported language gets full coverage for the new keys.
  // Language-specific overrides can be layered after this.
  for (const lang of Object.keys(translations)) {
    if (lang === "en") continue;
    if (!translations[lang as Language]) {
      translations[lang as Language] = {};
    }
    Object.assign(translations[lang as Language], EN_ADDITIONAL_TRANSLATIONS);
  }

  if (!translations.hi) translations.hi = {};
  Object.assign(translations.hi, HI_ADDITIONAL_TRANSLATIONS);

  for (const [lang, overrides] of Object.entries(LANGUAGE_NATIVE_OVERRIDES)) {
    if (!overrides) continue;
    if (!translations[lang as Language]) {
      translations[lang as Language] = {};
    }
    Object.assign(translations[lang as Language], overrides);
  }

  for (const [lang, label] of Object.entries(VIEW_TRIP_PLAN_NATIVE_LABELS)) {
    if (!label) continue;
    if (!translations[lang as Language]) {
      translations[lang as Language] = {};
    }
    (translations[lang as Language] as Record<string, string>)["split.group.tools.viewTripPlan"] = label;
  }
};

applyAdditionalTranslations();

export const resolveTranslationKey = (key: string): string => {
  return TRANSLATION_KEY_ALIASES[key] ?? key;
};

const humanizeFallback = (key: string): string => {
  const token = key.split(".").pop() || key;
  return token
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
};

export function getTranslation(
  lang: Language,
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  const resolvedKey = resolveTranslationKey(key);
  const englishTranslations = translations.en ?? {};
  const langTranslations = translations[lang];
  let text =
    langTranslations?.[resolvedKey] ||
    langTranslations?.[key] ||
    englishTranslations[resolvedKey] ||
    englishTranslations[key] ||
    "";

  if (params) {
    text = text.replace(/\{\{(\w+)\}\}/g, (_, p) => params[p]?.toString() ?? `{{${p}}}`);
  }
  return text || humanizeFallback(resolvedKey);
}
