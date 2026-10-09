# 📱 SaaS Expense Tracker — Master Project Plan & Technical Blueprint

> **Document Version:** 3.0 (Comprehensive Merged Master Plan)  
> **Date:** October 2026  
> **Role:** Senior Product Manager & Tech Lead  
> **Target Platforms:** Android (Google Play Store — API 35) → iOS (Apple App Store)  
> **Framework:** React Native + Expo SDK 57 (TypeScript strict mode)  
> **Architecture:** Offline-First SQLite + Local SaaS Layer (Supabase/RevenueCat Ready)  
> **Quality Benchmark:** Modern European & Global Fintech Apps (Revolut, Spendee, Wallet by BudgetBakers)

---

## 1. 🎯 Executive Overview & Success Criteria

### 1.1 Product Vision
Ekta enterprise-grade, high-converting SaaS personal finance & expense tracking application. App-ti offline-first reliability ebong Revolut-level visual polish niye toiri hobe.

**Core USP:** **"Level Tracking" Algorithm** — shudhu total budget tracking noy, category-wise spending threshold onujayi dynamic spending tiers (🟢 Low / 🟡 Moderate / 🔴 High) dekhano hobe, jate user sathe sathe bujhte pare kon category-te tar khoroch limit cross kore jachhe.

### 1.2 SaaS Model
- **Free Tier:** Local storage, unlimited transactions, 7 default expense + 6 default income categories, basic monthly budget, Level tracking, and local PIN lock.
- **Pro / SaaS Tier (Badge & Paywall Ready):** Unlimited custom categories, per-category budget limits, advanced CSV/JSON backup & export, biometric FaceID/Fingerprint lock, and multi-currency formatting.

### 1.3 Key Success Criteria (KPIs)
- [ ] **3-Tap Transaction Entry:** Numeric keypad default, auto-focus, zero friction.
- [ ] **Dual Script Parsing:** Seamless number entry in both English (`0-9`) and Bengali (`০-৯`) digits without validation errors.
- [ ] **Zero Data Loss Guarantee:** Robust SQLite migration (v1 → v2) preserving 100% existing transactions and categories.
- [ ] **100% Offline Resilience:** Full CRUD, search, level calculation, and security work with zero internet connectivity (Airplane mode verified).
- [ ] **Fintech Quality Bar:** 60fps animations, haptic feedback, frosted glassmorphism cards, and strict 44×44 dp touch targets.
- [ ] **Store Readiness:** Google Play Store target API 35 compliant, signed AAB, automated EAS build pipeline.

---

## 2. 🛠️ Merged Tech Stack & Dependency Matrix

| Layer | Technology | Version / Package | Purpose |
|---|---|---|---|
| **Core Framework** | Expo (Managed Workflow) | SDK 57 (`expo: ~57.0.25`) | Continuous Native Generation (CNG), cross-platform foundation |
| **Language** | TypeScript | `~6.0.3` | Strict mode enabled, zero `any` tolerance |
| **Routing** | Expo Router v4 | `~57.0.23` | File-based routing (`src/app/`), tabs & nested modals |
| **Local Database** | `expo-sqlite` | `~57.0.3` | Relational offline storage, foreign keys, WAL mode |
| **State Management** | Zustand | `^5.0.15` | Multi-store architecture (Settings, User Profile, Security Lock) |
| **Key-Value Persistence**| `@react-native-async-storage` | `2.2.0` | Store state persistence across app reloads |
| **Security & Auth** | `expo-local-authentication` | Latest SDK 57 compatible | 4-digit PIN lock + Biometric (Fingerprint / FaceID) |
| **Data Export & Sharing**| `expo-sharing` + `expo-file-system` | Latest SDK 57 compatible | CSV & JSON report generation and native share sheet |
| **Haptics** | `expo-haptics` | `~57.0.3` | Tactile feedback on buttons, keypad, and delete triggers |
| **Iconography** | `lucide-react-native` | `^1.48.0` | Comprehensive tree-shakeable fintech icons |
| **Vector Graphics** | `react-native-svg` | `15.15.4` | Charts, custom progress rings, and badge rendering |
| **Gestures & Motion** | `react-native-gesture-handler` + `reanimated` | `~2.32.0` / `4.5.1` | Swipe-to-delete/edit list items, sheet animations |
| **Internationalization**| Custom i18n Hook | `en` + `bn` modules | English & Bengali dual-language interface |
| **Backend & Cloud (Post-MVP)**| Supabase | Phase 4+ | Cloud sync, multi-device backup, PostgreSQL |
| **Monetization (Post-MVP)**| RevenueCat | Phase 4+ | In-app subscriptions and paywalls |

