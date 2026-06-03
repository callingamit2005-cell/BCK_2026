# BachatKaro System Architecture - V1.0-STABLE

## 🛡️ Core Philosophy
BachatKaro is a **Local-First, Offline-Ready** fintech OS designed for high-integrity transaction tracking and group collaboration.

---

## 🏗️ Technical Stack
- **Frontend:** React (TypeScript) + Vite
- **Mobile Bridge:** Capacitor
- **Database (Local):** SQLite (Native Android) / Memory (Web)
- **Database (Cloud):** Supabase (PostgreSQL + PostgREST)
- **UI System:** Institutional Monochrome (HSL Tokenized)
- **AI Engine:** Groq (Llama-3.1/3.3)

---

## 🔄 Data Lifecycle & Identity
### 1. Identity Integrity (Paisa-Parity)
- All financial storage uses **PAISA INTEGER** format.
- Conversion to Rupees occurs **EXACTLY ONCE** at the UI/Render edge.
- Deterministic hashing (`canonical_key`) ensures zero-false-positive deduplication for SMS transactions.

### 2. Synchronization Engine
- **Strategy:** Background Replay Queue (15s interval).
- **Conflict Resolution:** "Latest Wins" (Timestamp-based) + Tombstone Protection.
- **RPC Layer:** Atomic multi-table updates for group expenses and splits.

---

## 📱 Native Android Interception
- **Bridge:** Custom Java/Kotlin Capacitor Plugin (`SmsBridge`).
- **Interception:** Native BroadcastReceiver captures SMS → Forensic Filtering → Metadata Extraction.
- **Permissions:** Standardized React-driven education flow for SMS, Audio, and Notifications.

---

## 🎨 Visual Design Language
- **Master Reference:** "Privacy First" Design.
- **Radius Tokens:** `rounded-premium` (24px), `rounded-modal` (32px).
- **Shadow System:** Production-grade fintech elevations (`shadow-premium`, `shadow-institutional`).
- **Palette:** Institutional Blue/Indigo accents on Absolute Monochrome surfaces.

---

## 🔒 Security & Privacy
- **RLS:** Strict user isolation per row (`auth.uid() = user_id`).
- **Log Sanitization:** All PII and financial data logs are guarded by `import.meta.env.DEV`.
- **Deep Linking:** Intelligent routing (`/deeplink/join`) ensures native app engagement.

---

## 📂 Project Metadata
- **Stable Date:** 2026-05-31
- **Target Platform:** Web (Edge/Chrome/Safari) + Android (API 29+)
- **Developer:** Team BachatKaro
