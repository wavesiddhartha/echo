# Echo — Full Product Specification

> *"Because silence isn't what you meant."*

---

## Implementation Status

> **Last updated:** 2026-06-16 | **Built by:** Antigravity AI

### ✅ Phase 1 — MVP (Complete)
| Ticket | Feature | Status | File |
|--------|---------|--------|------|
| ECHO-001 | Next.js 16 + Tailwind + serwist PWA | ✅ Done | `next.config.ts`, `package.json` |
| ECHO-002 | Design token system (CSS vars, dark/light/auto) | ✅ Done | `app/globals.css` |
| ECHO-003 | IndexedDB schema via Dexie v4 | ✅ Done | `lib/db.ts` |
| ECHO-004 | Home screen — pending list UI | ✅ Done | `components/home/HomeScreen.tsx` |
| ECHO-005 | Add reminder — bottom sheet UI | ✅ Done | `components/add/AddReminderSheet.tsx` |
| ECHO-006 | Contact name + emoji avatar fallback | ✅ Done | `components/home/ReplyCard.tsx` |
| ECHO-007 | Note input (200 char limit + counter) | ✅ Done | `components/add/AddReminderSheet.tsx` |
| ECHO-008 | Quick time picker (2h, tonight, tomorrow, custom) | ✅ Done | `components/add/AddReminderSheet.tsx` |
| ECHO-009 | Local push notification scheduling (SW) | ✅ Done | `app/sw.ts`, `hooks/useNotifications.ts` |
| ECHO-010 | Swipe to mark done (spring animation) | ✅ Done | `components/home/ReplyCard.tsx` |
| ECHO-011 | Swipe to delete (undo toast) | ✅ Done | `components/home/ReplyCard.tsx` |
| ECHO-012 | Done list screen | ✅ Done | `components/done/DoneList.tsx` |
| ECHO-013 | Settings — theme toggle (light/dark/auto) | ✅ Done | `components/settings/SettingsScreen.tsx` |
| ECHO-014 | Settings — notification toggle | ✅ Done | `components/settings/SettingsScreen.tsx` |
| ECHO-015 | Onboarding (3 screens, localStorage flag) | ✅ Done | `components/onboarding/OnboardingFlow.tsx` |
| ECHO-016 | Empty state + waveform animation | ✅ Done | `components/home/EmptyState.tsx` |
| ECHO-017 | PWA manifest + install | ✅ Done | `app/manifest.ts`, `public/icons/` |
| ECHO-018 | Offline support (Dexie local-first) | ✅ Done | `lib/db.ts`, `app/sw.ts` |
| ECHO-033 | Optional note field + chip shortcuts | ✅ Done | `components/add/AddReminderSheet.tsx` |
| ECHO-034 | Frequent people row in add sheet | ✅ Done | `components/add/AddReminderSheet.tsx` |
| ECHO-035 | Smart time suggestion ("your usual") | ✅ Done | `lib/db.ts`, `components/add/AddReminderSheet.tsx` |
| ECHO-036 | Escalating overdue warmth system | ✅ Done | `components/home/ReplyCard.tsx` |
| ECHO-037 | Notification action buttons (done/snooze) | ✅ Done | `app/sw.ts`, `hooks/useNotifications.ts` |
| ECHO-038 | Contacts autocomplete (history-based, PWA) | ✅ Done | `lib/db.ts`, `components/add/AddReminderSheet.tsx` |
| ECHO-039 | Weekly summary notification + share card | ✅ Done | `hooks/useNotifications.ts`, `components/done/DoneList.tsx` |

### ✅ Phase 2 — Polish (Complete)
| Ticket | Feature | Status | File |
|--------|---------|--------|------|
| ECHO-019 | Export data as JSON | ✅ Done | `components/settings/SettingsScreen.tsx` |
| ECHO-020 | Delete all data + confirmation | ✅ Done | `components/settings/SettingsScreen.tsx` |
| ECHO-021 | Snooze reminder (+1h, tonight, tomorrow, +3 days) | ✅ Done | `components/home/SnoozeSheet.tsx` |
| ECHO-022 | Overdue indicator (soft amber warmth, no red) | ✅ Done | `components/home/ReplyCard.tsx` |
| ECHO-023 | Streak counter (weekly replied count) | ✅ Done | `components/settings/SettingsScreen.tsx`, `lib/db.ts` |
| ECHO-024 | Haptic feedback (navigator.vibrate) | ✅ Done | `components/home/HomeScreen.tsx`, `ReplyCard.tsx` |
| ECHO-025 | Reduced motion support (@media prefers-reduced-motion) | ✅ Done | `app/globals.css` |
| ECHO-026 | Keyboard navigation (tabIndex, focus-visible, key handlers) | ✅ Done | `components/home/ReplyCard.tsx` |