### 📦 Installation Commands
```bash
# Core Expo native modules (SDK version resolution)
npx expo install expo-local-authentication expo-sharing expo-file-system

# Verify compatible dependencies
npx expo-doctor
```

---

## 3. 📅 12-Week Roadmap & Feasibility Breakdown

### 🎯 Milestone Feasibility Summary
- **Weeks 1–4 (Milestone 1 — MVP):** Phase 0 Design System + Phase 1 Core DB/Category Bug Fixes + Initial Transaction Lifecycle.
- **Weeks 5–8 (Milestone 2 — SaaS Core):** Phase 2 Advanced Transactions, Level Tracking USP, Custom Categories, Dashboard Polish.
- **Weeks 9–12 (Milestone 3 — Production Launch):** Phase 3 SaaS Completion (Profile, PIN Lock, CSV Export) + Phase 4 Store Readiness & Release.
- **Post-MVP (Fast-Follow):** Supabase cloud database sync, RevenueCat live payment processing, and Web dashboard.

---

### Phase 0: Design System & Fintech Foundation (Week 1 — Critical Priority)
> **Objective:** Establish the visual DNA and reusable component library matching Revolut & Spendee quality before screen construction.

| Action | File Path | Description & Acceptance Criteria |
|---|---|---|
| `[NEW]` | `src/constants/tokens.ts` | Spacing (`4, 8, 12, 16, 20, 24, 32`), Radius (`8, 12, 16, 20, 24, 999`), Elevations, and Typography scale (Inter & Noto Sans Bengali). |
| `[MODIFY]`| `src/constants/colors.ts` | Complete Light & Dark palette with fintech accents: Indigo Primary (`#4F46E5`), Emerald Success (`#10B981`), Amber Warning (`#F59E0B`), Rose Danger (`#EF4444`), Glass card borders, surface layers. |
| `[NEW]` | `src/components/ui/glass-card.tsx` | Frosted glassmorphism card supporting blur effects, subtle high-key top border (`rgba(255,255,255,0.15)` in dark mode), and elevation. |
| `[NEW]` | `src/components/ui/gradient-button.tsx` | Primary action button with subtle gradient, active spring scale animation, disabled state, and loading spinner. |
| `[NEW]` | `src/components/ui/app-input.tsx` | Standardized text and numeric input with floating label, clear button, error state display, and active border glow. |
| `[NEW]` | `src/components/ui/badge.tsx` | Status pill component supporting variant colors (`success`, `warning`, `danger`, `neutral`, `pro-gold`). |
| `[NEW]` | `src/components/ui/empty-state.tsx` | Illustrated empty state container with contextual icon, title, description, and primary CTA button. |
| `[NEW]` | `src/components/ui/skeleton-loader.tsx` | Shimmer animated skeleton placeholder for dashboard cards and transaction list rows. |

---

### Phase 1: Core Database Migration, Category Isolation & Add Flow (Weeks 2–3)
> **Objective:** Resolve all immediate functional bugs: isolate Income and Expense categories, enable Bengali numeral parsing, and seed default income taxonomy.

