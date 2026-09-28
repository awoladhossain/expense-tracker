# 📱 Expense Tracker — Project Plan (Pre-Development Document)

> **Version:** 2.0 (Reviewed & Updated)
> **Date:** 2026-09-28
> **Platform:** Android (Play Store) → iOS (App Store)
> **Framework:** React Native + Expo SDK 57 (TypeScript)
> **Goal:** Category/Level-wise expense tracking app, production-ready for store release.

---

## 1. 🎯 Project Overview

Ekta expense tracker app jekhane user tar daily/monthly khoroch track korbe.
Unique selling point: **"Level" tracking** — category onujayi spending tier
(🟢 Low / 🟡 Moderate / 🔴 High) dekhano hobe, jate user jante pare kon category te
tar khoroch "level" cross kore geche.

### Success Criteria
- [ ] 3-tap e expense entry hobe
- [ ] Offline e full functionality (no internet lagbe na)
- [ ] Play Store e production release
- [ ] App Store e production release (Phase 3+)
- [ ] Bangla + English UI support

---

## 2. 🛠️ Tech Stack (Final Decision)

> [!IMPORTANT]
> `package.json` already has **Expo Router** (not React Navigation). Navigation section updated accordingly.

| Layer | Technology | Version/Notes |
|---|---|---|
| Framework | Expo (managed workflow) | SDK 57 (`expo: ~57.0.25`) |
| Language | TypeScript | ~6.0.3, Strict mode on |
| Navigation | **Expo Router v4** | File-based routing (already in package.json) |
| State Management | Zustand | Lightweight, no boilerplate (**install needed**) |
| Local Database | expo-sqlite | Structured offline storage (**install needed**) |
| Charts | react-native-gifted-charts | Pie/bar/line for dashboard (**install needed**) |
| Forms | react-hook-form + zod | Type-safe validation (**install needed**) |
| Icons | lucide-react-native | Modern, tree-shakeable (**install needed**) |
| Notifications | expo-notifications | Daily reminder (**install needed**) |
| Haptics | expo-haptics | Premium feel on interactions (**install needed**) |
| Settings Storage | @react-native-async-storage | Theme, language, budget prefs (**install needed**) |
| Gestures | react-native-gesture-handler | ~2.32.0 (already installed) |
| Animations | react-native-reanimated | 4.5.1 (already installed) |
| Backend (Phase 3) | Supabase | Auth + cloud sync |
| Build/Deploy | EAS Build + EAS Submit | Play Store / App Store |
| Monetization (Phase 3) | RevenueCat | Subscription management |

### 📦 Packages to Install (Phase 1)
```bash
npx expo install expo-sqlite expo-haptics expo-notifications
npx expo install @react-native-async-storage/async-storage
npx expo install lucide-react-native react-native-svg
npm install zustand react-hook-form zod
npm install react-native-gifted-charts
```

> [!WARNING]
> `react-native-gifted-charts` requires `react-native-svg` as peer dependency — install both together.

---

## 3. 📦 Feature Roadmap (Phased)

### Phase 1 — MVP (Week 1–4)
Core app, offline-first.

| # | Feature | Priority | Notes |
|---|---|---|---|
| 1 | Quick expense entry (amount, category, note, date) | 🔴 Must | Max 3 taps, numeric keyboard first |
| 2 | Category system (7 default + custom add) | 🔴 Must | Food, Transport, Bills, Shopping, Health, Entertainment, Others |
| 3 | Dashboard (today, this month, category breakdown) | 🔴 Must | Donut chart + summary cards |
| 4 | Daily / Weekly / Monthly view switch | 🔴 Must | Tab/segment control |
| 5 | Transaction history + search + filter | 🔴 Must | By category, date range, amount |
| 6 | Monthly budget set + progress bar | 🔴 Must | % based color coding |
| 7 | **Level tracking** (Low/Moderate/High per category) | 🟡 Should | Core USP |
| 8 | Local SQLite storage | 🔴 Must | Offline full support |
| 9 | Dark mode | 🟡 Should | System theme follow |
| 10 | Bangla + English toggle | 🟡 Should | Local market advantage |

### Phase 2 — Growth (Week 5–8)
| # | Feature | Priority |
|---|---|---|
| 11 | Income tracking + net savings view | 🟡 Should |
| 12 | Recurring expenses (auto-entry for bills) | 🟡 Should |
| 13 | CSV / PDF export | 🟢 Could |
| 14 | Currency selector (৳ $ € ₹) | 🟡 Should |
| 15 | Daily reminder notification | 🟢 Could |
| 16 | Home screen widget | 🟢 Could |