### ⏳ Phase 3 — Growth (Planned)
| Ticket | Feature | Status | Notes |
|--------|---------|--------|-------|
| ECHO-027 | Supabase auth | 📋 Planned | v2 — schema ready |
| ECHO-028 | Cross-device sync | 📋 Planned | v2 — needs Supabase |
| ECHO-029 | React Native (iOS + Android) | 📋 Planned | Data layer abstracted in `lib/db.ts` |
| ECHO-030 | iOS widget | 📋 Planned | Requires native RN |
| ECHO-031 | Share card | 📋 Planned | — |
| ECHO-032 | Platform tag on contact | 📋 Partial | Platform picker implemented in add sheet |
| ECHO-040 | Share sheet extension (iOS + Android native) | 📋 Planned | Phase 3 |
| ECHO-041 | Home screen widget (iOS WidgetKit) | 📋 Planned | Phase 3 |
| ECHO-042 | Lock screen widget (iOS) | 📋 Planned | Phase 3 |
| ECHO-043 | Watch complication (watchOS) | 📋 Planned | Phase 3 |
| ECHO-044 | Siri shortcut integration | 📋 Planned | Phase 3 |
| ECHO-045 | Android intent filter for share | 📋 Planned | Phase 3 |

### Tech Stack (Actual)
```
Framework:     Next.js 16.2.9 (App Router, webpack mode)
Styling:       Tailwind CSS v4 + CSS Variables (design tokens)
Animation:     Motion v12 (Framer Motion)
State:         Zustand v5
Storage:       Dexie v4 → IndexedDB (local-first, offline)
Notifications: Service Worker + Web Notifications API
PWA:           @serwist/next v9
Fonts:         Instrument Serif, Inter, JetBrains Mono (Google Fonts)
```

---



## App Name & Identity

**Name:** `Echo`

**Tagline:** *Reply before they wonder.*

**Why Echo:**
Sound travels, bounces back, reaches someone. A message sent is an echo waiting to return. It's quiet, poetic, and deeply human — not a productivity tool name, not a corporate name. Just a word that feels like what the app does.

**Logo concept:** A minimal waveform — one soft arc. Not an app icon that screams. One that whispers.

---

## Design System

### Philosophy
Minimal. Human. Weightless. The app should feel like a notebook left on a desk — not a dashboard. Dark mode is the default because conversations happen at night. Light mode exists for mornings.

### Color Tokens

```
--color-bg-dark:        #0A0A0A    /* near black, not pure */
--color-bg-light:       #F9F9F7    /* warm white, not clinical */
--color-surface-dark:   #141414    /* card bg in dark */
--color-surface-light:  #FFFFFF    /* card bg in light */
--color-border-dark:    #1F1F1F    /* subtle separator */
--color-border-light:   #E8E8E4    /* soft border */
--color-text-primary-dark:   #F0F0EE
--color-text-primary-light:  #0A0A0A
--color-text-muted-dark:     #5A5A58
--color-text-muted-light:    #9A9A96
--color-accent:         #0A0A0A    /* button fill in light = black */
--color-accent-dark:    #F0F0EE    /* button fill in dark = white */
--color-accent-text:    #FFFFFF    /* text on black button */
--color-accent-text-dark: #0A0A0A /* text on white button */
--color-pending:        #C8A96E    /* warm amber — the guilt color */
--color-done:           #5A9E7A    /* soft green — relief */
```

### Typography

```
Display / Headings:   "Instrument Serif" — elegant, editorial, warm
Body / UI:            "Inter" — clean, invisible, trustworthy  
Monospace / badges:   "JetBrains Mono" — for timestamps, counts
```

**Type Scale:**
```
--text-xs:    11px / 1.4  (timestamps, labels)
--text-sm:    13px / 1.5  (secondary body)
--text-base:  15px / 1.6  (primary body)
--text-lg:    18px / 1.4  (card names)
--text-xl:    24px / 1.2  (section headers)
--text-2xl:   32px / 1.1  (hero / empty state)
--text-3xl:   48px / 1.0  (display / splash)
```

### Theme Modes
- **Dark** (default) — `#0A0A0A` bg, white text, black-surface cards
- **Light** — `#F9F9F7` bg, near-black text, white cards
- **Auto** — follows system `prefers-color-scheme`
- Toggle lives in Settings — pill switch, no labels, just moon/sun icon

### Spacing System
```
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px
--space-6:  24px
--space-8:  32px
--space-12: 48px
--space-16: 64px
```

### Border Radius
```
--radius-sm:   6px   (inputs)
--radius-md:   12px  (cards)
--radius-lg:   20px  (modals)
--radius-full: 999px (pills, buttons)
```