| Action | File Path | Description & Acceptance Criteria |
|---|---|---|
| `[MODIFY]`| `src/constants/categories.ts` | Introduce `type: 'expense' \| 'income'`. Define 7 default expenses and 6 default incomes (`Salary`, `Freelance`, `Business`, `Investments`, `Gifts`, `Other Income`). |
| `[MODIFY]`| `src/components/category-icon.tsx` | Expand Lucide icon registry: add `Briefcase`, `Laptop`, `Building2`, `TrendingUp`, `Gift`, `Wallet`, `Banknote`, `Coins`. |
| `[MODIFY]`| `src/db/database.ts` | Bump `DB_VERSION` to `2`. In `createSchema`, add `type TEXT NOT NULL DEFAULT 'expense'` and `is_deleted INTEGER NOT NULL DEFAULT 0`. Implement automated v1 → v2 migration. |
| `[MODIFY]`| `src/db/categories.ts` | Add queries: `getCategoriesByType(type)`, `insertCustomCategory()`, `softDeleteCategory()`, `updateCategory()`. |
| `[MODIFY]`| `src/utils/currency.ts` | Add `fromBengaliNumerals` mapping (`০-৯` → `0-9`). Fix `parseAmount` to parse both English and Bengali numeric inputs smoothly. |
| `[MODIFY]`| `src/app/add.tsx` | 1) Dynamic category list based on selected `type` (Expense vs Income).<br>2) Stop auto-selecting category on load or tab change (`categoryId` set to null on switch).<br>3) Show validation error if no category selected.<br>4) Date chips: "Today", "Yesterday", and daily stepper.<br>5) Clean form reset post-submission. |

---

### Phase 2: Transaction Lifecycle, Level Tracking USP & Dashboard (Weeks 4–6)
> **Objective:** Deliver full transaction management (Edit/Delete with swipe gestures), foreign key constraint safety, category budget setup, and the core Level Tracking dashboard.

| Action | File Path | Description & Acceptance Criteria |
|---|---|---|
| `[NEW]` | `src/app/edit-transaction.tsx` | Modal screen to edit existing transaction: pre-fills amount, type, category, date, and note. Saves updates via `updateTransaction()`. |
| `[MODIFY]`| `src/components/transaction-list-item.tsx` | Wrap in `Swipeable` from `react-native-gesture-handler`: swipe right to delete (red action with trash icon), swipe left to edit (blue action with pencil icon). Tap navigates to edit modal. |
| `[MODIFY]`| `src/db/categories.ts` & `src/app/settings.tsx` | **Category Delete Edge Case:** If category has linked transactions (`COUNT > 0`), reject hard deletion with user dialog: provide option to soft-delete (`is_deleted = 1`) or reassign transactions to "Others" first. |
| `[MODIFY]`| `src/utils/level.ts` | Verify spending tier algorithm: 🟢 Low (<60%), 🟡 Moderate (60–89%), 🔴 High (≥90%). Isolate expense categories from income categories during budget calculation. |
| `[MODIFY]`| `src/app/index.tsx` | **Dashboard Overhaul:**<br>1) Top Financial Hero: Net Balance (`Income - Expense`) with badge.<br>2) Split Cards: This Month Income (green) & This Month Expense (rose).<br>3) Level Tracking Widget: Category breakdown with 🟢🟡🔴 pills and progress bar.<br>4) Category budget alerts when approaching 90%. |
| `[MODIFY]`| `src/app/budget.tsx` | Allow user to set total monthly budget and individual per-category budget limits (`categories.budget_limit`). |
| `[NEW]` | `src/app/category-manage.tsx` | Screen/Modal to view all categories, add custom category (name, color palette picker, icon picker), and edit existing limits. |

---

### Phase 3: SaaS Completion, Security & Analytics (Weeks 7–9)
> **Objective:** Implement user profiles, 4-digit PIN security with biometrics, CSV/JSON data backup, history filters, and onboarding.