### Phase 3 — Monetization & Cloud (Week 9–12)
| # | Feature | Priority |
|---|---|---|
| 17 | Supabase auth + cloud backup/sync | 🔴 Must |
| 18 | Freemium: Premium subscription | 🔴 Must |
| 19 | Premium features: unlimited budgets, advanced charts, PDF reports, no ads | 🔴 Must |
| 20 | AdMob (free tier, non-intrusive) | 🟢 Could |
| 21 | Play Store release | 🔴 Must |
| 22 | App Store release | 🟡 Should |

---

## 4. 🗄️ Database Schema (SQLite)

```sql
-- Categories table
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,          -- lucide icon name
  color TEXT NOT NULL,         -- hex color
  is_default INTEGER DEFAULT 0,
  budget_limit REAL,           -- per-category budget (optional)
  created_at TEXT DEFAULT (datetime('now'))
);

-- Transactions table
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount REAL NOT NULL CHECK(amount > 0),
  category_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
  note TEXT,
  date TEXT NOT NULL,          -- ISO format: YYYY-MM-DD
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  synced INTEGER DEFAULT 0,    -- for future cloud sync
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

-- Budget table (monthly)
CREATE TABLE budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  month TEXT NOT NULL,         -- YYYY-MM
  total_limit REAL NOT NULL CHECK(total_limit > 0),
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(month)
);

-- Settings (key-value, stored in AsyncStorage)
-- theme, language, currency, reminder_time, premium_status
```

> [!NOTE]
> `ON DELETE RESTRICT` added to prevent orphan transactions if a category is deleted. `CHECK(amount > 0)` and `CHECK(total_limit > 0)` constraints added for data integrity.

### Indexes
```sql
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_type ON transactions(type);
```

> [!TIP]
> `idx_transactions_type` added — income vs expense filter query will be frequent, this index speeds it up.

---

## 5. 🗂️ Folder Structure

> [!IMPORTANT]
> Project uses **Expo Router** (file-based routing). Screens are inside `app/` directory — NOT a `screens/` folder. This is a critical architectural difference from React Navigation.

```
expense-tracker/
├── app/                         # Expo Router — all screens (file = route)
│   ├── _layout.tsx              # Root layout (Tab navigator)
│   ├── index.tsx                # Dashboard / Home screen
│   ├── add.tsx                  # Add Expense screen
│   ├── history.tsx              # Transaction history
│   ├── budget.tsx               # Budget management
│   ├── stats.tsx                # Analytics / charts
│   └── settings.tsx             # Settings screen
├── app.json                     # Expo config
├── tsconfig.json                # Path alias: @/* → src/*
├── assets/                      # Icons, splash, images
└── src/
    ├── components/              # Reusable UI
    │   ├── ui/                  # Button, Card, Input, Badge, Modal
    │   ├── charts/              # ExpenseChart, BudgetProgress
    │   └── expense/             # ExpenseItem, CategoryPicker
    ├── store/                   # Zustand stores
    │   ├── expenseStore.ts
    │   ├── budgetStore.ts
    │   └── settingsStore.ts
    ├── db/
    │   ├── database.ts          # SQLite init + migrations
    │   ├── transactions.ts      # CRUD queries
    │   ├── categories.ts
    │   └── budgets.ts
    ├── hooks/
    │   ├── useExpenses.ts
    │   ├── useBudget.ts
    │   └── useLevel.ts          # Level calculation logic
    ├── utils/
    │   ├── currency.ts          # Format ৳1,250.50
    │   ├── date.ts              # Format, ranges, Bengali months
    │   └── level.ts             # Low/Moderate/High calculation
    ├── constants/
    │   ├── colors.ts            # Light + dark palette
    │   ├── categories.ts        # Default 7 categories with icons
    │   └── config.ts            # App-wide constants (budget thresholds etc.)
    └── i18n/                    # Bangla + English
        ├── bn.json
        ├── en.json
        └── index.ts
```

> [!NOTE]
> `src/assets/` folder removed — fonts/illustrations go in root `assets/` which Expo manages via `app.json`. Two `assets/` folders cause confusion.
> `screens/` and `navigation/` folders removed — Expo Router handles this via `app/` directory.

---

## 6. 🎨 UI/UX Design System

### Color Palette
```ts
// Light theme
primary:    '#4F46E5',  // Indigo — trust + modern
secondary:  '#0EA5E9',  // Sky
success:    '#16A34A',  // Income / Low level
warning:    '#F59E0B',  // Moderate level
danger:     '#EF4444',  // High level / Over budget
surface:    '#FFFFFF',
background: '#F8FAFC',
text:       '#0F172A',
textMuted:  '#64748B',
border:     '#E2E8F0',  // Added: needed for card/input borders

// Dark theme
background: '#0F172A',
surface:    '#1E293B',
surfaceAlt: '#334155',  // Added: for nested cards in dark mode
text:       '#F1F5F9',
textMuted:  '#94A3B8',  // Added: muted text for dark theme
border:     '#334155',  // Added
```