### Button System
```
Primary:    bg = black (light) / white (dark), text = white / black, radius-full
Secondary:  bg = transparent, border = 1px current color, radius-full
Ghost:      bg = transparent, no border, text = muted
Danger:     bg = transparent, text = #C0392B, on hover bg subtle red
```

---

## Product Requirements Document (PRD)

### Problem
Billions of people have messages they've seen, meant to reply to, and never did. The guilt sits quietly. No app addresses this specific emotional problem with the right tone — existing reminder apps are task-focused, cold, and generic.

### Vision
Echo is a personal, warm app that helps you stay present for the people in your life — by reminding you to reply before someone feels forgotten.

### Target Users
- Age 16–35, mobile-first
- Has WhatsApp, Instagram, iMessage
- Not necessarily "productivity" oriented — just socially active
- Feels mild guilt about unread/unreplied messages

### Core Value Proposition
*"One tap to say — I owe this person a reply. Echo remembers so you don't have to feel bad."*

### Goals
- 0 friction to add a pending reply
- Reminder that feels personal, not robotic
- Marking done feels satisfying (micro-delight)
- Works offline, no account needed for v1

### Non-Goals (v1)
- No AI writing of replies
- No deep WhatsApp/Instagram integration
- No social features
- No subscription

### Success Metrics
- D7 retention > 35%
- Average reminders set per user per week > 4
- "Marked done" rate > 60% (people actually reply)
- App store rating > 4.5

---

## Technical Architecture Document

### Stack

**Frontend (Web PWA — ship fast, reach everyone)**
```
Framework:     Next.js 14 (App Router)
Styling:       Tailwind CSS + CSS Variables for theming
Animation:     Framer Motion (subtle, minimal)
State:         Zustand
Storage:       IndexedDB via Dexie.js (local-first, offline)
Notifications: Web Push API + Service Worker
PWA:           next-pwa
```

**Mobile (Phase 2)**
```
React Native + Expo
Expo Notifications for native push
AsyncStorage → migrate to same Dexie schema
```

**Backend (minimal, optional for v1)**
```
None required for v1 — fully local
v2: Supabase (auth + sync across devices)
```

### Data Schema

```typescript
// Contact
interface Contact {
  id: string           // uuid
  name: string
  platform: 'whatsapp' | 'instagram' | 'imessage' | 'other'
  avatar?: string      // emoji or initials fallback
  createdAt: Date
}

// PendingReply
interface PendingReply {
  id: string
  contactId: string
  note: string         // "about their job interview"
  remindAt: Date
  status: 'pending' | 'done' | 'snoozed'
  createdAt: Date
  doneAt?: Date
}

// Reminder
interface Reminder {
  id: string
  replyId: string
  scheduledAt: Date
  delivered: boolean
}
```

### Architecture Diagram
```
[User Device]
     │
     ├── Next.js PWA (UI layer)
     │        │
     │        ├── Zustand (runtime state)
     │        │
     │        └── Dexie.js ──► IndexedDB (persisted locally)
     │
     └── Service Worker
              │
              └── Web Push API ──► Notification
```

### Offline Strategy
Full offline support. All data lives in IndexedDB. Service worker caches all assets. Push notifications scheduled locally via Service Worker timers.

---

## Security & Access Document

### Data Privacy
- All data stored **locally on device** in IndexedDB
- Zero server calls in v1 — nothing leaves the device
- No analytics, no tracking, no telemetry in v1
- No account required

### Permissions Required
```
Notifications:   Required — for reminders (prompt on first use)
Storage:         Auto — IndexedDB, no prompt needed
Camera/Contacts: NOT requested in v1
```

### Web Push Security
- Push tokens generated client-side
- No VAPID server in v1 (local scheduling only)
- v2: VAPID keys stored in Supabase Edge Function env

### Data Export & Deletion
- Settings → Export Data → JSON download
- Settings → Delete All Data → wipes IndexedDB completely
- GDPR compliant by design (no server = no server data)

### Input Sanitization
- Contact names: max 60 chars, strip HTML
- Notes: max 200 chars, strip HTML
- No rich text, no links, no embeds

---

## Frontend Spec Document

### Screen Map
```
/                →  Home (pending list)
/add             →  Add Reminder (sheet)
/done            →  Done list
/settings        →  Settings (theme, notif, export)
/onboarding      →  First launch (3 screens)
```

### Screen 1 — Home

**Layout:**
```
┌─────────────────────────────┐
│  Echo              ⚙  ＋   │  ← top bar (no shadow)
├─────────────────────────────┤
│  3 pending                  │  ← small muted label
│                             │
│  ┌─────────────────────┐   │
│  │ 🟡  Priya           │   │  ← card
│  │     job interview   │   │
│  │     Today, 6 PM     │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │ 🟡  Rohan           │   │
│  │     birthday plans  │   │
│  │     Tomorrow, 10 AM │   │
│  └─────────────────────┘   │
│                             │
│         [ See Done → ]      │
└─────────────────────────────┘
```