| Action | File Path | Description & Acceptance Criteria |
|---|---|---|
| `[NEW]` | `src/store/userProfileStore.ts` | Zustand store with AsyncStorage persistence: `name`, `email`, `avatar`, `tier: 'free' \| 'pro'`. Methods: `updateProfile()`, `toggleTier()`. |
| `[NEW]` | `src/store/lockStore.ts` | Zustand store: `isLocked`, `pinHash`, `biometricsEnabled`, `hasPinSet`. |
| `[NEW]` | `src/components/pin-lock-modal.tsx` | Fullscreen 4-digit PIN lock screen with numeric keypad, shake animation on error, and biometric prompt trigger. |
| `[MODIFY]`| `src/app/_layout.tsx` | Integrate App Lock gate: if PIN is configured, display `PinLockModal` on app foreground until authenticated. Global error boundary for SQLite safety. |
| `[MODIFY]`| `src/app/settings.tsx` | **SaaS Settings Screen:**<br>1) User Profile Header Card (Avatar, Name, Email, "PRO" badge).<br>2) Security Section: Toggle PIN Lock, Set/Change PIN, Toggle Fingerprint/FaceID.<br>3) Data Management: Export CSV, Export JSON, Reset App Data with double confirmation. |
| `[NEW]` | `src/utils/export.ts` | Generate standard CSV and JSON strings from all transactions and categories. Trigger native download/share via `expo-file-system` and `expo-sharing`. |
| `[NEW]` | `src/app/onboarding.tsx` | 3-step carousel for first launch: 1) Level Tracking intro, 2) Dual language & currency setup, 3) Ready CTA. Stored in AsyncStorage (`@has_completed_onboarding`). |
| `[MODIFY]`| `src/app/history.tsx` | 1) Filter chips: "All", "Today", "This Week", "This Month", "Custom Range".<br>2) Universal search: query by note, category name, OR transaction amount (e.g., typing "500" filters items with amount 500). |
| `[MODIFY]`| `src/app/stats.tsx` | Add segmented toggle: Expense Breakdown vs. Income Breakdown. Render interactive category distribution for both types. |

---

### Phase 4: Production Polish, Store Assets & Launch (Weeks 10–12)
> **Objective:** Finalize app store compliance, regression testing, offline verification, and EAS automated builds.

| Action | File Path | Description & Acceptance Criteria |
|---|---|---|
| `[MODIFY]`| `app.json` | Set `android.package` (`com.expensetracker.app`), `ios.bundleIdentifier`, version `1.0.0`, build code `1`. Set Android permissions and splash styling. |
| `[NEW]` | `eas.json` | Configure EAS profiles: `development`, `preview` (internal APK testing), and `production` (AAB with auto-versioning). |
| `[NEW]` | `src/components/error-boundary.tsx` | React error boundary wrapping root navigation to catch unexpected runtime errors and show a "Restart App" screen. |
| `[MODIFY]`| Assets & Documentation | Prepare 512×512 icon, 1024×500 feature graphic, 6 Play Store mockups, bilingual privacy policy document hosted online. |

---

### Fast-Follow Backlog (Post-MVP — Weeks 13+)
- **Supabase Cloud Sync:** Real-time bi-directional database synchronization with Row Level Security (RLS).
- **RevenueCat Paywall:** Real in-app subscription purchases (Monthly/Yearly/Lifetime Pro).
- **Recurring Expenses Engine:** Background tasks via Expo TaskManager for automated subscription/bill entry.
- **Web Dashboard:** Expo Router web deployment with unified Supabase auth.

---

## 4. 🗄️ Database Schema v2 & Migration System

### 4.1 SQLite DDL (Version 2)
```sql
-- Categories Table (v2)
CREATE TABLE IF NOT EXISTS categories (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name_en      TEXT NOT NULL,
  name_bn      TEXT NOT NULL,
  icon         TEXT NOT NULL,
  color        TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT 'expense' CHECK(type IN ('expense', 'income')),
  is_default   INTEGER NOT NULL DEFAULT 0,
  budget_limit REAL,
  is_deleted   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  amount      REAL    NOT NULL CHECK(amount > 0),
  category_id INTEGER NOT NULL,
  type        TEXT    NOT NULL CHECK(type IN ('expense', 'income')),
  note        TEXT,
  date        TEXT    NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  synced      INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

-- Budgets Table (Monthly Total)
CREATE TABLE IF NOT EXISTS budgets (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  month       TEXT    NOT NULL,
  total_limit REAL    NOT NULL CHECK(total_limit > 0),
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(month)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_date      ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category  ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type      ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date_type ON transactions(date, type);
CREATE INDEX IF NOT EXISTS idx_categories_type        ON categories(type, is_deleted);
```