### Typography
- Font: **Inter** (English), **Noto Sans Bengali** (Bangla)
- Scale: 12 / 14 / 16 / 18 / 22 / 28 / 34
- Line height: 1.5× font size (readability)

### Design Rules
1. Home = Dashboard (summary first, history second)
2. FAB "+ Add" always visible, 1-tap away
3. Amount input first, numeric keyboard auto-open
4. Every destructive action e confirmation dialog
5. Empty states: illustration + friendly CTA text
6. Haptic feedback on entry confirm (light impact)
7. Budget bar colors: 🟢 <70%, 🟡 70–95%, 🔴 >95%
8. Min touch target: 44×44 dp (Apple HIG / Material You compliant)
9. **Loading states:** Every async DB operation e skeleton loader (not blank screen)
10. **Error states:** SQLite error hole user-friendly message, not crash

### Home Screen Wireframe
```
┌─────────────────────────┐
│  আজ         Sep 2026  ⚙│  ← Header: date + settings icon
│ ৳ 450                  │  ← Today total (big, bold)
│ ┌─────────┐ ┌─────────┐ │
│ │ Month   │ │ Budget  │ │  ← Summary cards
│ │ ৳ 8,240 │ │ 68% used│ │
│ └─────────┘ └─────────┘ │
│                         │
│  [ Donut Chart ]        │  ← Category breakdown
│  Food 40% Transport 25% │
│                         │
│  Recent Transactions ── │
│  🍔 Food      -৳120     │
│  🚌 Transport  -৳60     │
│                         │
│ [🏠][📊][+][📜][⚙]     │  ← Bottom tab bar
└─────────────────────────┘
```

> [!NOTE]
> Bottom tab bar added to wireframe — Expo Router uses `app/_layout.tsx` with `<Tabs>` component to render this.

---

## 7. 🧮 Level Logic (Core Algorithm)

```ts
export type Level = 'low' | 'moderate' | 'high';

/**
 * Returns spending level based on ratio of spent vs budget.
 * If no budget is set (budget = 0), always returns 'low'.
 */
export function getLevel(spent: number, budget: number): Level {
  if (budget <= 0) return 'low';         // Budget not set — no warning
  const ratio = spent / budget;
  if (ratio >= 0.9) return 'high';       // 90%+ of budget
  if (ratio >= 0.6) return 'moderate';   // 60–89%
  return 'low';                          // under 60%
}

export function getLevelColor(level: Level): string {
  const colors: Record<Level, string> = {
    low:      '#16A34A',
    moderate: '#F59E0B',
    high:     '#EF4444',
  };
  return colors[level];
}

export function getLevelEmoji(level: Level): string {
  return { low: '🟢', moderate: '🟡', high: '🔴' }[level];
}

/**
 * Per-category level:
 * If user sets category budget → use that.
 * Else → divide monthly total_limit equally among all categories.
 */
export function getCategoryBudget(
  categoryBudgetLimit: number | null,
  totalMonthlyBudget: number,
  totalCategories: number,
): number {
  if (categoryBudgetLimit && categoryBudgetLimit > 0) return categoryBudgetLimit;
  if (totalCategories <= 0) return 0;
  return totalMonthlyBudget / totalCategories;
}
```

> [!WARNING]
> Original code had `budget > 0 ? spent / budget : 0` — silent failure. Fixed with explicit guard + JSDoc.
> `getLevelEmoji()` and `getCategoryBudget()` were described in prose but missing from code — now added.

---

## 8. 📅 Development Roadmap

| Week | Deliverable |
|---|---|
| Week 1 | Setup, design system, DB schema + migrations, folder structure, install all Phase 1 packages |
| Week 2 | Add expense flow, category picker, Zustand stores, DB CRUD |
| Week 3 | Home dashboard, charts, history screen + search/filters |
| Week 4 | Budget screen, Level logic UI, dark mode, i18n (BN/EN), polish + internal QA |
| **Milestone 1** | 🎉 **MVP complete — internal testing (Play Internal / TestFlight)** |
| Week 5–6 | Income tracking, recurring expenses, CSV export |
| Week 7–8 | Notifications, currency selector, Play Store assets prep (screenshots, description) |
| **Milestone 2** | 🎉 **Play Store internal/closed testing** |
| Week 9–10 | Supabase sync, auth, RevenueCat premium setup |
| Week 11–12 | Full regression testing, bug fixes, **Play Store production release** |
| Post-launch | User feedback → analytics, App Store submission, Phase 3 iterations |

---

## 9. 📋 Play Store / App Store Checklist

