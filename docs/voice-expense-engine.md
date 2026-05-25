# Voice Expense Engine

## Scope
Smart voice expense input for:
- Dashboard -> Add New Expense
- Group Expenses -> Add Expense card

## Root Cause
Voice flow was fragmented in multiple places:
- Permission handling was duplicated and inconsistent.
- Parsing depended too much on remote AI/fallback and was not deterministic.
- Field mapping was partial, so transcript showed but form fields were not always filled.
- Countdown/autosave behavior was not centralized and did not reliably trigger.

## What Was Fixed

### 1) Central Voice Service
File: `src/services/voiceService.ts`

Implemented reusable functions:
- `startListening()`
- `stopListening()`
- `requestMicrophonePermission()`
- `preprocessTranscript()`
- permission persistence via localStorage

State model:
- `requesting`
- `listening`
- `denied`
- `idle`

Permission support:
- Web: `navigator.mediaDevices.getUserMedia`
- Capacitor native (best effort): `Capacitor.Plugins.SpeechRecognition`

### 2) Smart Parsing Engine (Deterministic)
File: `src/services/voiceParserService.ts`

Parser extracts:
- `amount`
- `paymentMode`
- `category`
- `title`
- `paidBy`
- `split`

Techniques:
- number regex
- keyword dictionaries
- transcript preprocessing (lowercase, cleanup, filler-word filtering, currency normalization)

Example:
- "Dinner 2000 UPI" -> amount=2000, category=Food, payment=UPI, title=dinner
- "UPI 500 petrol" -> amount=500, category=Travel, payment=UPI, title=petrol
- "Groceries cash 300" -> amount=300, category=Food, payment=Cash, title=groceries

### 3) Hook Integration
Files:
- `src/voice/integrations/useDashboardAIVoice.ts`
- `src/voice/integrations/useSplitAIVoice.ts`

Behavior:
- local parser runs first (fast, deterministic)
- AI parser runs only as fallback enrichment when required fields are still missing

### 4) Voice Controller Reliability
File: `src/voice/core/useVoiceController.ts`

Changes:
- strict 10-second silence timer
- stable transcript accumulation
- returns `voiceState`, `permissionState`, `lastError`

### 5) AddExpense Mapping + Autosave
File: `src/pages/AddExpense.tsx`

Fixes:
- voice start/stop now uses controller service path
- user-friendly voice error toasts
- 10-second visible countdown when required fields are complete
- autosave on countdown completion
- best-effort autosave on page leave when form is complete

### 6) GroupExpenses Mapping + Autosave
File: `src/pages/GroupExpenses.tsx`

Fixes:
- voice start/stop uses controller service path
- user-friendly voice error toasts
- status text for requesting/listening/denied
- 10-second visible countdown when form is complete
- autosave on countdown completion
- best-effort autosave on page leave when form is complete

## Voice Flow Diagram
1. User taps mic
2. App requests mic permission
3. If granted -> listening starts
4. Transcript is preprocessed
5. Parser extracts structured fields
6. Fields are mapped into form inputs
7. After last speech/interaction and complete required fields -> 10s countdown
8. Countdown ends -> autosave triggers
9. Success -> state resets

## Field Mapping
### Dashboard Add Expense
- amount -> amount input
- paymentMode -> payment dropdown
- category -> category dropdown
- note/title -> note field

### Group Expense Card
- amount -> amount input
- title -> title input
- paidBy -> member mapping (name -> member id)
- split -> split type selector

## Countdown Logic
- Starts only when required fields are valid.
- Resets on field changes/voice updates.
- Cancels when voice is actively listening or save is in progress.

## Error Handling
Handled cases:
- permission denied
- no speech detected
- unsupported browser
- generic recognition/parse failure

User sees readable toast messages for each case.

## Test Checklist
1. First mic click should trigger permission request.
2. Speak: "Dinner 2000 UPI"
   - amount/category/payment should fill.
3. Wait idle:
   - 10s countdown visible
   - autosave triggers
4. Speak random order input:
   - mapping still correct
5. Deny mic permission:
   - denied message shown
6. Repeat in both Dashboard and Group Expenses screens.