### 4.2 Migration Routine (v1 → v2)
```ts
async function runMigrations(db: SQLite.SQLiteDatabase, fromVersion: number, toVersion: number): Promise<void> {
  for (let v = fromVersion + 1; v <= toVersion; v++) {
    if (v === 2) {
      await db.withTransactionAsync(async () => {
        // 1. Add type and is_deleted columns if upgrading from v1
        await db.execAsync(`
          ALTER TABLE categories ADD COLUMN type TEXT NOT NULL DEFAULT 'expense';
          ALTER TABLE categories ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0;
        `);

        // 2. Seed Default Income Categories safely
        const incomeCategories = [
          { name_en: 'Salary', name_bn: 'বেতন', icon: 'Briefcase', color: '#10B981', type: 'income' },
          { name_en: 'Freelance', name_bn: 'ফ্রিল্যান্সিং', icon: 'Laptop', color: '#06B6D4', type: 'income' },
          { name_en: 'Business', name_bn: 'ব্যবসা', icon: 'Building2', color: '#8B5CF6', type: 'income' },
          { name_en: 'Investments', name_bn: 'বিনিয়োগ', icon: 'TrendingUp', color: '#F59E0B', type: 'income' },
          { name_en: 'Gifts', name_bn: 'উপহার', icon: 'Gift', color: '#EC4899', type: 'income' },
          { name_en: 'Other Income', name_bn: 'অন্যান্য আয়', icon: 'Wallet', color: '#64748B', type: 'income' },
        ];

        for (const cat of incomeCategories) {
          await db.runAsync(
            `INSERT INTO categories (name_en, name_bn, icon, color, type, is_default, budget_limit, is_deleted)
             VALUES (?, ?, ?, ?, ?, 1, NULL, 0);`,
            [cat.name_en, cat.name_bn, cat.icon, cat.color, cat.type]
          );
        }
      });
    }
  }
}
```

---

## 5. 📂 Consolidated Folder Structure

