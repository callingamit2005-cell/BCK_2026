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
  | 'recentExpenses.addFirst';

export const translations: Record<Language, Record<TranslationKey, string>> = {
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
    'emi.amount': 'Total Loan Amount',
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
  },

  // Hindi (detailed)
  hi: {
    'app.name': 'BachatKaro',
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

export function getTranslation(
  lang: Language,
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  const langTranslations = translations[lang];
  let text = langTranslations?.[key] || translations.en[key] || key;

  if (params) {
    text = text.replace(/\{\{(\w+)\}\}/g, (_, p) => params[p]?.toString() ?? `{{${p}}}`);
  }
  return text;
}