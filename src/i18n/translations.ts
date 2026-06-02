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
  | 'common.syncing'
  | 'common.offline'
  | 'common.saveFailed'
  | 'common.deleteError'
  | 'common.confirmWipe'
  | 'common.wipeError'
  | 'common.aiActive'
  | 'common.hardwareAccelerated'
  | 'nav.dashboard'
  | 'nav.saving'
  | 'nav.split'
  | 'nav.signOut'
  | 'tabs.daily'
  | 'tabs.planning'
  | 'tabs.future'
  | 'tabs.groups'
  | 'tabs.dreams'
  | 'tabs.dailyDescription'
  | 'tabs.planningDescription'
  | 'tabs.futureDescription'
  | 'tabs.groupsDescription'
  | 'tabs.dreamsDescription'
  | 'onboarding.experience'
  | 'onboarding.selectRegion'
  | 'onboarding.whereAreYouFrom'
  | 'onboarding.preferredLanguage'
  | 'onboarding.talkToUsIn'
  | 'onboarding.finishSetup'
  | 'onboarding.regionHelp'
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
  | 'emi.emiOutflow'
  | 'emi.audit'
  | 'emi.monthlyCharge'
  | 'emi.simulatorTitle'
  | 'emi.prepaymentAmountLabel'
  | 'emi.remaining'
  | 'emi.interestSaved'
  | 'emi.totalInterestNoPrepay'
  | 'emi.noConfig'
  | 'emi.loanAudit'
  | 'emi.interestLogic'
  | 'emi.reducing'
  | 'emi.inceptionDate'
  | 'emi.monthlyEmiDay'
  | 'emi.saveChanges'
  | 'emi.commitAudit'
  | 'emi.opSuccess'
  | 'emi.incomplete'
  | 'dashboard.incomeEngineSub'
  | 'dashboard.safeSpendSub'
  | 'planning.engineTitle'
  | 'planning.configureVitals'
  | 'planning.monthlyLiquidity'
  | 'planning.deployLimit'
  | 'planning.activeObligations'
  | 'planning.emis'
  | 'planning.subs'
  | 'planning.planningFooter'
  | 'planning.savedLocally'
  | 'planning.income'
  | 'planning.budget'
  | 'planning.updatedSyncing'
  | 'savings.page.title'
  | 'savings.wealthEngine'
  | 'savings.initialization'
  | 'savings.newAmbition'
  | 'savings.syncingVault'
  | 'savings.noActiveAmbitions'
  | 'savings.goalCreated'
  | 'savings.goalDeleted'
  | 'savings.goalDeletedDesc'
  | 'common.success'
  | 'emi.tenureYears'
  | 'emi.tenureMonths'
  | 'emi.startDateOptional'
  | 'emi.editTitle'
  | 'emi.editName'
  | 'emi.editAmount'
  | 'emi.editDay'
  | 'emi.loanTitleLabel'
  | 'emi.interestLogicLabel'
  | 'emi.inceptionDateLabel'
  | 'emi.monthlyEmiDayLabel'
  | 'emi.monthlyChargeLabel'
  | 'emi.noLoanConfig'
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
  | 'dashboard.salarySaveError'
  | 'dashboard.aiEngine'
  | 'dashboard.intelligenceFeed'
  | 'dashboard.forensicLogic'
  | 'dashboard.integrity'
  | 'dashboard.analyzingCycles'
  | 'dashboard.criticalNudges'
  | 'dashboard.cyclePrediction'
  | 'dashboard.momentum'
  | 'dashboard.recentTransactions'
  | 'dashboard.syncing'
  | 'dashboard.realtime'
  | 'dashboard.transactionUpdated'
  | 'dashboard.failedToUpdate'
  | 'dashboard.totalCredit'
  | 'dashboard.totalDebit'
  | 'dashboard.emiNamePlaceholder'
  | 'recentExpenses.timelineEmpty'
  | 'recentExpenses.addFirst'
  | 'emi.validationError'
  | 'emi.dayError'
  | 'emi.saveError'
  | 'dashboard.safetyPrivacy'
  | 'dashboard.dataPrivacyTip'
  | 'reports.title'
  | 'reports.description'
  | 'groups.title'
  | 'groups.description'
  | 'groups.inviteWhatsApp'
  | 'groups.viewGroups'
  | 'groups.whatsappMessage'
  | 'dreams.comingSoon'
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
  | 'healthScore.Elite'
  | 'healthScore.healthScore'
  | 'recentExpenses.Elite'
  | 'recentExpenses.addEvent'
  | 'recentExpenses.transactions'
  | 'recentExpenses.title'
  | 'recentExpenses.noTransactions'
  | 'charts.syncingIntel'
  | 'charts.dataEngineSilent'
  | 'charts.feedSystemToUnlock'
  | 'charts.automatedSectorAudit'
  | 'charts.monthlyBurn'
  | 'charts.pulseAudit'
  | 'charts.marketInsight'
  | 'charts.syncingTrends'
  | 'charts.noTrendsDetected'
  | 'charts.addDataToVisualize'
  | 'charts.validatedTimeSeries'
  | 'charts.forensicPatternDetection'
  | 'spending.zeroRecords'
  | 'spending.addTransactionsToGenerate'
  | 'permission.education.title'
  | 'permission.education.subtitle'
  | 'permission.sms.title'
  | 'permission.sms.desc'
  | 'permission.audio.title'
  | 'permission.audio.desc'
  | 'permission.notif.title'
  | 'permission.notif.desc'
  | 'permission.trust.otp'
  | 'permission.trust.chat'
  | 'permission.grant.button'
  | 'market_intel.growth_intel'
  | 'market_intel.wealth_builder'
  | 'market_intel.live_audit'
  | 'market_intel.velocity_progress'
  | 'market_intel.milestone'
  | 'market_intel.strategic_plan'
  | 'market_intel.suggested_sip'
  | 'market_intel.risk_appetite'
  | 'market_intel.recommended_actions'
  | 'market_intel.activate_sip'
  | 'market_intel.sip_desc'
  | 'market_intel.deploy_emergency'
  | 'market_intel.emergency_desc'
  | 'market_intel.institutional_onramps'
  | 'market_intel.sebi_regulated'
  | 'market_intel.security_protocol'
  | 'market_intel.disclaimer'
  | 'market_intel.os_footer'
  | 'settlement.title'
  | 'settlement.view_only'
  | 'settlement.mark_paid'
  | 'settlement.admin_only'
  | 'settlement.finalizing'
  | 'settlement.reconstructing'
  | 'settlement.search_placeholder'
  | 'settlement.zero_debt'
  | 'settlement.no_match'
  | 'settlement.pending'
  | 'settlement.settled'
  | 'settlement.pay_now'
  | 'settlement.nudge'
  | 'settlement.remind'
  | 'settlement.show_less'
  | 'settlement.expand_ledger'
  | 'settlement.full_ledger'
  | 'settlement.entities'
  | 'settlement.active_positions'
  | 'settlement.minimize'
  | 'settlement.explore'
  | 'settlement.search_identity'
  | 'settlement.no_identity_match'
  | 'settlement.credit'
  | 'settlement.debit'
  | 'settlement.neutral'
  | 'auth.identification'
  | 'auth.security_key'
  | 'auth.create_account'
  | 'auth.success_msg'
  | 'auth.back_to_home'
  | 'auth.institutional_encryption'
  | 'join.verifying'
  | 'join.invalidLink'
  | 'join.failed'
  | 'join.expired'
  | 'join.authRequired'
  | 'join.alreadyMember'
  | 'join.success'
  | 'join.verificationFailed'
  | 'join.issue'
  | 'join.invitation'
  | 'join.secureOnboarding'
  | 'join.establishing'
  | 'join.returnHome'
  | 'onboarding.status_bar_clearance'
  | 'auth.forgot_password_link';