### Must have before release
- [ ] Privacy Policy page (free hosting: GitHub Pages / Netlify) — **required even if no data collection**
- [ ] App icon: 512×512 PNG (Play) / 1024×1024 PNG (App Store) — **no transparency for iOS**
- [ ] Feature graphic: 1024×500 (Play Store only)
- [ ] Screenshots: min 2, recommended 6–8 (phone + 7" tablet for Play Store)
- [ ] App description: short ≤80 chars + full ≤4000 chars — Bangla + English
- [ ] Content rating questionnaire (IARC)
- [ ] Data safety form — declare local-only data storage
- [ ] Target SDK: **Android API 35** (latest requirement as of 2026)
- [ ] `app.json` → `android.package`: e.g., `com.yourname.expensetracker`
- [ ] `app.json` → `ios.bundleIdentifier`: e.g., `com.yourname.expensetracker`
- [ ] `app.json` → `version` and `android.versionCode` properly set

### Accounts
- [ ] Google Play Developer: **$25 one-time**
- [ ] Apple Developer: **$99/year** (iOS release er somoy)

### Technical before build
- [ ] `eas.json` configure (development / preview / production profiles)
- [ ] `eas-cli` install: `npm install -g eas-cli` + `eas login`
- [ ] App version + build number management (`versionCode` for Android, `buildNumber` for iOS)
- [ ] ProGuard / resource shrinking for AAB (auto via EAS)
- [ ] `EAS Submit` setup for automated store upload
- [ ] **Signing keys:** Android keystore backup koro — hariye gele app update dite parbe na

> [!CAUTION]
> Android keystore NEVER commit to git. Store it safely (password manager / encrypted backup). Losing it = cannot publish updates to the same app listing.

---

## 10. ⚠️ Risks & Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| SQLite Expo Go te limited | High | Development build use koro: `npx expo run:android` |
| Chart performance on old devices | Medium | Limit data points to last 30 days by default; add "load more" |
| Bangla font rendering issues | Medium | Noto Sans Bengali real device e test koro (emulator accurate na) |
| Play Store review rejection | Medium | Privacy policy, no misleading claims, follow Play Policy |
| Scope creep | High | Phase te stick koro, new idea backlog e rakho |
| Data loss on app uninstall | High | Phase 3 e cloud backup; till then CSV export (Week 5–6) |
| Expo Router upgrade breaking changes | Medium | SDK version lock koro (~57.x.x), patch only during Phase 1 |
| SQLite migration failure | High | `database.ts` e version-based migration system implement koro |

---

## 11. 📌 Decision Log (Future reference)

| Decision | Choice | Reason |
|---|---|---|
| State management | Zustand over Redux | Less boilerplate, perfect for small-medium app |
| Local DB | SQLite over AsyncStorage | Relational queries, faster aggregation |
| Charts | gifted-charts over victory-native | Better Expo compatibility, active maintenance |
| Monorepo? | No | Single app, unnecessary complexity |
| Backend | Supabase over Firebase | SQL familiar, generous free tier, RLS security |
| **Navigation** | **Expo Router over React Navigation** | **Already in package.json; file-based routing = cleaner code** |
| **Routing style** | **Tab-based (bottom tabs)** | **5 main sections: Home, Stats, Add, History, Settings** |

---

## 12. ✅ Definition of Done (per feature)

- [ ] Feature works on Android real device + emulator (API 30+)
- [ ] Works in dark mode
- [ ] Bangla + English both e text thik ache
- [ ] No console errors/warnings (production build)
- [ ] TypeScript strict — zero `any` type
- [ ] Offline test passed (airplane mode)
- [ ] Loading + error state handled (no blank/crash)
- [ ] Touch targets minimum 44×44 dp

---

## 13. 🚀 Week 1 Execution Checklist (Immediate Next Steps)

> [!IMPORTANT]
> Ei checklist follow kore Week 1 shuru koro.

- [ ] Install all Phase 1 packages (see Section 2)
- [ ] `app.json` → `android.package` name set koro
- [ ] `tsconfig.json` → `@/*` path alias verify koro
- [ ] `src/constants/colors.ts` create koro (light + dark palette)
- [ ] `src/constants/categories.ts` create koro (7 default categories)
- [ ] `src/db/database.ts` create koro — SQLite init + schema migration
- [ ] `app/_layout.tsx` — Root `<Tabs>` navigator setup
- [ ] `app/index.tsx` — Empty Dashboard screen (placeholder)
- [ ] EAS project setup: `eas init` (eas.json create hobe)

---

> **Next Step:** Ei updated plan confirm koro → Week 1 execution shuru koro.
> **Key change:** Navigation = Expo Router (not React Navigation). Folder structure updated accordingly.