```
expense-tracker/
├── assets/                          # App icons, splash, store mockups
├── src/
│   ├── app/                         # Expo Router screens (file = route)
│   │   ├── _layout.tsx              # Root Tab Navigator & Auth Gate
│   │   ├── index.tsx                # Dashboard (Net Balance + Level Tracking)
│   │   ├── add.tsx                  # 3-Tap Add Screen (Dual mode)
│   │   ├── edit-transaction.tsx     # [NEW] Edit Transaction modal
│   │   ├── history.tsx              # History (Swipe actions, date chips, amount search)
│   │   ├── budget.tsx               # Total & Per-category budget manager
│   │   ├── stats.tsx                # Analytics (Expense vs Income toggle)
│   │   ├── settings.tsx             # Profile, PIN lock, Currency, CSV export
│   │   ├── category-manage.tsx      # [NEW] Custom Category manager
│   │   └── onboarding.tsx           # [NEW] First-launch walkthrough
│   ├── components/
│   │   ├── ui/                      # [Phase 0] Reusable Design System Library
│   │   │   ├── glass-card.tsx       # Frosted glass card
│   │   │   ├── gradient-button.tsx  # Spring-animated primary button
│   │   │   ├── app-input.tsx        # Styled form input
│   │   │   ├── badge.tsx            # Status/Level pills
│   │   │   ├── empty-state.tsx      # Contextual empty state
│   │   │   └── skeleton-loader.tsx  # Shimmer loading skeleton
│   │   ├── category-icon.tsx        # Expanded 16+ Lucide icon registry
│   │   ├── transaction-list-item.tsx# Swipeable list row
│   │   ├── pin-lock-modal.tsx       # 4-Digit keypad & Biometric view
│   │   └── error-boundary.tsx       # Global SQLite & React crash shield
│   ├── constants/
│   │   ├── tokens.ts                # [NEW] Spacing, Radius, Typography
│   │   ├── colors.ts                # Expanded Light & Dark palettes
│   │   ├── categories.ts            # Default Expense + Income definitions
│   │   └── config.ts                # Thresholds, DB config, limits
│   ├── db/
│   │   ├── database.ts              # SQLite lifecycle & v1→v2 migration
│   │   ├── categories.ts            # Category queries & soft-delete logic
│   │   ├── transactions.ts          # CRUD & multi-criteria search
│   │   └── budgets.ts               # Monthly & category budget CRUD
│   ├── hooks/
│   │   ├── useAppColors.ts          # Theme color accessor
│   │   ├── useI18n.ts               # Dual-language translator
│   │   └── useSecurity.ts           # [NEW] PIN & Biometric session check
│   ├── store/
│   │   ├── settingsStore.ts         # Theme, Language, Currency
│   │   ├── userProfileStore.ts      # [NEW] Name, Email, Avatar, SaaS Tier
│   │   └── lockStore.ts             # [NEW] PIN Hash, Biometric enabled
│   ├── utils/
│   │   ├── currency.ts              # Dual English/Bengali amount parser & formatter
│   │   ├── date.ts                  # Date formats, ranges, Bengali calendar
│   │   ├── level.ts                 # Core 🟢🟡🔴 Level tracking algorithm
│   │   └── export.ts                # [NEW] CSV & JSON report generator
│   └── i18n/
│       ├── en.ts                    # English strings dictionary
│       ├── bn.ts                    # Bengali strings dictionary
│       └── index.ts                 # Export helper
├── app.json                         # Expo configuration (CNG, API 35)
├── package.json                     # Dependencies
└── tsconfig.json                    # Strict type definitions & aliases
```

---

## 6. 🎨 Design System & Visual Specification

### 6.1 Spacing & Radius Tokens
```ts
export const Tokens = {
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, section: 32 },
  radius: { sm: 8, md: 12, lg: 16, xl: 20, card: 24, full: 999 },
  touchTarget: 44, // Minimum touch size in dp
};
```

### 6.2 FinTech Color Palette (`src/constants/colors.ts`)
```ts
export const Colors = {
  light: {
    primary: '#4F46E5',         // Indigo
    primaryLight: '#EEF2FF',
    accent: '#0EA5E9',          // Sky
    success: '#10B981',         // Emerald Income / Level Low
    warning: '#F59E0B',         // Amber Level Moderate
    danger: '#EF4444',          // Rose Expense / Level High
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceAlt: '#F1F5F9',
    glassBorder: 'rgba(226, 232, 240, 0.8)',
    text: '#0F172A',
    textMuted: '#64748B',
    border: '#E2E8F0',
  },
  dark: {
    primary: '#6366F1',
    primaryLight: 'rgba(99, 102, 241, 0.15)',
    accent: '#38BDF8',
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#F87171',
    background: '#0B0F19',      // Deep FinTech Obsidian
    surface: '#151D2F',
    surfaceAlt: '#1E293B',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    border: '#1E293B',
  },
};
```

---

## 7. 🧪 Extended QA & Verification Plan

### 7.1 Automated Quality Gates
```bash
# 1. Typecheck (Zero errors)
npx tsc --noEmit

# 2. Linting (Expo ESLint)
npx eslint .

# 3. Expo Environment Diagnostics
npx expo-doctor
```

### 7.2 Critical Test Cases (Manual & Integration)