export const translations: Partial<Record<Language, Partial<Record<TranslationKey, string>>>> = {
  en: {
    'app.name': 'BachatKaro',
    'auth.forgot_password_link': 'Forgot password?',
    'common.loading': 'Loading Protocol...',
    'common.error': 'System Error',
    'common.save': 'Deploy',
    'common.cancel': 'Abort',
    'common.edit': 'Modify',
    'common.delete': 'Terminate',
    'common.update': 'Patch',
    'common.confirm': 'Verify',
    'common.set': 'Configure',
    'common.add': 'Initialize',
    'common.invalid': 'Invalid Data',
    'common.deleted': 'Record Removed',
    'common.syncing': 'Syncing to cloud...',
    'common.offline': 'Offline Mode',
    'common.saveFailed': 'Set Failed.',
    'common.deleteError': 'Record could not be removed.',
    'common.confirmWipe': '⚠️ This will WIPE ALL your financial records (SMS, Manual, Income, Planning) from this device and cloud. Proceed?',
    'common.wipeError': 'System error during data wipe.',
    'common.aiActive': 'AI Active',
    'common.hardwareAccelerated': 'Hardware Accelerated Logic',
    'common.success': 'Success',
    'nav.dashboard': 'Terminal',
    'nav.saving': 'Wealth',
    'nav.split': 'Settlements',
    'nav.signOut': 'Sign Out',
    'tabs.daily': 'Daily',
    'tabs.planning': 'Planning',
    'tabs.future': 'Future',
    'tabs.groups': 'Groups',
    'tabs.dreams': 'Dreams',
    'tabs.dailyDescription': 'Real-time ledger audit',
    'tabs.planningDescription': 'Strategic burn cap configuration',
    'tabs.futureDescription': 'Predictive liquidity roadmap',
    'tabs.groupsDescription': 'Collaborative expense protocols',
    'tabs.dreamsDescription': 'Wealth ambition tracking',
    'onboarding.experience': 'Premium Onboarding Experience',
    'onboarding.selectRegion': 'Select Your Region',
    'onboarding.whereAreYouFrom': 'Where are you from?',
    'onboarding.preferredLanguage': 'Preferred Language',
    'onboarding.talkToUsIn': 'Talk to us in...',
    'onboarding.finishSetup': 'Finish Setup',
    'onboarding.regionHelp': 'Region helps us optimize your local currency and split logic.',
    'onboarding.status_bar_clearance': 'Clearing status bar for immersive UI',
    'monthlySnapshot.title': 'Monthly Snapshot',
    'monthlySnapshot.description': 'Verified financial cycle audit',
    'monthlySnapshot.income': 'Monthly Income',
    'monthlySnapshot.expenses': 'Total Spent',
    'monthlySnapshot.savings': 'Net Saved',
    'monthlySnapshot.totalInflow': 'Total Inflow',
    'monthlySnapshot.totalOutflow': 'Total Outflow',
    'monthlySnapshot.netCashFlow': 'Net Cash Flow',
    'monthlySnapshot.budget': 'Monthly Budget',
    'monthlySnapshot.spent': 'Spent',
    'monthlySnapshot.saved': 'Saved',
    'emiBills.title': 'EMI & Bills',
    'emiBills.description': 'Strategic debt & obligation tracker',
    'emiBills.dueLabel': 'Due',
    'emiBills.pay': 'Pay',
    'emiBills.paid': 'Paid',
    'emiBills.noBills': 'No active obligations detected',
    'emiBills.addEmiLoan': 'Add EMI/Loan',
    'emiBills.edit': 'Edit Obligation',
    'emiBills.delete': 'Remove Obligation',
    'emi.loanDetails': 'Loan Details',
    'emi.months': 'Months',
    'emi.tenure': 'Tenure',
    'emi.flat': 'Flat',
    'emi.completed': 'Completed',
    'emi.active': 'Active',
    'emi.loanProgress': 'Loan Progress',
    'emi.of': 'of',
    'emi.principalAmount': 'Principal',
    'emi.originalLoanAmountDesc': 'Original loan amount',
    'emi.remainingBalance': 'Remaining Balance',
    'emi.left': 'left',
    'emi.totalInterest': 'Total Interest',
    'emi.overFullTenure': 'over full tenure',
    'emi.monthsRemaining': 'months remaining',
    'emi.currentMonthBreakdown': 'Current Month Breakdown',
    'emi.principal': 'Principal',
    'emi.interest': 'Interest',
    'emi.totalEMI': 'Total EMI',
    'emi.note': 'Note',
    'emi.calculationError': 'Calculation Error',
    'emi.name': 'Loan Title',
    'emi.amount': 'Amount',
    'emi.dayOptional': 'Day (Optional)',
    'emi.providerNamePlaceholder': 'e.g. HDFC Bank',
    'emi.providerType': 'Provider',
    'emi.bank': 'Bank',
    'emi.app': 'App',
    'emi.loanTypePlaceholder': 'Loan Type',
    'emi.interestRatePlaceholder': 'Rate (%)',
    'emi.interestType': 'Interest Type',
    'emi.reducingRecommended': 'Reducing',
    'emi.interestTypeHint': 'Reducing is highly recommended',
    'emi.emiOutflow': 'EMI OUTFLOW',
    'emi.audit': 'Audit',
    'emi.monthlyCharge': 'Monthly Charge',
    'emi.simulatorTitle': 'Prepayment & Foreclosure Simulator',
    'emi.prepaymentAmountLabel': 'Prepayment Amount (₹)',
    'emi.remaining': 'Remaining',
    'emi.interestSaved': 'Saved',
    'emi.totalInterestNoPrepay': 'Total Interest No Prepay',
    'emi.noConfig': 'No Loan Configuration Found',
    'emi.loanAudit': 'Loan Audit',
    'emi.interestLogic': 'Interest Logic',
    'emi.reducing': 'Reducing',
    'emi.inceptionDate': 'Inception Date',
    'emi.monthlyEmiDay': 'Monthly EMI Day',
    'emi.saveChanges': 'Save Changes',
    'emi.commitAudit': 'Commit Audit',
    'emi.opSuccess': 'Operation Successful! 🚀',
    'emi.incomplete': 'Incomplete Details',
    'emi.tenureYears': 'Years',
    'emi.tenureMonths': 'Months',
    'emi.startDateOptional': 'Start Date',
    'emi.editTitle': 'Update Debt Profile',
    'emi.editName': 'Update Loan Name',
    'emi.editAmount': 'Update Principal',
    'emi.editDay': 'Update EMI Day',
    'emi.loanTitleLabel': 'Loan Title',
    'emi.interestLogicLabel': 'Interest Logic',
    'emi.inceptionDateLabel': 'Inception Date',
    'emi.monthlyEmiDayLabel': 'Monthly EMI Day',
    'emi.monthlyChargeLabel': 'Monthly Charge',
    'emi.noLoanConfig': 'No Loan Configuration Found',
    'emi.validationError': 'Missing required fields for loan record. Please check Loan Title and Amounts.',
    'emi.dayError': 'EMI Day must be between 1 and 31.',
    'emi.saveError': 'Could not save loan details.',
    'dashboard.incomeEngineSub': 'Verified Monthly Inflow',
    'dashboard.safeSpendSub': 'Strategic Monthly Burn Cap',
    'dashboard.title': 'Financial Terminal',
    'dashboard.description': 'Institutional grade wealth management',
    'dashboard.addExpense': 'Record Transaction',
    'dashboard.spendingTrends': 'Spending Trends',
    'dashboard.salarySetup': 'Income Basis',
    'dashboard.salarySetupDesc': 'Establish monthly liquidity basis',
    'dashboard.budgetSetup': 'Burn Limit',
    'dashboard.budgetSetupDesc': 'Set maximum monthly expenditure',
    'dashboard.enterAmount': 'Establish Monthly Basis',
    'dashboard.setLimit': 'Configure Limit',
    'dashboard.overBudget': 'Limit Exceeded',
    'dashboard.spentSoFar': 'Exhausted',
    'dashboard.used': 'Used',
    'dashboard.totalCommitments': 'Total Obligations',
    'dashboard.emiNamePlaceholder': 'e.g. Dream Car',
    'dashboard.emiAmountPlaceholder': 'EMI Amount',
    'dashboard.emiDayPlaceholder': '1-31',
    'dashboard.addRecurringBill': 'Add Bill',
    'dashboard.addEmiWithDetails': 'Secure New Loan',
    'dashboard.dayOfMonth': 'Day',
    'dashboard.noEmis': 'Zero active obligations',
    'dashboard.salaryUpdated': 'Salary saved successfully',
    'dashboard.budgetUpdated': 'Budget Locked!',
    'dashboard.emiAdded': 'Loan Recorded Locally! 🚀',
    'dashboard.emiWithDetailsAdded': 'Loan with details added',
    'dashboard.salarySaveError': 'Error saving income record.',
    'dashboard.aiEngine': 'Deep Insight Engine',
    'dashboard.intelligenceFeed': 'Intelligence Feed',
    'dashboard.forensicLogic': 'Forensic Logic',
    'dashboard.integrity': 'Integrity',
    'dashboard.analyzingCycles': 'Analyzing your recent financial cycles...',
    'dashboard.criticalNudges': 'Critical Nudges',
    'dashboard.cyclePrediction': 'Cycle Prediction',
    'dashboard.momentum': 'Momentum',
    'dashboard.recentTransactions': 'Activity Ledger',
    'dashboard.syncing': 'Synchronizing...',
    'dashboard.realtime': 'Real-time',
    'dashboard.transactionUpdated': 'Ledger patched',
    'dashboard.failedToUpdate': 'Patch failed',
    'dashboard.totalCredit': 'Total Credit',
    'dashboard.totalDebit': 'Total Debit',
    'dashboard.safetyPrivacy': 'Safety & Privacy',
    'dashboard.dataPrivacyTip': 'This data is for your information and tracking only. We do not directly access your bank accounts or transactions.',
    'planning.engineTitle': 'Planning Engine',
    'planning.configureVitals': 'Configure Monthly Vitals',
    'planning.monthlyLiquidity': 'Monthly Liquidity',
    'planning.deployLimit': 'Deploy Monthly Limit',
    'planning.activeObligations': 'Active Obligations',
    'planning.emis': 'EMIs',
    'planning.subs': 'Subs',
    'planning.planningFooter': 'Values saved here update your offline ledger instantly and sync with cloud.',
    'planning.savedLocally': 'Saved Locally! 🚀',
    'planning.income': 'Income',
    'planning.budget': 'Budget',
    'planning.updatedSyncing': 'updated. Syncing...',
    'planning.syncFailed': 'Sync Failed!',
    'savings.page.title': 'Wealth Ambitions',
    'savings.wealthEngine': 'Wealth Engine',
    'savings.initialization': 'Deploying new ambition...',
    'savings.newAmbition': 'New Ambition',
    'savings.syncingVault': 'Syncing Vault...',
    'savings.noActiveAmbitions': 'Zero active ambitions',
    'savings.goalCreated': 'Ambition recorded locally! Syncing...',
    'savings.goalDeleted': 'Ambition Terminated',
    'savings.goalDeletedDesc': 'Goal removed locally. Syncing...',
    'recentExpenses.timelineEmpty': 'Timeline Empty',
    'recentExpenses.addFirst': 'Record your first transaction',
    'recentExpenses.Elite': 'Premium Activity',
    'recentExpenses.addEvent': 'Record Event',
    'recentExpenses.transactions': 'Events',
    'recentExpenses.title': 'Activity Ledger',
    'recentExpenses.noTransactions': 'No events detected',
    'reports.title': 'Sector Audits',
    'reports.description': 'Institutional grade financial reporting',
    'groups.title': 'Strategic Groups',
    'groups.description': 'Collaborative expense management',
    'groups.inviteWhatsApp': 'Dispatch Invite',
    'groups.viewGroups': 'Explore Groups',
    'groups.whatsappMessage': 'Join my strategic group on BachatKaro!',
    'dreams.comingSoon': 'Developing Ambition Interface...',
    'healthScore.title': 'Financial Pulse',
    'healthScore.listenBtn': 'Listen to Mentor',
    'healthScore.speaking': 'Transmitting Wisdom...',
    'healthScore.scoreLabel': 'Stability Index',
    'healthScore.smartStep': 'Strategic Next Step',
    'healthScore.noDataStatus': 'Calibration Required',
    'healthScore.noDataMsg': 'Feed the ledger to calibrate pulse.',
    'healthScore.actionIncome': 'Establish Income Basis',
    'healthScore.statusCritical': 'Critical Instability',
    'healthScore.actionCritical': 'Execute Emergency Cutbacks',
    'healthScore.statusStable': 'Stable Equilibrium',
    'healthScore.actionStable': 'Optimize Retention Rate',
    'healthScore.statusExcellent': 'Elite Trajectory',
    'healthScore.actionExcellent': 'Maximize Strategic Deployment',
    'healthScore.Elite': 'Elite Grade',
    'healthScore.healthScore': 'Pulse Index',
    'charts.syncingIntel': 'Syncing Intel',
    'charts.dataEngineSilent': 'Data Engine Silent',
    'charts.feedSystemToUnlock': 'Feed the system to unlock market insights',
    'charts.automatedSectorAudit': 'Automated Sector Audit',
    'charts.monthlyBurn': 'Monthly Burn',
    'charts.pulseAudit': 'Pulse Audit',
    'charts.marketInsight': 'Market Insight',
    'charts.syncingTrends': 'Syncing Trends',
    'charts.noTrendsDetected': 'No Trends Detected',
    'charts.addDataToVisualize': 'Add data to visualize your financial trajectory',
    'charts.validatedTimeSeries': 'Validated Time Series',
    'charts.forensicPatternDetection': 'Forensic Pattern Detection',
    'spending.zeroRecords': 'Zero Records',
    'spending.addTransactionsToGenerate': 'Add transactions to generate intelligence',
    'permission.education.title': 'Privacy First',
    'permission.education.subtitle': 'Institutional Grade Security',
    'permission.sms.title': 'Financial SMS',
    'permission.sms.desc': 'Only processed for debit/credit transactions to automate your ledger.',
    'permission.audio.title': 'Voice Input',
    'permission.audio.desc': 'Used only when you tap the BK button to record an expense.',
    'permission.notif.title': 'Notifications',
    'permission.notif.desc': 'Real-time alerts for overspending and sync status.',
    'permission.trust.otp': 'OTP Privacy',
    'permission.trust.chat': 'Personal Chats',
    'permission.grant.button': 'Acknowledge & Continue',
    'market_intel.growth_intel': 'Growth Intel',
    'market_intel.wealth_builder': 'Personalized Wealth Builder',
    'market_intel.live_audit': 'Live Audit',
    'market_intel.velocity_progress': 'Your Velocity Progress',
    'market_intel.milestone': 'Milestone',
    'market_intel.strategic_plan': 'Strategic Money Plan',
    'market_intel.suggested_sip': 'Suggested SIP',
    'market_intel.risk_appetite': 'Risk Appetite',
    'market_intel.recommended_actions': 'Recommended Actions',
    'market_intel.activate_sip': 'Activate SIP Track',
    'market_intel.sip_desc': 'Small recurring wealth blocks',
    'market_intel.deploy_emergency': 'Deploy Emergency Fund',
    'market_intel.emergency_desc': 'Secure 3-month survival buffer',
    'market_intel.institutional_onramps': 'Institutional On-ramps',
    'market_intel.sebi_regulated': 'SEBI Regulated Architecture Only',
    'market_intel.security_protocol': 'Security Protocol',
    'market_intel.disclaimer': 'Investments are settled on your preferred institutional platforms. BachatKaro operates as an execution-only planning terminal.',
    'market_intel.os_footer': 'Financial Operating System · Institutional Grade',
    'settlement.title': 'Settlements',
    'settlement.view_only': 'View Only',
    'settlement.mark_paid': 'Mark as Paid',
    'settlement.admin_only': 'Admin Only',
    'settlement.finalizing': 'Finalizing Ledger Commit...',
    'settlement.reconstructing': 'Reconstructing Unified Data...',
    'settlement.search_placeholder': 'Search members or credentials...',
    'settlement.zero_debt': 'Zero Debt Load',
    'settlement.no_match': 'No matching data detected',
    'settlement.pending': 'Pending',
    'settlement.settled': 'Settled',
    'settlement.pay_now': 'Settle',
    'settlement.nudge': 'Nudge',
    'settlement.remind': 'Remind',
    'settlement.show_less': 'Consolidate View',
    'settlement.expand_ledger': 'Expand Ledger',
    'settlement.full_ledger': 'Full Strategic Ledger',
    'settlement.entities': 'Entities',
    'settlement.active_positions': 'Active Positions',
    'settlement.minimize': 'Minimize',
    'settlement.explore': 'Explore',
    'settlement.search_identity': 'Search identity or credential...',
    'settlement.no_identity_match': 'Zero identity matches found',
    'settlement.credit': 'Credit',
    'settlement.debit': 'Debit',
    'settlement.neutral': 'Neutral',
    'auth.identification': 'Identification',
    'auth.security_key': 'Security Key',
    'auth.create_account': 'Create Account',
    'auth.success_msg': 'Account Created!',
    'auth.back_to_home': 'Navigate back to home',
    'auth.institutional_encryption': 'Institutional-Grade Encryption',
    'join.verifying': 'Verifying Identity...',
    'join.invalidLink': 'Invalid Invite Protocol',
    'join.failed': 'Verification Error',
    'join.expired': 'Invite Expired',
    'join.authRequired': 'Authentication Required',
    'join.alreadyMember': 'Identity Already Registered',
    'join.success': 'Identity Verified',
    'join.verificationFailed': 'Validation Failure',
    'join.issue': 'System Conflict',
    'join.invitation': 'Strategic Invitation',
    'join.secureOnboarding': 'Secure Onboarding',
    'join.establishing': 'Establishing Connection...',
    'join.returnHome': 'Abort & Home',
  },
  hi: {
    'app.name': 'बचतकरो',
    'auth.forgot_password_link': 'पासवर्ड भूल गए?',
    'common.loading': 'प्रोटोकॉल लोड हो रहा है...',
    'common.error': 'सिस्टम त्रुटि',
    'common.save': 'सेव करें',
    'common.cancel': 'रद्द करें',
    'common.edit': 'बदलें',
    'common.delete': 'हटाएं',
    'common.update': 'अपडेट',
    'common.confirm': 'सत्यापित करें',
    'common.set': 'सेट करें',
    'common.add': 'जोड़ें',
    'common.invalid': 'अमान्य डेटा',
    'common.deleted': 'रिकॉर्ड हटा दिया गया',
    'common.syncing': 'क्लाउड पर सिंक हो रहा है...',
    'common.offline': 'ऑफ़लाइन मोड',
    'common.saveFailed': 'सेव विफल।',
    'common.deleteError': 'रिकॉर्ड हटाया नहीं जा सका।',
    'common.confirmWipe': '⚠️ यह आपके सभी वित्तीय रिकॉर्ड (SMS, मैनुअल, आय, प्लानिंग) को इस डिवाइस और क्लाउड से मिटा देगा। क्या आप सहमत हैं?',
    'common.wipeError': 'डेटा मिटाने के दौरान सिस्टम त्रुटि।',
    'common.aiActive': 'AI सक्रिय',
    'common.hardwareAccelerated': 'हार्डवेयर त्वरित लॉजिक',
    'common.success': 'सफल',
    'nav.dashboard': 'टर्मिनल',
    'nav.saving': 'संपत्ति',
    'nav.split': 'लेन-देन',
    'nav.signOut': 'लॉग आउट',
    'tabs.daily': 'दैनिक',
    'tabs.planning': 'प्लानिंग',
    'tabs.future': 'भविष्य',
    'tabs.groups': 'ग्रुप',
    'tabs.dreams': 'सपने',
    'tabs.dailyDescription': 'रियल-टाइम खर्च ऑडिट',
    'tabs.planningDescription': 'मासिक खर्च सीमा सेटअप',
    'tabs.futureDescription': 'भविष्य की तरलता योजना',
    'tabs.groupsDescription': 'ग्रुप खर्च मैनेजमेंट',
    'tabs.dreamsDescription': 'संपत्ति लक्ष्य ट्रैकिंग',
    'onboarding.experience': 'प्रीमियम ऑनबोर्डिंग अनुभव',
    'onboarding.selectRegion': 'अपना क्षेत्र चुनें',
    'onboarding.whereAreYouFrom': 'आप कहाँ से हैं?',
    'onboarding.preferredLanguage': 'पसंदीदा भाषा',
    'onboarding.talkToUsIn': 'हमसे बात करें...',
    'onboarding.finishSetup': 'सेटअप पूरा करें',
    'onboarding.regionHelp': 'क्षेत्र हमें आपकी स्थानीय मुद्रा और स्प्लिट लॉजिक को अनुकूलित करने में मदद करता है।',
    'onboarding.status_bar_clearance': 'बेहतर UI के लिए स्टेटस बार क्लियर हो रहा है',
    'monthlySnapshot.title': 'मासिक विवरण',
    'monthlySnapshot.description': 'सत्यापित वित्तीय ऑडिट',
    'monthlySnapshot.income': 'मासिक आय',
    'monthlySnapshot.expenses': 'कुल खर्च',
    'monthlySnapshot.savings': 'कुल बचत',
    'monthlySnapshot.totalInflow': 'कुल आमदनी',
    'monthlySnapshot.totalOutflow': 'कुल खर्च',
    'monthlySnapshot.netCashFlow': 'शुद्ध नकद प्रवाह',
    'monthlySnapshot.budget': 'मासिक बजट',
    'monthlySnapshot.spent': 'खर्च किया',
    'monthlySnapshot.saved': 'बचाया',
    'emiBills.title': 'EMI और बिल',
    'emiBills.description': 'रणनीतिक ऋण ट्रैकर',
    'emiBills.dueLabel': 'बाकी',
    'emiBills.pay': 'भुगतान करें',
    'emiBills.paid': 'चुकाया',
    'emiBills.noBills': 'कोई सक्रिय ऋण नहीं मिला',
    'emiBills.addEmiLoan': 'EMI/लोन जोड़ें',
    'emiBills.edit': 'ऋण बदलें',
    'emiBills.delete': 'ऋण हटाएं',
    'emi.loanDetails': 'लोन विवरण',
    'emi.months': 'महीने',
    'emi.tenure': 'अवधि',
    'emi.flat': 'फ्लैट',
    'emi.completed': 'पूरा हुआ',
    'emi.active': 'सक्रिय',
    'emi.loanProgress': 'लोन प्रगति',
    'emi.of': 'का',
    'emi.principalAmount': 'मूलधन',
    'emi.originalLoanAmountDesc': 'मूल लोन राशि',
    'emi.remainingBalance': 'बाकी राशि',
    'emi.left': 'बाकी',
    'emi.totalInterest': 'कुल ब्याज',
    'emi.overFullTenure': 'पूरी अवधि में',
    'emi.monthsRemaining': 'महीने बाकी',
    'emi.currentMonthBreakdown': 'इस महीने का विवरण',
    'emi.principal': 'मूलधन',
    'emi.interest': 'ब्याज',
    'emi.totalEMI': 'कुल EMI',
    'emi.note': 'नोट',
    'emi.calculationError': 'गणना त्रुटि',
    'emi.name': 'लोन का शीर्षक',
    'emi.amount': 'राशि',
    'emi.dayOptional': 'दिन (वैकल्पिक)',
    'emi.providerNamePlaceholder': 'जैसे: HDFC बैंक',
    'emi.providerType': 'प्रदाता',
    'emi.bank': 'बैंक',
    'emi.app': 'ऐप',
    'emi.loanTypePlaceholder': 'लोन का प्रकार',
    'emi.interestRatePlaceholder': 'दर (%)',
    'emi.interestType': 'ब्याज का प्रकार',
    'emi.reducingRecommended': 'कम होता ब्याज',
    'emi.interestTypeHint': 'कम होता ब्याज अनुशंसित है',
    'emi.emiOutflow': 'EMI आउटफ्लो',
    'emi.audit': 'ऑडिट',
    'emi.monthlyCharge': 'मासिक शुल्क',
    'emi.simulatorTitle': 'प्रीपेमेंट सिम्युलेटर',
    'emi.prepaymentAmountLabel': 'प्रीपेment राशि (₹)',
    'emi.remaining': 'शेष',
    'emi.interestSaved': 'बचाया गया',
    'emi.totalInterestNoPrepay': 'कुल ब्याज (प्रीपेमेंट के बिना)',
    'emi.noConfig': 'कोई लोन कॉन्फ़िगरेशन नहीं मिला',
    'emi.loanAudit': 'लोन ऑडिट',
    'emi.interestLogic': 'ब्याज लॉजिक',
    'emi.reducing': 'कम होता ब्याज',
    'emi.inceptionDate': 'शुरुआत की तारीख',
    'emi.monthlyEmiDay': 'मासिक EMI दिन',
    'emi.saveChanges': 'बदलाव सेव करें',
    'emi.commitAudit': 'ऑडिट कमिट करें',
    'emi.opSuccess': 'सफलतापूर्वक पूरा हुआ! 🚀',
    'emi.incomplete': 'अधूरी जानकारी',
    'emi.tenureYears': 'साल',
    'emi.tenureMonths': 'महीने',
    'emi.startDateOptional': 'शुरुआत की तारीख',
    'emi.editTitle': 'ऋण प्रोफाइल अपडेट करें',
    'emi.editName': 'लोन का नाम बदलें',
    'emi.editAmount': 'मूलधन बदलें',
    'emi.editDay': 'EMI दिन बदलें',
    'emi.loanTitleLabel': 'लोन का शीर्षक',
    'emi.interestLogicLabel': 'ब्याज लॉजिक',
    'emi.inceptionDateLabel': 'शुरुआत की तारीख',
    'emi.monthlyEmiDayLabel': 'मासिक EMI दिन',
    'emi.monthlyChargeLabel': 'मासिक शुल्क',
    'emi.noLoanConfig': 'कोई लोन कॉन्फ़िगरेशन नहीं मिला',
    'emi.validationError': 'लोन रिकॉर्ड के लिए आवश्यक फ़ील्ड मौजूद नहीं हैं।',
    'emi.dayError': 'EMI दिन 1 और 31 के बीच होना चाहिए।',
    'emi.saveError': 'लोन विवरण सेव नहीं किया जा सका।',
    'dashboard.incomeEngineSub': 'सत्यापित मासिक आय',
    'dashboard.safeSpendSub': 'रणनीतिक मासिक खर्च सीमा',
    'dashboard.title': 'वित्तीय टर्मिनल',
    'dashboard.description': 'उच्च स्तरीय संपत्ति प्रबंधन',
    'dashboard.addExpense': 'लेन-देन दर्ज करें',
    'dashboard.spendingTrends': 'खर्च के ट्रेंड्स',
    'dashboard.salarySetup': 'आय का आधार',
    'dashboard.salarySetupDesc': 'मासिक आय का आधार सेट करें',
    'dashboard.budgetSetup': 'खर्च की सीमा',
    'dashboard.budgetSetupDesc': 'अधिकतम मासिक खर्च सीमा सेट करें',
    'dashboard.enterAmount': 'मासिक आधार सेट करें',
    'dashboard.setLimit': 'सीमा कॉन्फ़िगर करें',
    'dashboard.overBudget': 'सीमा पार हो गई',
    'dashboard.spentSoFar': 'खर्च हुआ',
    'dashboard.used': 'उपयोग किया',
    'dashboard.totalCommitments': 'कुल दायित्व',
    'dashboard.emiNamePlaceholder': 'जैसे: सपनों की कार',
    'dashboard.emiAmountPlaceholder': 'EMI राशि',
    'dashboard.emiDayPlaceholder': '1-31',
    'dashboard.addRecurringBill': 'बिल जोड़ें',
    'dashboard.addEmiWithDetails': 'नया लोन सुरक्षित करें',
    'dashboard.dayOfMonth': 'दिन',
    'dashboard.noEmis': 'कोई सक्रिय दायित्व नहीं',
    'dashboard.salaryUpdated': 'आय सफलतापूर्वक सेव हो गई',
    'dashboard.budgetUpdated': 'बजट लॉक हो गया!',
    'dashboard.emiAdded': 'लोन सफलतापूर्वक दर्ज! 🚀',
    'dashboard.emiWithDetailsAdded': 'विवरण के साथ लोन जोड़ा गया',
    'dashboard.salarySaveError': 'आय रिकॉर्ड सेव करने में त्रुटि।',
    'dashboard.aiEngine': 'डीप इनसाइट इंजन',
    'dashboard.intelligenceFeed': 'इंटेलिजेंस फीड',
    'dashboard.forensicLogic': 'फोरेंसिक लॉजिक',
    'dashboard.integrity': 'सत्यनिष्ठा',
    'dashboard.analyzingCycles': 'वित्तीय चक्रों का विश्लेषण हो रहा है...',
    'dashboard.criticalNudges': 'महत्वपूर्ण सुझाव',
    'dashboard.cyclePrediction': 'चक्र भविष्यवाणी',
    'dashboard.momentum': 'गति',
    'dashboard.recentTransactions': 'गतिविधि लेजर',
    'dashboard.syncing': 'सिंक हो रहा है...',
    'dashboard.realtime': 'रियल-टाइम',
    'dashboard.transactionUpdated': 'लेजर अपडेट हो गया',
    'dashboard.failedToUpdate': 'अपडेट विफल',
    'dashboard.totalCredit': 'कुल क्रेडिट',
    'dashboard.totalDebit': 'कुल डेबिट',
    'dashboard.safetyPrivacy': 'सुरक्षा और गोपनीयता',
    'dashboard.dataPrivacyTip': 'यह डेटा केवल आपकी जानकारी के लिए है। हम आपके बैंक खातों तक सीधे नहीं पहुँचते हैं।',
    'planning.engineTitle': 'प्लानिंग इंजन',
    'planning.configureVitals': 'मासिक विटल्स सेट करें',
    'planning.monthlyLiquidity': 'मासिक तरलता',
    'planning.deployLimit': 'मासिक सीमा लागू करें',
    'planning.activeObligations': 'सक्रिय दायित्व',
    'planning.emis': 'EMI',
    'planning.subs': 'सब्सक्रिप्शन',
    'planning.planningFooter': 'यहाँ सेव किए गए मान क्लाउड के साथ सिंक होते हैं।',
    'planning.savedLocally': 'लोकल सेव हो गया! 🚀',
    'planning.income': 'आय',
    'planning.budget': 'बजट',
    'planning.updatedSyncing': 'अपडेट हो गया। सिंक हो रहा है...',
    'planning.syncFailed': 'सिंक विफल!',
    'savings.page.title': 'संपत्ति लक्ष्य',
    'savings.wealthEngine': 'वेल्थ इंजन',
    'savings.initialization': 'नया लक्ष्य लागू हो रहा है...',
    'savings.newAmbition': 'नया लक्ष्य',
    'savings.syncingVault': 'वॉल्ट सिंक हो रहा है...',
    'savings.noActiveAmbitions': 'कोई सक्रिय लक्ष्य नहीं',
    'savings.goalCreated': 'लक्ष्य सफलतापूर्वक दर्ज! सिंक हो रहा है...',
    'savings.goalDeleted': 'लक्ष्य हटा दिया गया',
    'savings.goalDeletedDesc': 'लक्ष्य सफलतापूर्वक हटा दिया गया। सिंक हो रहा है...',
    'recentExpenses.timelineEmpty': 'टाइमलाइन खाली है',
    'recentExpenses.addFirst': 'पहला लेन-देन दर्ज करें',
    'recentExpenses.Elite': 'प्रीमियम गतिविधि',
    'recentExpenses.addEvent': 'गतिविधि दर्ज करें',
    'recentExpenses.transactions': 'गतिविधियां',
    'recentExpenses.title': 'गतिविधि लेजर',
    'recentExpenses.noTransactions': 'कोई गतिविधि नहीं मिली',
    'reports.title': 'सेक्टर ऑडिट',
    'reports.description': 'उच्च स्तरीय वित्तीय रिपोर्टिंग',
    'groups.title': 'रणनीतिक ग्रुप',
    'groups.description': 'सहयोगात्मक खर्च प्रबंधन',
    'groups.inviteWhatsApp': 'आमंत्रण भेजें',
    'groups.viewGroups': 'ग्रुप देखें',
    'groups.whatsappMessage': 'BachatKaro पर मेरे रणनीतिक ग्रुप में शामिल हों!',
    'dreams.comingSoon': 'लक्ष्य इंटरफ़ेस विकसित हो रहा है...',
    'healthScore.title': 'वित्तीय पल्स',
    'healthScore.listenBtn': 'मेंटर को सुनें',
    'healthScore.speaking': 'ज्ञान प्रसारित हो रहा है...',
    'healthScore.scoreLabel': 'स्थिरता सूचकांक',
    'healthScore.smartStep': 'रणनीतिक अगला कदम',
    'healthScore.noDataStatus': 'कैलिब्रेशन आवश्यक',
    'healthScore.noDataMsg': 'पल्स कैलिब्रेट करने के लिए डेटा भरें।',
    'healthScore.actionIncome': 'आय का आधार सेट करें',
    'healthScore.statusCritical': 'गंभीर अस्थिरता',
    'healthScore.actionCritical': 'आपातकालीन कटौती करें',
    'healthScore.statusStable': 'स्थिर संतुलन',
    'healthScore.actionStable': 'बचत दर अनुकूलित करें',
    'healthScore.statusExcellent': 'Elite पथ',
    'healthScore.actionExcellent': 'रणनीतिक निवेश बढ़ाएं',
    'healthScore.Elite': 'Elite ग्रेड',
    'healthScore.healthScore': 'पल्स सूचकांक',
    'charts.syncingIntel': 'इंटेल सिंक हो रहा है',
    'charts.dataEngineSilent': 'डेटा इंजन मौन',
    'charts.feedSystemToUnlock': 'मार्केट इनसाइट्स के लिए डेटा जोड़ें',
    'charts.automatedSectorAudit': 'स्वचालित सेक्टर ऑडिट',
    'charts.monthlyBurn': 'मासिक खर्च',
    'charts.pulseAudit': 'पल्स ऑडिट',
    'charts.marketInsight': 'मार्केट इनसाइट',
    'charts.syncingTrends': 'ट्रेंड्स सिंक हो रहे हैं',
    'charts.noTrendsDetected': 'कोई ट्रेंड नहीं मिला',
    'charts.addDataToVisualize': 'वित्तीय पथ देखने के लिए डेटा जोड़ें',
    'charts.validatedTimeSeries': 'सत्यापित समय श्रृंखला',
    'charts.forensicPatternDetection': 'फोरेंसिक पैटर्न डिटेक्शन',
    'spending.zeroRecords': 'शून्य रिकॉर्ड',
    'spending.addTransactionsToGenerate': 'इंटेलिजेंस के लिए लेन-देन जोड़ें',
    'permission.education.title': 'गोपनीयता पहले',
    'permission.education.subtitle': 'उच्च स्तरीय सुरक्षा',
    'permission.sms.title': 'वित्तीय SMS',
    'permission.sms.desc': 'सिर्फ आपके खर्चों को ऑटोमैटिक ट्रैक करने के लिए।',
    'permission.audio.title': 'वॉइस इनपुट',
    'permission.audio.desc': 'जब आप BK बटन दबाएंगे, तभी उपयोग होगा।',
    'permission.notif.title': 'नोटिफिकेशन',
    'permission.notif.desc': 'खर्च के रियल-टाइम अलर्ट के लिए।',
    'permission.trust.otp': 'OTP गोपनीयता',
    'permission.trust.chat': 'निजी चैट',
    'permission.grant.button': 'स्वीकार करें और आगे बढ़ें',
    'market_intel.growth_intel': 'ग्रोथ इंटेल',
    'market_intel.wealth_builder': 'पर्सनलाइज्ड वेल्थ बिल्डर',
    'market_intel.live_audit': 'लाइव ऑडिट',
    'market_intel.velocity_progress': 'आपकी प्रगति',
    'market_intel.milestone': 'उपलब्धि',
    'market_intel.strategic_plan': 'रणनीतिक मनी प्लान',
    'market_intel.suggested_sip': 'सुझाया गया SIP',
    'market_intel.risk_appetite': 'जोखिम क्षमता',
    'market_intel.recommended_actions': 'अनुशंसित क्रियाएं',
    'market_intel.activate_sip': 'SIP ट्रैक चालू करें',
    'market_intel.sip_desc': 'संपत्ति बनाने के छोटे कदम',
    'market_intel.deploy_emergency': 'इमरजेंसी फंड बनाएं',
    'market_intel.emergency_desc': '3 महीने का सुरक्षा कवच',
    'market_intel.institutional_onramps': 'वित्तीय प्लेटफॉर्म',
    'market_intel.sebi_regulated': 'सिर्फ SEBI विनियमित आर्किटेक्चर',
    'market_intel.security_protocol': 'सुरक्षा प्रोटोॉल',
    'market_intel.disclaimer': 'निवेश आपके पसंदीदा प्लेटफॉर्म पर होते हैं। बचतकरो सिर्फ एक प्लानिंग टूल है।',
    'market_intel.os_footer': 'फाइनेंशियल ऑपरेटिंग सिस्टम · उच्च स्तरीय',
    'settlement.title': 'सेटलमेंट',
    'settlement.view_only': 'सिर्फ देखें',
    'settlement.mark_paid': 'चुकाया गया मार्क करें',
    'settlement.admin_only': 'सिर्फ एडमिन',
    'settlement.finalizing': 'लेजर अपडेट हो रहा है...',
    'settlement.reconstructing': 'डेटा सिंक हो रहा है...',
    'settlement.search_placeholder': 'सदस्य खोजें...',
    'settlement.zero_debt': 'कोई उधार नहीं',
    'settlement.no_match': 'कोई मेल नहीं मिला',
    'settlement.pending': 'बाकी',
    'settlement.settled': 'चुकाया',
    'settlement.pay_now': 'चुकाएं',
    'settlement.nudge': 'नज',
    'settlement.remind': 'याद दिलाएं',
    'settlement.show_less': 'कम देखें',
    'settlement.expand_ledger': 'लेजर विस्तार करें',
    'settlement.full_ledger': 'संपूर्ण रणनीतिक लेजर',
    'settlement.entities': 'सदस्य',
    'settlement.active_positions': 'सक्रिय लेनदेन',
    'settlement.minimize': 'छोटा करें',
    'settlement.explore': 'देखें',
    'settlement.search_identity': 'पहचान खोजें...',
    'settlement.no_identity_match': 'कोई मेल नहीं मिला',
    'settlement.credit': 'क्रेडिट',
    'settlement.debit': 'डेबिट',
    'settlement.neutral': 'न्यूट्रल',
    'auth.identification': 'पहचान',
    'auth.security_key': 'सुरक्षा कुंजी',
    'auth.create_account': 'खाता बनाएं',
    'auth.success_msg': 'खाता बन गया!',
    'auth.back_to_home': 'होम पर वापस जाएं',
    'auth.institutional_encryption': 'उच्च स्तरीय एन्क्रिप्शन',
    'join.verifying': 'पहचान सत्यापित हो रही है...',
    'join.invalidLink': 'अमान्य आमंत्रण',
    'join.failed': 'सत्यापन त्रुटि',
    'join.expired': 'आमंत्रण समाप्त',
    'join.authRequired': 'लॉगिन आवश्यक',
    'join.alreadyMember': 'पहचान पहले से पंजीकृत है',
    'join.success': 'पहचान सत्यापित',
    'join.verificationFailed': 'सत्यापन विफल',
    'join.issue': 'सिस्टम विरोध',
    'join.invitation': 'रणनीतिक आमंत्रण',
    'join.secureOnboarding': 'सुरक्षित ऑनबोर्डिंग',
    'join.establishing': 'कनेक्शन बन रहा है...',
    'join.returnHome': 'होम पर वापस जाएं',
  },
  hinglish: {
    'app.name': 'BachatKaro',
    'auth.forgot_password_link': 'Password bhul gaye?',
    'common.loading': 'Protocol load ho raha hai...',
    'common.error': 'System Error',
    'common.save': 'Save karo',
    'common.cancel': 'Abort karo',
    'common.edit': 'Modify karo',
    'common.delete': 'Hatao',
    'common.update': 'Patch karo',
    'common.confirm': 'Verify karo',
    'common.set': 'Configure karo',
    'common.add': 'Initialize karo',
    'common.invalid': 'Invalid Data',
    'common.deleted': 'Record hata diya gaya',
    'common.syncing': 'Cloud par sync ho raha hai...',
    'common.offline': 'Offline Mode',
    'common.saveFailed': 'Save nahi hua.',
    'common.deleteError': 'Record remove nahi ho paya.',
    'common.confirmWipe': '⚠️ Isse saara financial data udd jayega. Continue karein?',
    'common.wipeError': 'Data wipe karte waqt system error.',
    'common.aiActive': 'AI Active hai',
    'common.hardwareAccelerated': 'Hardware Accelerated Logic',
    'common.success': 'Success',
    'nav.dashboard': 'Terminal',
    'nav.saving': 'Wealth',
    'nav.split': 'Settlements',
    'nav.signOut': 'Sign Out',
    'tabs.daily': 'Daily',
    'tabs.planning': 'Planning',
    'tabs.future': 'Future',
    'tabs.groups': 'Groups',
    'tabs.dreams': 'Dreams',
    'tabs.dailyDescription': 'Real-time ledger audit',
    'tabs.planningDescription': 'Monthly limit configuration',
    'tabs.futureDescription': 'Liquidity roadmap',
    'tabs.groupsDescription': 'Collaborative expense management',
    'tabs.dreamsDescription': 'Wealth ambition tracking',
    'onboarding.experience': 'Premium Onboarding Experience',
    'onboarding.selectRegion': 'Select Your Region',
    'onboarding.whereAreYouFrom': 'Kahan se ho aap?',
    'onboarding.preferredLanguage': 'Preferred Language',
    'onboarding.talkToUsIn': 'Talk to us in...',
    'onboarding.finishSetup': 'Setup Khatam Karo',
    'onboarding.regionHelp': 'Region se local currency aur split logic sahi hota hai.',
    'onboarding.status_bar_clearance': 'Immersive UI ke liye status bar clear ho raha hai',
    'monthlySnapshot.title': 'Monthly Snapshot',
    'monthlySnapshot.description': 'Verified financial audit',
    'monthlySnapshot.income': 'Monthly Income',
    'monthlySnapshot.expenses': 'Total Spent',
    'monthlySnapshot.savings': 'Net Saved',
    'monthlySnapshot.totalInflow': 'Total Inflow',
    'monthlySnapshot.totalOutflow': 'Total Outflow',
    'monthlySnapshot.netCashFlow': 'Net Cash Flow',
    'monthlySnapshot.budget': 'Monthly Budget',
    'monthlySnapshot.spent': 'Spent',
    'monthlySnapshot.saved': 'Saved',
    'emiBills.title': 'EMI aur Bill',
    'emiBills.description': 'Strategic debt tracker',
    'emiBills.dueLabel': 'Baaki',
    'emiBills.pay': 'Pay karo',
    'emiBills.paid': 'Paid',
    'emiBills.noBills': 'Koi active obligation nahi mili',
    'emiBills.addEmiLoan': 'EMI/Loan add karo',
    'emiBills.edit': 'Loan edit karo',
    'emiBills.delete': 'Loan hatao',
    'emi.loanDetails': 'Loan Details',
    'emi.months': 'Months',
    'emi.tenure': 'Tenure',
    'emi.flat': 'Flat',
    'emi.completed': 'Pura hua',
    'emi.active': 'Active',
    'emi.loanProgress': 'Loan Progress',
    'emi.of': 'ka',
    'emi.principalAmount': 'Principal',
    'emi.originalLoanAmountDesc': 'Original loan amount',
    'emi.remainingBalance': 'Remaining Balance',
    'emi.left': 'baaki',
    'emi.totalInterest': 'Total Interest',
    'emi.overFullTenure': 'full tenure par',
    'emi.monthsRemaining': 'months baaki',
    'emi.currentMonthBreakdown': 'Is month ka breakdown',
    'emi.principal': 'Principal',
    'emi.interest': 'Interest',
    'emi.totalEMI': 'Total EMI',
    'emi.note': 'Note',
    'emi.calculationError': 'Calculation Error',
    'emi.name': 'Loan Ka Title',
    'emi.amount': 'Amount',
    'emi.dayOptional': 'Day (Optional)',
    'emi.providerNamePlaceholder': 'e.g. HDFC Bank',
    'emi.providerType': 'Provider',
    'emi.bank': 'Bank',
    'emi.app': 'App',
    'emi.loanTypePlaceholder': 'Loan Type',
    'emi.interestRatePlaceholder': 'Rate (%)',
    'emi.interestType': 'Interest Type',
    'emi.reducingRecommended': 'Reducing',
    'emi.interestTypeHint': 'Reducing highly recommended hai',
    'emi.emiOutflow': 'EMI OUTFLOW',
    'emi.audit': 'Audit',
    'emi.monthlyCharge': 'Monthly Charge',
    'emi.simulatorTitle': 'Prepayment Simulator',
    'emi.prepaymentAmountLabel': 'Prepayment Amount (₹)',
    'emi.remaining': 'Baaki',
    'emi.interestSaved': 'Saved',
    'emi.totalInterestNoPrepay': 'Total Interest (Bina prepayment ke)',
    'emi.noConfig': 'Koi Loan configuration nahi mili',
    'emi.loanAudit': 'Loan Audit',
    'emi.interestLogic': 'Interest Logic',
    'emi.reducing': 'Reducing',
    'emi.inceptionDate': 'Inception Date',
    'emi.monthlyEmiDay': 'Monthly EMI Day',
    'emi.saveChanges': 'Changes save karo',
    'emi.commitAudit': 'Audit commit karo',
    'emi.opSuccess': 'Operation Successful! 🚀',
    'emi.incomplete': 'Details adhuri hain',
    'emi.tenureYears': 'Years',
    'emi.tenureMonths': 'Months',
    'emi.startDateOptional': 'Start Date',
    'emi.editTitle': 'Debt profile update karo',
    'emi.editName': 'Loan name badlo',
    'emi.editAmount': 'Principal badlo',
    'emi.editDay': 'EMI day badlo',
    'emi.loanTitleLabel': 'Loan Title',
    'emi.interestLogicLabel': 'Interest Logic',
    'emi.inceptionDateLabel': 'Inception Date',
    'emi.monthlyEmiDayLabel': 'Monthly EMI Day',
    'emi.monthlyChargeLabel': 'Monthly Charge',
    'emi.noLoanConfig': 'Koi Loan configuration nahi mili',
    'emi.validationError': 'Required fields missing hain.',
    'emi.dayError': 'EMI Day 1 aur 31 ke beech hona chahiye.',
    'emi.saveError': 'Loan details save nahi ho payi.',
    'dashboard.incomeEngineSub': 'Verified Monthly Inflow',
    'dashboard.safeSpendSub': 'Strategic Monthly Burn Cap',
    'dashboard.title': 'Financial Terminal',
    'dashboard.description': 'High-end wealth management',
    'dashboard.addExpense': 'Record Transaction',
    'dashboard.spendingTrends': 'Spending Trends',
    'dashboard.salarySetup': 'Income Basis',
    'dashboard.salarySetupDesc': 'Income basis set karo',
    'dashboard.budgetSetup': 'Burn Limit',
    'dashboard.budgetSetupDesc': 'Monthly spending limit set karo',
    'dashboard.enterAmount': 'Monthly basis set karo',
    'dashboard.setLimit': 'Limit configure karo',
    'dashboard.overBudget': 'Limit cross ho gayi',
    'dashboard.spentSoFar': 'Kharch hua',
    'dashboard.used': 'Used',
    'dashboard.totalCommitments': 'Total Obligations',
    'dashboard.emiNamePlaceholder': 'e.g. Dream Car',
    'dashboard.emiAmountPlaceholder': 'EMI Amount',
    'dashboard.emiDayPlaceholder': '1-31',
    'dashboard.addRecurringBill': 'Bill add karo',
    'dashboard.addEmiWithDetails': 'Naya Loan secure karo',
    'dashboard.dayOfMonth': 'Day',
    'dashboard.noEmis': 'Koi active obligation nahi hai',
    'dashboard.salaryUpdated': 'Salary successfully save ho gayi',
    'dashboard.budgetUpdated': 'Budget Lock ho gaya!',
    'dashboard.emiAdded': 'Loan locally record ho gaya! 🚀',
    'dashboard.emiWithDetailsAdded': 'Loan details ke saath add ho gaya',
    'dashboard.salarySaveError': 'Income record save karne mein error.',
    'dashboard.aiEngine': 'Deep Insight Engine',
    'dashboard.intelligenceFeed': 'Intelligence Feed',
    'dashboard.forensicLogic': 'Forensic Logic',
    'dashboard.integrity': 'Integrity',
    'dashboard.analyzingCycles': 'Financial cycles analyze ho rahe hain...',
    'dashboard.criticalNudges': 'Critical Nudges',
    'dashboard.cyclePrediction': 'Cycle Prediction',
    'dashboard.momentum': 'Momentum',
    'dashboard.recentTransactions': 'Activity Ledger',
    'dashboard.syncing': 'Synchronizing...',
    'dashboard.realtime': 'Real-time',
    'dashboard.transactionUpdated': 'Ledger update hua',
    'dashboard.failedToUpdate': 'Update fail hua',
    'dashboard.totalCredit': 'Total Credit',
    'dashboard.totalDebit': 'Total Debit',
    'dashboard.safetyPrivacy': 'Safety & Privacy',
    'dashboard.dataPrivacyTip': 'Ye data sirf aapki tracking ke liye hai. Hum bank accounts access nahi karte.',
    'planning.engineTitle': 'Planning Engine',
    'planning.configureVitals': 'Monthly Vitals set karo',
    'planning.monthlyLiquidity': 'Monthly Liquidity',
    'planning.deployLimit': 'Monthly limit apply karo',
    'planning.activeObligations': 'Active Obligations',
    'planning.emis': 'EMIs',
    'planning.subs': 'Subs',
    'planning.planningFooter': 'Yahan save kiye gaye values cloud se sync hote hain.',
    'planning.savedLocally': 'Locally save ho gaya! 🚀',
    'planning.income': 'Income',
    'planning.budget': 'Budget',
    'planning.updatedSyncing': 'update ho gaya. Sync ho raha hai...',
    'planning.syncFailed': 'Sync fail ho gaya!',
    'savings.page.title': 'Wealth Ambitions',
    'savings.wealthEngine': 'Wealth Engine',
    'savings.initialization': 'Naya ambition deploy ho raha hai...',
    'savings.newAmbition': 'New Ambition',
    'savings.syncingVault': 'Vault sync ho raha hai...',
    'savings.noActiveAmbitions': 'Koi active ambition nahi hai',
    'savings.goalCreated': 'Ambition record ho gaya! Syncing...',
    'savings.goalDeleted': 'Ambition khatam',
    'savings.goalDeletedDesc': 'Goal remove ho gaya. Syncing...',
    'recentExpenses.timelineEmpty': 'Timeline Khali Hai',
    'recentExpenses.addFirst': 'Pehla transaction record karo',
    'recentExpenses.Elite': 'Premium Activity',
    'recentExpenses.addEvent': 'Record Event',
    'recentExpenses.transactions': 'Events',
    'recentExpenses.title': 'Activity Ledger',
    'recentExpenses.noTransactions': 'No events detected',
    'reports.title': 'Sector Audits',
    'reports.description': 'High-grade financial reporting',
    'groups.title': 'Strategic Groups',
    'groups.description': 'Collaborative expense management',
    'groups.inviteWhatsApp': 'Invite dispatch karo',
    'groups.viewGroups': 'Explore Groups',
    'groups.whatsappMessage': 'Join my strategic group on BachatKaro!',
    'dreams.comingSoon': 'Ambition Interface ban raha hai...',
    'healthScore.title': 'Financial Pulse',
    'healthScore.listenBtn': 'Listen to Mentor',
    'healthScore.speaking': 'Wisdom transmit ho rahi hai...',
    'healthScore.scoreLabel': 'Stability Index',
    'healthScore.smartStep': 'Strategic Next Step',
    'healthScore.noDataStatus': 'Calibration Required',
    'healthScore.noDataMsg': 'Data dalo pulse calibrate karne ke liye.',
    'healthScore.actionIncome': 'Income basis set karo',
    'healthScore.statusCritical': 'Critical Instability',
    'healthScore.actionCritical': 'Emergency cutbacks karo',
    'healthScore.statusStable': 'Stable Equilibrium',
    'healthScore.actionStable': 'Retention rate optimize karo',
    'healthScore.statusExcellent': 'Elite Trajectory',
    'healthScore.actionExcellent': 'Strategic deployment badhao',
    'healthScore.Elite': 'Elite Grade',
    'healthScore.healthScore': 'Pulse Index',
    'charts.syncingIntel': 'Syncing Intel',
    'charts.dataEngineSilent': 'Data Engine Silent',
    'charts.feedSystemToUnlock': 'Insights unlock karne ke liye data dalo',
    'charts.automatedSectorAudit': 'Automated Sector Audit',
    'charts.monthlyBurn': 'Monthly Burn',
    'charts.pulseAudit': 'Pulse Audit',
    'charts.marketInsight': 'Market Insight',
    'charts.syncingTrends': 'Trends Sync ho rahe hain',
    'charts.noTrendsDetected': 'No Trends Detected',
    'charts.addDataToVisualize': 'Financial trajectory dekhne ke liye data dalo',
    'charts.validatedTimeSeries': 'Validated Time Series',
    'charts.forensicPatternDetection': 'Forensic Pattern Detection',
    'spending.zeroRecords': 'Zero Records',
    'spending.addTransactionsToGenerate': 'Intelligence ke liye transactions add karo',
    'permission.education.title': 'Privacy Pehle',
    'permission.education.subtitle': 'High-Grade Security',
    'permission.sms.title': 'Financial SMS',
    'permission.sms.desc': 'Sirf transaction SMS process honge aapka ledger banane ke liye.',
    'permission.audio.title': 'Voice Input',
    'permission.audio.desc': 'Sirf tab chalega jab aap BK button dabayenge.',
    'permission.notif.title': 'Notifications',
    'permission.notif.desc': 'Real-time alerts budget ke liye.',
    'permission.trust.otp': 'OTP Privacy',
    'permission.trust.chat': 'Private Chats',
    'permission.grant.button': 'Continue karo',
    'market_intel.growth_intel': 'Growth Intel',
    'market_intel.wealth_builder': 'Personal Wealth Builder',
    'market_intel.live_audit': 'Live Audit',
    'market_intel.velocity_progress': 'Aapki Progress',
    'market_intel.milestone': 'Milestone',
    'market_intel.strategic_plan': 'Strategic Money Plan',
    'market_intel.suggested_sip': 'Suggested SIP',
    'market_intel.risk_appetite': 'Risk Appetite',
    'market_intel.recommended_actions': 'Actions lo',
    'market_intel.activate_sip': 'SIP Track chalu karo',
    'market_intel.sip_desc': 'Wealth banane ke chote steps',
    'market_intel.deploy_emergency': 'Emergency Fund banao',
    'market_intel.emergency_desc': '3-month ka buffer',
    'market_intel.institutional_onramps': 'Trusted Platforms',
    'market_intel.sebi_regulated': 'SEBI Regulated Only',
    'market_intel.security_protocol': 'Security Protocol',
    'market_intel.disclaimer': 'Investment aapke app par honge. BachatKaro sirf ek planning tool hai.',
    'market_intel.os_footer': 'Financial OS · High Grade',
    'settlement.title': 'Settlements',
    'settlement.view_only': 'View Only',
    'settlement.mark_paid': 'Paid mark karo',
    'settlement.admin_only': 'Admin only',
    'settlement.finalizing': 'Ledger update ho raha hai...',
    'settlement.reconstructing': 'Data sync ho raha hai...',
    'settlement.search_placeholder': 'Member dhundo...',
    'settlement.zero_debt': 'Sab settled hai',
    'settlement.no_match': 'Nahi mila',
    'settlement.pending': 'Baaki',
    'settlement.settled': 'Settled',
    'settlement.pay_now': 'Settle karo',
    'settlement.nudge': 'Nudge',
    'settlement.remind': 'Remind',
    'settlement.show_less': 'Kam dekho',
    'settlement.expand_ledger': 'Ledger bada karo',
    'settlement.full_ledger': 'Full Strategic Ledger',
    'settlement.entities': 'Log',
    'settlement.active_positions': 'Active Positions',
    'settlement.minimize': 'Chota karo',
    'settlement.explore': 'Duniya dekho',
    'settlement.search_identity': 'Search karo...',
    'settlement.no_identity_match': 'Nahi mila',
    'settlement.credit': 'Credit',
    'settlement.debit': 'Debit',
    'settlement.neutral': 'Neutral',
    'auth.identification': 'Identification',
    'auth.security_key': 'Security Key',
    'auth.create_account': 'Account banao',
    'auth.success_msg': 'Account ban gaya!',
    'auth.back_to_home': 'Home par wapas jao',
    'auth.institutional_encryption': 'High-Grade Security',
    'join.verifying': 'Identity verify ho rahi hai...',
    'join.invalidLink': 'Invalid Invite Protocol',
    'join.failed': 'Verification Error',
    'join.expired': 'Invite Expired',
    'join.authRequired': 'Login zaroori hai',
    'join.alreadyMember': 'Identity pehle se registered hai',
    'join.success': 'Identity Verified',
    'join.verificationFailed': 'Validation fail hua',
    'join.issue': 'System Conflict',
    'join.invitation': 'Strategic Invitation',
    'join.secureOnboarding': 'Secure Onboarding',
    'join.establishing': 'Connection ban raha hai...',
    'join.returnHome': 'Abort karke home jao',
  }
};