**Card anatomy:**
- Left: amber dot (pending) or green check (done)
- Center: contact name (Instrument Serif, 18px) + note (Inter, 13px muted) + time (JetBrains Mono, 11px muted)
- Right: swipe-right = done, swipe-left = delete
- Tap = expand detail

**Empty state:**
```
      ( echo )

  No pending replies.
  You're all caught up.

  [ + Add one ]
```

### Screen 2 — Add Reminder (Bottom Sheet)

```
┌─────────────────────────────┐
│  ╌╌╌╌╌╌╌ (drag handle)     │
│                             │
│  Who?                       │
│  [ Priya              ▾ ]  │  ← contact picker / type name
│                             │
│  What about?                │
│  [ her job interview    ]  │  ← text input, max 200 chars
│                             │
│  Remind me                  │
│  [ In 2 hours ]  [ 6 PM ] [ Tomorrow ] [ Custom ]
│                             │
│  [ Save Reminder ]          │  ← black pill button
└─────────────────────────────┘
```

### Screen 3 — Settings

```
┌─────────────────────────────┐
│  ← Settings                 │
├─────────────────────────────┤
│  Appearance                 │
│  Theme      [ Auto ●  ]    │  ← pill toggle: Light / Dark / Auto
│                             │
│  Notifications              │
│  Reminders  [ On  ●   ]    │
│                             │
│  Data                       │
│  Export as JSON      →      │
│  Delete everything   →      │
│                             │
│  About                      │
│  Version 1.0.0              │
│  Built with care ♡          │
└─────────────────────────────┘
```

### Micro-interactions
- Card "done" swipe: green wash → card collapses with spring physics
- Add reminder saved: soft haptic + card slides in from bottom
- Notification arrives: subtle pulse on the relevant card
- Empty state: waveform animates slowly (ambient, not distracting)

### Onboarding (3 screens, skippable)

```
Screen 1:
  "Echo"
  Some replies just need
  a little push.
  [ Continue ]

Screen 2:
  Add who you owe.
  Note what it's about.
  Set when to remember.
  [ Continue ]

Screen 3:
  That's it.
  No account. No noise.
  Just you and the people
  who matter.
  [ Let's go ]
```

---

## Feature Ticket List

### Phase 1 — MVP (2 weeks)

```
ECHO-001  Project setup (Next.js + Tailwind + PWA config)
ECHO-002  Design token system (CSS variables, dark/light/auto)
ECHO-003  IndexedDB schema setup via Dexie.js
ECHO-004  Home screen — pending list UI
ECHO-005  Add reminder — bottom sheet UI
ECHO-006  Contact name input with emoji avatar fallback
ECHO-007  Note input (200 char limit)
ECHO-008  Quick time picker (2h, tonight, tomorrow, custom)
ECHO-009  Local push notification scheduling (Service Worker)
ECHO-010  Swipe to mark done (spring animation)
ECHO-011  Swipe to delete (with undo toast)
ECHO-012  Done list screen
ECHO-013  Settings screen — theme toggle
ECHO-014  Settings screen — notification toggle
ECHO-015  Onboarding flow (3 screens, localStorage flag)
ECHO-016  Empty state illustration / animation
ECHO-017  PWA manifest + install prompt
ECHO-018  Offline support verification
```

### Phase 2 — Polish (week 3)

```
ECHO-019  Export data as JSON
ECHO-020  Delete all data with confirmation
ECHO-021  Snooze reminder (+1h, +1 day)
ECHO-022  Overdue indicator (card turns slightly red after time passes)
ECHO-023  Streak counter ("You replied to 5 people this week")
ECHO-024  Haptic feedback (mobile PWA)
ECHO-025  Reduced motion support
ECHO-026  Keyboard navigation (accessibility)
```

### Phase 3 — Growth (month 2)

```
ECHO-027  Supabase auth (optional account for sync)
ECHO-028  Cross-device sync
ECHO-029  React Native app (iOS + Android)
ECHO-030  Widget (iOS home screen — shows pending count)
ECHO-031  Share card ("I finally replied to everyone 🙌")
ECHO-032  Platform tag on contact (WhatsApp / Instagram / iMessage)
```

---

## Monetization (no subscription)

| Method | How |
|--------|-----|
| **"Buy me a coffee"** | One tap in Settings — pay what you feel |
| **One-time unlock** | $1.99 for themes (sepia, midnight blue, warm paper) |
| **Nothing forced** | Core app always free, always full-featured |

The moment someone replies to a friend because Echo reminded them — that's when they'll tip. Emotional payoff drives voluntary payment better than a paywall.

---

*Echo. Built for the replies that matter.*