| Test ID | Scenario | Procedure | Expected Outcome |
|---|---|---|---|
| **MIG-01** | **Database Migration (v1 → v2)** | Install v1 schema, insert 10 expenses across v1 categories, trigger v2 app launch. | 0 data loss. Existing categories have `type='expense'`. 6 new income categories seeded. DB version equals 2. |
| **OFF-01** | **Airplane Mode Reliability** | Enable device Airplane mode. Launch app, insert 3 expenses, 2 incomes, edit 1 item, filter history, and view stats. | Zero crash. All queries succeed instantly from local SQLite. |
| **NUM-01** | **Bengali Digit Input Parsing** | Set language to Bengali. In Add screen, type `৫২৫০.৫০` into amount input. Submit form. | Parsed successfully as `5250.50`. Saves to SQLite without "Amount Invalid" error. |
| **TX-01** | **Swipe Lifecycle (Edit & Delete)** | In History list, swipe right on an item → tap Delete → confirm dialog. Swipe left on another item → tap Edit → update note → save. | Swipes animate smoothly at 60fps. Delete removes row. Edit updates database and refreshes list. |
| **CAT-01** | **Foreign Key Delete Restriction** | Attempt to delete a category that has 5 existing transactions. | App intercepts constraint error: shows user modal explaining transactions exist; offers soft-delete or transfer to "Others". |
| **SEC-01** | **PIN Lock & Biometrics** | Configure 4-digit PIN in Settings. Force close app and relaunch. Enter incorrect PIN 3 times, then correct PIN. | Keypad shakes on failure. App remains locked until correct PIN or biometric scan. |
| **EXP-01** | **Data Backup & Export** | Navigate to Settings → tap "Export CSV". Select native share (Drive/Gmail/Files). | Generates valid CSV file containing all dates, types, categories, amounts, and notes. |

---

## 8. 📋 Google Play Store & Apple App Store Checklist

### 8.1 Technical Compliance
- [ ] Target SDK: **Android 15 (API level 35)** verified in `app.json`.
- [ ] 64-bit architecture support (built-in with Expo CNG).
- [ ] Android App Bundle (`.aab`) export configured via EAS.
- [ ] Keystore secured and backed up in password vault (never committed to git).
- [ ] Strict 44×44 dp touch targets verified across all touchables.

### 8.2 Store Listing Assets
- [ ] **App Icon:** 512×512 PNG, no transparency.
- [ ] **Feature Graphic:** 1024×500 PNG/JPEG (Google Play).
- [ ] **Screenshots:** Minimum 4 phone screenshots (1080×2400) + 7" tablet mockups.
- [ ] **Privacy Policy:** Hosted on GitHub Pages / Netlify stating 100% on-device data processing.
- [ ] **Data Safety Questionnaire:** Declare no personal data collected or shared with third parties.

---

## 9. 📌 Comprehensive Decision Log

| Decision ID | Choice | Alternative Considered | Rationale |
|---|---|---|---|
| **DEC-01** | **Expo Router v4** | React Navigation bare | File-based routes simplify deep linking, tabs, and modals without boilerplates. |
| **DEC-02** | **expo-sqlite** | WatermelonDB / Realm | Built-in Expo module, reliable SQL, zero complex native config, fully offline. |
| **DEC-03** | **Zustand + AsyncStorage**| Redux Toolkit | 90% less code, fast setup, lightweight for settings, profile, and security lock. |
| **DEC-04** | **Level Algorithm (USP)**| Simple progress bar | Categorical tiering (🟢🟡🔴) alerts users before budget exhaustion, delivering core differentiator. |
| **DEC-05** | **Offline SaaS Profile** | Forced Online Sign-in | Allows immediate conversion without login friction; ready to plug Supabase auth later. |
| **DEC-06** | **Dual Script Parsing** | English-only digits | Essential for Bangladeshi local market where users frequently type on Bengali phonetic keyboards. |
| **DEC-07** | **Category Soft-Delete** | Cascading Delete | Prevents accidental loss of historical financial records when deleting a category. |

---

## 10. 🏁 Definition of Done (DoD) per Feature
1. **Code Standards:** 100% TypeScript strict, zero linter warnings (`npx eslint .` passes).
2. **Performance:** Smooth 60fps scrolling and gesture response on mid-range Android hardware.
3. **Dual Language:** Verified in both English and Bengali locales.
4. **Resilience:** Graceful empty states, skeleton loaders on async fetch, and no unhandled exceptions.
5. **Security:** Local data protected, sensitive actions require user confirmation.
