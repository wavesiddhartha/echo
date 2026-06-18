# Echo — Complete Implementation Guide

> *Everything you're building, why every piece exists, how to implement it, and how it all connects.*

---

## Table of Contents

1. [What Echo Is — The Core Idea](#1-what-echo-is)
2. [What You Are Building — Full Scope](#2-what-you-are-building)
3. [The Tech Stack — Every Tool and Why](#3-the-tech-stack)
4. [Data Architecture — Schema and Storage](#4-data-architecture)
5. [Phase 1 — PWA Implementation](#5-phase-1-pwa-implementation)
6. [Phase 2 — Polish and Smart Features](#6-phase-2-polish-and-smart-features)
7. [Phase 3 — Native iOS and Android](#7-phase-3-native-ios-and-android)
8. [Platform Integrations — What Is Possible and How](#8-platform-integrations)
9. [Media and File Saving](#9-media-and-file-saving)
10. [Smart Filter and Deduplication](#10-smart-filter-and-deduplication)
11. [Notification System — Full Implementation](#11-notification-system)
12. [Security and Privacy — How Data Stays Safe](#12-security-and-privacy)
13. [Design System — Tokens and Rules](#13-design-system)
14. [Full Feature Ticket List](#14-full-feature-ticket-list)
15. [The Honest Walls — What Cannot Be Done](#15-the-honest-walls)
16. [Monetization](#16-monetization)
17. [Build Order — What to Do First](#17-build-order)

---

## 1. What Echo Is

**Echo is a personal reply reminder app built around one emotional insight:**

> Billions of people have seen a message, meant to reply, and never did. The guilt sits quietly. No existing app addresses this with the right tone.

Echo is not a task manager. It is not a productivity tool. It is the app that sits between "I saw your message" and "I'm sorry I never replied." It reminds you to reply before someone feels forgotten.

### The emotional loop Echo owns

```
You see a message → feel mild guilt → forget → more guilt → never reply → relationship erodes
                                ↑
                          Echo interrupts here
                                ↓
You see a message → Echo saves it → reminds you → you reply → relief → relationship maintained
```

### Why this is a real product gap

- Reminder apps (Todoist, Things, Reminders) are cold and task-flavored. They make replying to your mum feel like a work ticket.
- Messaging apps have no "remind me to reply to this" feature.
- Nobody has built the warm, human, guilt-aware version of this.

### Who it is for

- Age 16–35, mobile-first
- Active on WhatsApp, Instagram, iMessage, X, LinkedIn
- Not necessarily "productivity" oriented — just socially active and occasionally bad at replying
- Feels genuine guilt about messages they have left on read

---

## 2. What You Are Building

### The complete product scope

You are building a cross-platform app with these layers:

| Layer | What it is | When |
|-------|------------|------|
| PWA (web app) | Installable on any device via browser | Phase 1 — ship first |
| iOS native app | Full native with widgets, share sheet, Siri | Phase 3 |
| Android native app | Full native with widgets, share sheet | Phase 3 |
| watchOS companion | Complication and quick-resolve | Phase 3 |
| Browser extension | For LinkedIn and web-based messaging | Phase 3 |

### What the app does — every feature

**Core loop (non-negotiable):**
- Add a pending reply (who + optional note + when to remind)
- Get reminded at the right time
- Mark done — feel relief
- Never see the same pending item twice

**Capture methods (how things get into Echo):**
- Manual add — tap + in the app
- Share sheet — share from any app into Echo
- Notification listener — auto-capture unread messages (with permission)
- Quick-add from lock screen notification
- Siri shortcut — voice capture
- Media save — screenshot, image, video linked to a person

**Smart features:**
- Frequent people row — recent contacts one tap away
- Note chips — pre-written reason labels, no typing needed
- Smart time suggestion — learns when you usually reply
- Escalating overdue warmth — amber glow, soft labels, never red
- Mark done from notification — close the loop without opening the app
- Deduplication — never saves the same person twice
- Auto-filter — ignores bots, marketing, group chats (configurable)
- Weekly summary — "you replied to 6 people this week"
- Media attachments — screenshots and files linked to reminders

---

## 3. The Tech Stack

### Why each tool was chosen

#### PWA Stack (Phase 1)

**Next.js 14 with App Router**
- Why: Fastest path from zero to deployed web app. App Router enables React Server Components for performance. PWA support via `next-pwa`. The entire app ships as a single deployable unit.
- What it does: Handles routing (`/`, `/add`, `/done`, `/settings`, `/onboarding`), server-side rendering for fast first load, and the PWA shell.

**Tailwind CSS + CSS Variables**
- Why: Tailwind handles spacing, layout, and responsive design. CSS Variables handle the theming system (dark/light/auto) without JavaScript.
- What it does: The design tokens (colors, typography, spacing) live as CSS variables that flip when the theme changes. Tailwind classes handle everything else.

**Framer Motion**
- Why: Spring physics animations that feel alive, not robotic. The swipe-to-done gesture, card collapse, and sheet animations all need this.
- What it does: Powers the swipe gestures on cards, the bottom sheet animation, the card entry/exit animations, and the empty state waveform.

**Zustand**
- Why: Lightweight global state without Redux boilerplate. Echo's state is simple — a list of pending items, a list of done items, and some settings.
- What it does: Holds runtime state (current screen, active filters, optimistic UI updates before IndexedDB confirms).

**Dexie.js → IndexedDB**
- Why: IndexedDB is the browser's built-in database. Dexie is a clean wrapper that makes it usable. All data lives on the device — zero server calls in v1.
- What it does: Persists all contacts, pending replies, done items, and usage patterns (for smart time suggestions) to the device's local storage.

**Web Push API + Service Worker**
- Why: Enables push notifications from a PWA. The service worker runs in the background even when the app is closed, schedules reminders, and handles notification actions ("Replied ✓", "Snooze 1h").
- What it does: Registers a service worker that intercepts notification actions and updates the database accordingly.

**next-pwa**
- Why: Handles the PWA manifest, service worker registration, and offline caching automatically.
- What it does: Makes the web app installable on iOS (Add to Home Screen) and Android (Install banner), and caches all assets for offline use.

#### Native Stack (Phase 3)

**React Native + Expo**
- Why: Shared codebase with the PWA logic. Expo provides direct access to native APIs (notifications, widgets, share extensions, contacts) without writing native Objective-C or Swift.
- What it does: Compiles to native iOS and Android apps. Expo SDK handles the platform-specific APIs.

**Expo Notifications**
- Why: Unified notification API for iOS and Android. Handles permissions, scheduling, and notification actions.
- What it does: Replaces the Web Push API from the PWA. Same data model, different delivery mechanism.

**Expo Sharing + Share Extension**
- Why: Enables the iOS Share Extension and Android intent filter — the most important lazy-user feature in the whole app.
- What it does: Registers Echo in the share sheet of every other app on the device.

**WidgetKit (iOS) / App Widgets (Android)**
- Why: Home screen and lock screen widgets showing pending count and top person's name. These are native only — no PWA equivalent.
- What it does: A small widget that updates every time a reminder is added or marked done.

**Supabase (optional, Phase 3)**
- Why: The only server component in the whole app. Provides optional cross-device sync for users who want it. Auth, database, and real-time sync in one.
- What it does: If a user creates an account, their data syncs encrypted across all their devices. Completely optional — the app works without it.

---

## 4. Data Architecture

### Complete database schema

```typescript
// ─────────────────────────────────────────
// CONTACT
// A person you owe a reply to
// ─────────────────────────────────────────
interface Contact {
  id: string                    // uuid — primary key
  name: string                  // "Priya", "Mum", "Rohan"
  platform: Platform            // where you usually message them
  avatar?: string               // emoji character or initials string
  color?: string                // generated accent color for avatar bg
  isImportant: boolean          // always auto-save if true
  addCount: number              // how many times added — for frequent people row
  lastAddedAt: Date             // for sorting frequent people
  createdAt: Date
}

type Platform = 
  | 'whatsapp' 
  | 'instagram' 
  | 'imessage' 
  | 'x' 
  | 'linkedin' 
  | 'telegram'
  | 'email'
  | 'other'

// ─────────────────────────────────────────
// PENDING REPLY
// The core item — one thing you owe someone
// ─────────────────────────────────────────
interface PendingReply {
  id: string                    // uuid
  contactId: string             // foreign key → Contact
  note?: string                 // optional — "her job interview", "the favor"
  noteChip?: NoteChip           // which pre-written chip was used, if any
  remindAt: Date                // when to fire the notification
  status: ReplyStatus
  source: CaptureSource         // how it got into Echo
  attachments: Attachment[]     // screenshots, images, links, voice notes
  snoozeCount: number           // how many times snoozed
  overdueNotifiedAt?: Date      // when the overdue nudge was sent
  createdAt: Date
  doneAt?: Date
  deletedAt?: Date              // soft delete
}

type ReplyStatus = 'pending' | 'done' | 'snoozed' | 'deleted'

type NoteChip = 
  | 'their_big_news'
  | 'checking_in'
  | 'their_birthday'
  | 'the_favor'
  | 'job_thing'
  | 'need_to_apologize'

type CaptureSource =
  | 'manual'          // user tapped + in the app
  | 'share_sheet'     // shared from another app
  | 'notification'    // auto-captured from notification listener
  | 'siri'            // via Siri shortcut
  | 'widget'          // tapped quick-add on widget

// ─────────────────────────────────────────
// ATTACHMENT
// Media linked to a pending reply
// ─────────────────────────────────────────
interface Attachment {
  id: string
  replyId: string
  type: AttachmentType
  fileName: string              // "screenshot_2025-06-16_priya.jpg"
  fileSize: number              // bytes
  mimeType: string
  localPath: string             // path in IndexedDB blob store or filesystem
  sourceApp?: string            // "Instagram", "WhatsApp", "X"
  url?: string                  // if it was a link save
  thumbnail?: string            // base64 thumbnail for preview
  createdAt: Date
}

type AttachmentType = 'screenshot' | 'image' | 'video' | 'link' | 'voice' | 'file'

// ─────────────────────────────────────────
// REMINDER
// The scheduled notification for a reply
// ─────────────────────────────────────────
interface Reminder {
  id: string
  replyId: string
  scheduledAt: Date
  firedAt?: Date
  actionTaken?: 'replied' | 'snoozed' | 'dismissed' | null
  delivered: boolean
}

// ─────────────────────────────────────────
// USAGE PATTERN
// Powers the smart time suggestion feature
// ─────────────────────────────────────────
interface UsagePattern {
  id: string
  eventType: 'reply_done' | 'reminder_set' | 'app_open'
  hourOfDay: number             // 0–23
  dayOfWeek: number             // 0–6 (0 = Sunday)
  createdAt: Date
}

// ─────────────────────────────────────────
// NOTIFICATION CAPTURE LOG
// From the notification listener
// ─────────────────────────────────────────
interface NotificationCapture {
  id: string
  senderName: string            // extracted from notification
  appName: string               // "WhatsApp", "Instagram"
  packageName: string           // "com.whatsapp"
  receivedAt: Date
  action: 'saved' | 'skipped' | 'duplicate'
  skipReason?: string           // why it was skipped
  replyId?: string              // if saved, which reply it created
}

// ─────────────────────────────────────────
// SETTINGS
// User preferences, stored locally
// ─────────────────────────────────────────
interface Settings {
  theme: 'dark' | 'light' | 'auto'
  notificationsEnabled: boolean
  weeklySummaryEnabled: boolean
  notificationListenerEnabled: boolean  // whether to auto-capture from notifications
  importantPeopleIds: string[]          // always auto-save these contacts
  groupChatBehavior: 'ask' | 'always_skip' | 'always_save'
  marketingFilter: boolean              // skip obvious marketing/bot notifications
  smartTimeEnabled: boolean
  reducedMotion: boolean
  hapticFeedback: boolean
  lastExportedAt?: Date
  onboardingCompleted: boolean
  version: string
}
```

### Dexie.js setup

```typescript
// lib/db.ts
import Dexie, { type Table } from 'dexie'

export class EchoDB extends Dexie {
  contacts!: Table<Contact>
  pendingReplies!: Table<PendingReply>
  reminders!: Table<Reminder>
  usagePatterns!: Table<UsagePattern>
  notificationCaptures!: Table<NotificationCapture>
  settings!: Table<Settings>

  constructor() {
    super('EchoDB')
    
    this.version(1).stores({
      contacts: '++id, name, platform, addCount, lastAddedAt, isImportant',
      pendingReplies: '++id, contactId, status, remindAt, createdAt, source',
      reminders: '++id, replyId, scheduledAt, delivered',
      usagePatterns: '++id, eventType, hourOfDay, dayOfWeek',
      notificationCaptures: '++id, senderName, appName, receivedAt',
      settings: '++id'
    })
  }
}

export const db = new EchoDB()
```

### Where data lives — storage layers

| Data type | Storage | Why | Size limit |
|-----------|---------|-----|------------|
| Contacts, replies, settings | IndexedDB (Dexie) | Structured, queryable, offline | ~50MB+ |
| Images, screenshots | IndexedDB Blob store | Same database, no file system permission needed | ~50MB |
| Large videos | File System Access API | IndexedDB has size limits for large blobs | Device storage |
| Usage patterns | IndexedDB | Same DB, simple append | Tiny |
| Service worker cache | Cache API | Offline app shell | ~5MB |
| User preferences | IndexedDB settings table + localStorage fallback | Settings need to survive DB migrations | Tiny |

---

## 5. Phase 1 — PWA Implementation

### Every ticket, what it does, why it exists

---

#### ECHO-001 — Project setup

**What:** Initialize Next.js 14 with App Router, Tailwind CSS, TypeScript, and next-pwa.

**Why:** This is the foundation everything else builds on. Getting this right means zero configuration debt later.

**How:**
```bash
npx create-next-app@latest echo --typescript --tailwind --app --src-dir
cd echo
npm install next-pwa dexie framer-motion zustand
npm install -D @types/node
```

**next.config.js:**
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
})

module.exports = withPWA({
  reactStrictMode: true,
})
```

**public/manifest.json:**
```json
{
  "name": "Echo",
  "short_name": "Echo",
  "description": "Reply before they wonder.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0A0A0A",
  "theme_color": "#0A0A0A",
  "orientation": "portrait",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

---

#### ECHO-002 — Design token system

**What:** All CSS variables for colors, typography, spacing, border radius.

**Why:** Every color and spacing decision in the app references a token. Changing dark mode or adding a new theme only requires updating tokens, not hunting through component files.

**How — globals.css:**
```css
:root {
  /* Colors */
  --color-bg: #F9F9F7;
  --color-surface: #FFFFFF;
  --color-surface2: #F4F4F2;
  --color-border: #E8E8E4;
  --color-border2: #D8D8D4;
  --color-text: #0A0A0A;
  --color-muted: #9A9A96;
  --color-muted2: #C8C8C4;
  --color-pending: #C8A96E;
  --color-pending-soft: rgba(200,169,110,0.1);
  --color-done: #5A9E7A;
  --color-done-soft: rgba(90,158,122,0.1);
  --color-accent: #0A0A0A;
  --color-accent-text: #FFFFFF;
  
  /* Typography */
  --font-serif: 'Instrument Serif', Georgia, serif;
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Spacing */
  --space-1: 4px;   --space-2: 8px;   --space-3: 12px;
  --space-4: 16px;  --space-6: 24px;  --space-8: 32px;
  --space-12: 48px; --space-16: 64px;
  
  /* Radius */
  --radius-sm: 6px;  --radius-md: 12px;
  --radius-lg: 20px; --radius-full: 999px;
}

[data-theme="dark"], .dark {
  --color-bg: #0A0A0A;
  --color-surface: #141414;
  --color-surface2: #1A1A1A;
  --color-border: #1F1F1F;
  --color-border2: #2A2A2A;
  --color-text: #F0F0EE;
  --color-muted: #5A5A58;
  --color-muted2: #3A3A38;
  --color-accent: #F0F0EE;
  --color-accent-text: #0A0A0A;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-bg: #0A0A0A;
    /* ... same dark values ... */
  }
}
```

---

#### ECHO-003 — IndexedDB schema via Dexie.js

**What:** The complete database setup, migrations, and helper functions.

**Why:** All data lives here. The schema defined here is the single source of truth for what Echo stores.

**How:** See the full schema in Section 4. Additional helper functions:

```typescript
// lib/queries.ts

// Get pending replies sorted by urgency
export async function getPendingReplies() {
  const replies = await db.pendingReplies
    .where('status').equals('pending')
    .sortBy('remindAt')
  
  return Promise.all(replies.map(async reply => ({
    ...reply,
    contact: await db.contacts.get(reply.contactId),
    attachments: reply.attachments || []
  })))
}

// Get frequent people (sorted by addCount)
export async function getFrequentContacts(limit = 5) {
  return db.contacts
    .orderBy('addCount')
    .reverse()
    .limit(limit)
    .toArray()
}

// Add usage pattern event (for smart time suggestions)
export async function logUsageEvent(type: UsagePattern['eventType']) {
  const now = new Date()
  await db.usagePatterns.add({
    id: crypto.randomUUID(),
    eventType: type,
    hourOfDay: now.getHours(),
    dayOfWeek: now.getDay(),
    createdAt: now
  })
}

// Calculate smart time suggestion
export async function getSmartTimeSuggestion(): Promise<Date | null> {
  const patterns = await db.usagePatterns
    .where('eventType').equals('reply_done')
    .toArray()
  
  if (patterns.length < 5) return null  // not enough data yet
  
  // Count replies by hour
  const hourCounts: Record<number, number> = {}
  patterns.forEach(p => {
    hourCounts[p.hourOfDay] = (hourCounts[p.hourOfDay] || 0) + 1
  })
  
  // Find the peak hour
  const peakHour = Object.entries(hourCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0]
  
  if (!peakHour) return null
  
  const suggestion = new Date()
  suggestion.setHours(parseInt(peakHour), 0, 0, 0)
  if (suggestion <= new Date()) {
    suggestion.setDate(suggestion.getDate() + 1)
  }
  
  return suggestion
}
```

---

#### ECHO-004 — Home screen

**What:** The main screen showing all pending replies as cards.

**Why:** This is the app. Users open Echo and this is what they see — their pending replies sorted by urgency, with overdue warmth applied.

**Key behaviors:**
- Cards sorted by `remindAt` ascending (most urgent first)
- Overdue state calculated client-side from `remindAt` vs `now`
- Overdue < 24h: amber border glow
- Overdue 24h–72h: amber border + "still waiting..." label
- Overdue > 72h: warmer amber + "3 days now" (or exact count)
- Never turns red — guilt not failure
- Swipe right = mark done (spring animation, green wash)
- Swipe left = delete (with undo toast, 5 second window)
- Tap = expand detail view

```typescript
// components/PendingCard.tsx — overdue calculation
function getOverdueState(remindAt: Date): 'none' | 'mild' | 'medium' | 'strong' {
  const now = new Date()
  const diffHours = (now.getTime() - remindAt.getTime()) / (1000 * 60 * 60)
  
  if (diffHours <= 0) return 'none'
  if (diffHours < 2) return 'none'     // grace period
  if (diffHours < 24) return 'mild'
  if (diffHours < 72) return 'medium'
  return 'strong'
}

function getOverdueLabel(remindAt: Date): string | null {
  const now = new Date()
  const diffHours = (now.getTime() - remindAt.getTime()) / (1000 * 60 * 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffHours < 24) return 'still waiting...'
  if (diffDays === 1) return 'since yesterday'
  return `${diffDays} days now`
}
```

---

#### ECHO-005 to ECHO-008 — Add Reminder sheet

**What:** The bottom sheet UI for adding a new pending reply.

**Why:** This is the most-used flow in the app. Every decision here is about reducing friction.

**Fields and behavior:**

**Frequent people row (ECHO-006 extension):**
- Rendered from `getFrequentContacts(5)` — sorted by `addCount` descending
- Tap one → name field auto-fills, focus moves to note field
- Falls back gracefully if fewer than 2 contacts exist (shows "+ Add someone new")

**Who field:**
- Text input with contact search
- As user types, searches existing contacts by name
- If no match, creates a new contact on save
- On native: optional contacts permission for system autocomplete

**What about field (optional):**
- Text input, max 200 characters
- Placeholder: "what's it about? (optional)"
- Pre-written chips below (tap to fill): "their big news", "checking in", "their birthday", "the favor", "job thing", "need to apologize"
- Chip tap fills input and selects the chip visually

**Remind me — time picker:**
```typescript
function getTimeOptions(smartSuggestion: Date | null) {
  const now = new Date()
  
  const options = [
    {
      label: 'In 2 hours',
      value: new Date(now.getTime() + 2 * 60 * 60 * 1000)
    },
    {
      label: 'Tonight',
      value: setHours(now, 20)  // 8 PM today
    },
    {
      label: 'Tomorrow morning',
      value: setHours(addDays(now, 1), 9)  // 9 AM tomorrow
    },
    {
      label: 'Custom',
      value: null  // opens datetime picker
    }
  ]
  
  // Insert smart suggestion if available
  if (smartSuggestion) {
    const hour = smartSuggestion.getHours()
    const label12 = hour > 12 
      ? `${hour - 12} PM` 
      : hour === 12 ? '12 PM' : `${hour} AM`
    
    options.unshift({
      label: `✦ Your usual (${label12})`,
      value: smartSuggestion,
      isSmartSuggestion: true
    })
  }
  
  return options
}
```

**Save action:**
```typescript
async function saveReminder(data: AddReminderForm) {
  // 1. Find or create contact
  let contact = await db.contacts
    .where('name').equalsIgnoreCase(data.name)
    .first()
  
  if (!contact) {
    const id = crypto.randomUUID()
    await db.contacts.add({
      id,
      name: data.name,
      platform: data.platform || 'other',
      addCount: 1,
      lastAddedAt: new Date(),
      isImportant: false,
      createdAt: new Date()
    })
    contact = await db.contacts.get(id)
  } else {
    // Increment frequency counter
    await db.contacts.update(contact.id, {
      addCount: contact.addCount + 1,
      lastAddedAt: new Date()
    })
  }
  
  // 2. Create pending reply
  const replyId = crypto.randomUUID()
  await db.pendingReplies.add({
    id: replyId,
    contactId: contact!.id,
    note: data.note || undefined,
    noteChip: data.noteChip,
    remindAt: data.remindAt,
    status: 'pending',
    source: 'manual',
    attachments: [],
    snoozeCount: 0,
    createdAt: new Date()
  })
  
  // 3. Schedule notification
  await scheduleNotification(replyId, data.remindAt, contact!.name, data.note)
  
  // 4. Log usage pattern
  await logUsageEvent('reminder_set')
  
  return replyId
}
```

---

#### ECHO-009 — Local push notification scheduling

**What:** The service worker that schedules and fires notifications, including action buttons.

**Why:** Notifications are the core delivery mechanism. Without them Echo is just a list. The "Replied ✓" action button is the most important UX moment in the whole product.

**How — service-worker.ts:**
```typescript
// Schedule a notification
async function scheduleNotification(
  replyId: string, 
  fireAt: Date, 
  contactName: string,
  note?: string
) {
  const registration = await navigator.serviceWorker.ready
  
  const delayMs = fireAt.getTime() - Date.now()
  if (delayMs < 0) return  // already in the past
  
  // Store the scheduled notification in IndexedDB
  await db.reminders.add({
    id: crypto.randomUUID(),
    replyId,
    scheduledAt: fireAt,
    delivered: false
  })
  
  // Use setTimeout in service worker for scheduling
  // (Web Push requires a server in v2 — local scheduling for v1)
  setTimeout(async () => {
    const reply = await db.pendingReplies.get(replyId)
    if (!reply || reply.status !== 'pending') return
    
    await registration.showNotification('Echo', {
      body: `Reply to ${contactName}${note ? ` — ${note}` : ''}`,
      icon: '/icon-192.png',
      badge: '/badge-96.png',
      tag: `reply-${replyId}`,  // prevents duplicate notifications
      data: { replyId, contactName, note },
      actions: [
        { action: 'replied', title: 'Replied ✓' },
        { action: 'snooze', title: 'Snooze 1h' }
      ],
      requireInteraction: false,
      silent: false
    })
    
    await db.reminders
      .where('replyId').equals(replyId)
      .modify({ delivered: true, firedAt: new Date() })
      
  }, delayMs)
}

// Handle notification actions in service worker
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const { replyId } = event.notification.data
  
  if (event.action === 'replied') {
    event.waitUntil(markReplyDone(replyId))
    return
  }
  
  if (event.action === 'snooze') {
    event.waitUntil(snoozeReply(replyId, 60))  // 60 minutes
    return
  }
  
  // Default tap — open app to this reply
  event.waitUntil(
    clients.openWindow(`/?highlight=${replyId}`)
  )
})

async function markReplyDone(replyId: string) {
  await db.pendingReplies.update(replyId, {
    status: 'done',
    doneAt: new Date()
  })
  await logUsageEvent('reply_done')
}

async function snoozeReply(replyId: string, minutes: number) {
  const newRemindAt = new Date(Date.now() + minutes * 60 * 1000)
  const reply = await db.pendingReplies.get(replyId)
  
  await db.pendingReplies.update(replyId, {
    remindAt: newRemindAt,
    snoozeCount: (reply?.snoozeCount || 0) + 1
  })
  
  const contact = await db.contacts.get(reply?.contactId || '')
  if (contact) {
    await scheduleNotification(replyId, newRemindAt, contact.name, reply?.note)
  }
}
```

---

#### ECHO-010 to ECHO-011 — Swipe gestures

**What:** Swipe right to mark done, swipe left to delete.

**Why:** The done swipe is the most emotionally important interaction in Echo. It needs to feel like relief — a green wash, a spring collapse, a sense of closure.

**How — using Framer Motion:**
```typescript
// components/PendingCard.tsx
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'

function PendingCard({ reply, onDone, onDelete }) {
  const x = useMotionValue(0)
  const background = useTransform(
    x,
    [-150, 0, 150],
    ['rgba(192,57,43,0.15)', 'transparent', 'rgba(90,158,122,0.15)']
  )
  
  function handleDragEnd(_, info) {
    if (info.offset.x > 100) {
      // Swipe right — mark done
      animate(x, 400, { 
        type: 'spring', 
        stiffness: 300, 
        damping: 30,
        onComplete: () => onDone(reply.id)
      })
    } else if (info.offset.x < -100) {
      // Swipe left — delete (show undo)
      animate(x, -400, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        onComplete: () => onDelete(reply.id)
      })
    } else {
      // Snap back
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 })
    }
  }
  
  return (
    <motion.div
      style={{ x, background }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      layout
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
    >
      {/* card content */}
    </motion.div>
  )
}
```

---

#### ECHO-015 — Onboarding flow

**What:** Three screens shown on first launch. Skippable. Sets the emotional tone.

**Why:** First impressions define how people feel about an app. The onboarding isn't a feature tour — it's an emotional orientation.

**Screen content:**
- Screen 1: "Some replies just need a little push." — the problem
- Screen 2: "Add who you owe. Note what it's about." — the solution
- Screen 3: "No account. No noise. Just you and the people who matter." — the promise

**Implementation:** Check `localStorage.getItem('onboarding_complete')` on app load. If null, show onboarding. On "Let's go" tap, set the flag and navigate to home.

---

#### ECHO-016 — Empty state

**What:** What the home screen looks like when there are zero pending replies.

**Why:** The empty state is a positive moment — it means you replied to everyone. It should feel like relief, not an empty to-do list.

**Copy:**
```
( echo )

No pending replies.
You're all caught up.

[ + Add one ]
```

**Animation:** The waveform SVG breathes slowly using a CSS `@keyframes` opacity pulse. Ambient, not distracting. Respects `prefers-reduced-motion`.

---

## 6. Phase 2 — Polish and Smart Features

#### ECHO-019 — Export data as JSON

**What:** Settings → Export as JSON → downloads a complete snapshot of all data.

**Why:** GDPR compliance by design. Users own their data. If Echo ever shuts down, no data is lost.

```typescript
async function exportData() {
  const [contacts, replies, settings] = await Promise.all([
    db.contacts.toArray(),
    db.pendingReplies.toArray(),
    db.settings.toArray()
  ])
  
  const exportData = {
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    contacts,
    pendingReplies: replies,
    settings: settings[0]
  }
  
  const blob = new Blob(
    [JSON.stringify(exportData, null, 2)], 
    { type: 'application/json' }
  )
  
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `echo-export-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}
```

---

#### ECHO-021 — Snooze reminder

**What:** From the notification or from within the app — snooze a reminder by +1h or +1 day.

**Why:** Sometimes the reminder fires at the wrong moment. Snooze is the "not now but I haven't forgotten" action.

**Options:** +1 hour, +1 day, +1 week, custom time.

---

#### ECHO-022 — Overdue indicator

**What:** The escalating warmth system for overdue cards.

**Why:** Cards that are days overdue shouldn't look the same as a fresh reminder. But they also shouldn't feel like failures. The warmth is a nudge, not a judgment.

**States:**
- `none` — within the reminder window, normal card
- `mild` (2–24h overdue) — amber border glow: `box-shadow: 0 0 0 1px rgba(200,169,110,0.3)`
- `medium` (24–72h) — amber border + label "still waiting..."
- `strong` (72h+) — warmer amber border + "3 days now" / "5 days now"

**Color never turns red.** Red = error/failure. These are not failures. They are life.

---

#### ECHO-023 — Streak counter

**What:** "You replied to 5 people this week" — shown in the weekly summary card.

**Why:** Positive reinforcement without gamification pressure. No streak anxiety. Just a warm acknowledgment.

**Implementation:** Count `pendingReplies` where `status === 'done'` and `doneAt` is within the current week (Monday to Sunday).

---

#### ECHO-025 — Reduced motion support

**What:** All animations respect `prefers-reduced-motion: reduce`.

**Why:** Accessibility. Some users experience motion sickness or vestibular disorders. All animations wrap in this media query check.

```typescript
// hooks/useReducedMotion.ts
export function useReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// In Framer Motion components:
const reducedMotion = useReducedMotion()
const transition = reducedMotion 
  ? { duration: 0 } 
  : { type: 'spring', stiffness: 400, damping: 35 }
```

---

## 7. Phase 3 — Native iOS and Android

### Why native is needed at all

The PWA covers 80% of use cases perfectly. But these five features require native:

1. **Share sheet extension** — iOS Share Extension / Android intent filter
2. **Home screen widget** — iOS WidgetKit / Android App Widget
3. **Lock screen widget** — iOS 16+ lock screen customization
4. **Watch complication** — watchOS
5. **Notification listener** — reading other apps' notifications requires native permission

### React Native + Expo setup

```bash
npx create-expo-app echo-native --template
cd echo-native
npx expo install expo-notifications expo-sharing expo-file-system expo-contacts
npx expo install @react-native-async-storage/async-storage
```

### Shared business logic

The key architectural decision: all business logic lives in a shared `packages/core` that both the Next.js PWA and the React Native app import. Only UI components and platform APIs differ.

```
echo/
├── packages/
│   └── core/           ← shared logic
│       ├── db/         ← Dexie (web) / SQLite (native)
│       ├── queries/    ← same queries for both platforms
│       ├── filters/    ← smart filter and dedup logic
│       └── utils/      ← time suggestions, formatting
├── apps/
│   ├── web/            ← Next.js PWA
│   └── native/         ← React Native + Expo
```

### iOS Share Extension

**What it does:** Registers Echo in the iOS share sheet. When you share anything from any app (message thread, screenshot, video, link), Echo appears as an option. Tapping it creates a pending reply.

**Why it's the most important lazy feature:** Instead of switching apps, opening Echo, tapping +, typing a name, and picking a time — you just tap Share → Echo → done. That is the friction difference between an app people use and an app people abandon.

**How it works:**
1. Create an App Extension target in Xcode (`Share Extension`)
2. The extension runs a lightweight UI — just the contact picker and time picker
3. It reads the share payload (contact name from a message, URL from a link, image from a screenshot)
4. It writes to the shared App Group container (which the main app reads from)
5. The main app syncs on next launch

**Expo implementation:**
```javascript
// expo-sharing provides the share sheet for sending
// The share extension itself requires native Xcode configuration
// Use expo-modules or a custom native module

// In the Share Extension (Swift):
// override func didSelectPost() {
//   let appGroupId = "group.com.yourname.echo"
//   let userDefaults = UserDefaults(suiteName: appGroupId)
//   
//   // Extract contact name from share payload
//   // Write to shared container
//   // Main app reads on next launch
// }
```

### iOS WidgetKit

**What it does:** Small, medium, and lock screen widgets showing pending count and/or top pending person's name.

**Small widget:** Pending count number + "pending replies" label
**Medium widget:** Count + top 2 person names
**Lock screen widget:** Just the count, very small

**Why:** The guilt of having pending replies needs to be visible passively. A number on your home screen is ambient pressure — gentle, constant, motivating.

**Implementation:** Requires SwiftUI Widget Extension. The extension reads from the App Group shared container that the main app writes to.

### Android Intent Filter

The Android equivalent of the iOS share extension. Register Echo as a handler for `ACTION_SEND` intent with MIME types `text/plain`, `image/*`, and `video/*`.

```xml
<!-- AndroidManifest.xml -->
<activity android:name=".ShareActivity">
  <intent-filter>
    <action android:name="android.intent.action.SEND" />
    <category android:name="android.intent.category.DEFAULT" />
    <data android:mimeType="text/plain" />
  </intent-filter>
  <intent-filter>
    <action android:name="android.intent.action.SEND" />
    <category android:name="android.intent.category.DEFAULT" />
    <data android:mimeType="image/*" />
  </intent-filter>
</activity>
```

### Siri Shortcut

**What it does:** "Hey Siri, remind me to reply to Priya" → Echo adds a pending reply instantly.

**How:**
```swift
// Define the Siri intent
import Intents

class AddReplyIntentHandler: NSObject, AddReplyIntentHandling {
  func handle(intent: AddReplyIntent, completion: @escaping (AddReplyIntentResponse) -> Void) {
    let contactName = intent.contactName ?? "Unknown"
    let note = intent.note
    
    // Write to shared container
    // Schedule notification
    
    completion(AddReplyIntentResponse(code: .success, userActivity: nil))
  }
}
```

---

## 8. Platform Integrations

### What is actually possible and how

The fundamental constraint: **Instagram, WhatsApp, and iMessage do not expose message content to third-party apps.** This is privacy by design. Echo works with metadata only — who sent you something, from which app, at what time.

---

### iMessage integration

**What Echo can do:**
- Share sheet: share any iMessage conversation → Echo (manual, full control)
- Notification listener: iOS lets apps request notification access. When iMessage delivers a notification, Echo can read the sender name and create a pending reply automatically.
- Siri: "Remind me to reply to [name]" triggers the Siri integration.

**What Echo cannot do:**
- Read message content (Apple prohibits this)
- Access the Messages app database directly

**Notification metadata Echo extracts:**
- Sender name or phone number
- Which app sent it (`com.apple.MobileSMS`)
- Timestamp

**Implementation:** iOS `UNUserNotificationCenter` with notification categories. On native, request `UNAuthorizationOptions` including `.notificationCenter` access.

---

### WhatsApp integration

**What Echo can do:**
- Share sheet: WhatsApp has a native share button on every conversation — tap it → Echo
- Notification listener: WhatsApp notifications include the sender's name (e.g., "Priya: 2 messages"). Echo extracts the name.

**What Echo cannot do:**
- Read message content (end-to-end encrypted, WhatsApp prohibits third-party access)
- Access WhatsApp's API for personal chats (WhatsApp Business API only works for businesses)

**Notification format:** `"Priya Sharma: 2 messages"` → Echo extracts `"Priya Sharma"`

```typescript
// Notification name extraction
function extractSenderFromNotification(
  notificationTitle: string, 
  appPackage: string
): string | null {
  
  if (appPackage === 'com.whatsapp') {
    // WhatsApp format: "Priya: 2 messages" or "Priya Sharma"
    const match = notificationTitle.match(/^(.+?)(?::|\s\d+ message)/i)
    return match?.[1]?.trim() || notificationTitle
  }
  
  if (appPackage === 'com.instagram.android') {
    // Instagram format: "priya_23 sent you a message"
    const match = notificationTitle.match(/^(.+?) sent you/i)
    return match?.[1]?.trim() || null
  }
  
  return notificationTitle  // fallback — use full title
}
```

---

### Instagram integration

**What Echo can do:**
- Share sheet: tap the share icon on any DM → Echo saves it
- Notification listener: Instagram notifications include username ("priya_23 sent you a message")
- Manual screenshot save: screenshot a conversation → share to Echo → linked to a contact

**What Echo cannot do:**
- Instagram Graph API does not allow personal DM access
- Message content is not readable

---

### X (Twitter) integration

**What Echo can do:**
- Share sheet from X app
- Notification listener for DMs

**Honest assessment:** X's API has become unreliable and expensive. Don't build any API dependency on X. Share sheet + notification listener is sufficient.

---

### LinkedIn integration

**What Echo can do:**
- Share sheet from LinkedIn app
- Notification listener for messages
- Browser extension (desktop) — detect unread messages on linkedin.com and offer to add to Echo

**Browser extension approach:**
```javascript
// content-script.js — runs on linkedin.com
const observer = new MutationObserver(() => {
  const unreadBadge = document.querySelector('[data-test-messaging-nav-item] .notification-badge')
  if (unreadBadge && parseInt(unreadBadge.textContent) > 0) {
    // Show Echo overlay button: "Save to Echo"
  }
})
observer.observe(document.body, { childList: true, subtree: true })
```

---

## 9. Media and File Saving

### What can be saved to Echo

| Type | How | Storage |
|------|-----|---------|
| Screenshot | Share sheet → Echo | IndexedDB blob |
| Photo/Image | Share sheet → Echo | IndexedDB blob |
| Video | Share sheet → Echo | File System (large files) |
| Link/URL | Share sheet or manual paste | IndexedDB (URL string + auto-fetched title) |
| Voice note | Share sheet from WhatsApp/Telegram | IndexedDB blob |
| Text snippet | Share sheet → Echo | IndexedDB (text string) |

### File naming convention

Files are named automatically on save:
```
{type}_{YYYY-MM-DD}_{contactName}_{timestamp}.{ext}

Examples:
screenshot_2025-06-16_priya_1718534400.jpg
video_2025-06-16_rohan_1718534401.mp4
link_2025-06-16_mum_1718534402.json
```

### Storing files in IndexedDB

```typescript
async function saveAttachment(
  file: File | Blob,
  replyId: string,
  sourceApp: string
): Promise<Attachment> {
  const id = crypto.randomUUID()
  const contactName = await getContactNameForReply(replyId)
  const ext = file.type.split('/')[1] || 'bin'
  const fileName = `${getAttachmentType(file.type)}_${formatDate(new Date())}_${contactName}_${Date.now()}.${ext}`
  
  // Generate thumbnail for images
  let thumbnail: string | undefined
  if (file.type.startsWith('image/')) {
    thumbnail = await generateThumbnail(file, 80)  // 80px thumbnail as base64
  }
  
  const attachment: Attachment = {
    id,
    replyId,
    type: getAttachmentType(file.type),
    fileName,
    fileSize: file.size,
    mimeType: file.type,
    localPath: `attachment:${id}`,  // reference to IndexedDB blob
    sourceApp,
    thumbnail,
    createdAt: new Date()
  }
  
  // Store the actual file data in a separate blob store
  await db.transaction('rw', db.attachmentBlobs, async () => {
    await db.attachmentBlobs.put({ id, data: file })
  })
  
  // Update the reply with the attachment
  await db.pendingReplies
    .where('id').equals(replyId)
    .modify(reply => {
      reply.attachments.push(attachment)
    })
  
  return attachment
}
```

### Link save with auto-title fetch

```typescript
async function saveLinkAttachment(url: string, replyId: string): Promise<Attachment> {
  let title = url
  
  try {
    // Fetch the page title (via a CORS proxy or server function in v2)
    const response = await fetch(`/api/fetch-title?url=${encodeURIComponent(url)}`)
    const data = await response.json()
    title = data.title || url
  } catch {
    // Fallback to URL if fetch fails
  }
  
  const linkData = JSON.stringify({ url, title, savedAt: new Date().toISOString() })
  const blob = new Blob([linkData], { type: 'application/json' })
  
  return saveAttachment(blob, replyId, 'manual')
}
```

---

## 10. Smart Filter and Deduplication

### The complete filtering logic

When the notification listener captures a notification, it runs through this decision tree:

```typescript
async function shouldSaveNotification(
  notification: IncomingNotification
): Promise<{ save: boolean; reason: string }> {
  const settings = await getSettings()
  
  // 1. Is this from a messaging app we care about?
  const messagingApps = [
    'com.apple.MobileSMS',
    'com.whatsapp',
    'com.instagram.android', 
    'com.twitter.android',
    'com.linkedin.android',
    'org.telegram.messenger',
    'com.facebook.orca'  // Messenger
  ]
  
  if (!messagingApps.includes(notification.packageName)) {
    return { save: false, reason: 'not_a_messaging_app' }
  }
  
  // 2. Is the sender name present?
  const senderName = extractSenderFromNotification(
    notification.title, 
    notification.packageName
  )
  
  if (!senderName || senderName.length < 2) {
    return { save: false, reason: 'no_sender_name' }
  }
  
  // 3. Is it a group chat? (WhatsApp group format: "Group Name: Sender: message")
  const isGroupChat = isGroupChatNotification(notification, notification.packageName)
  
  if (isGroupChat) {
    if (settings.groupChatBehavior === 'always_skip') {
      return { save: false, reason: 'group_chat_skipped' }
    }
    if (settings.groupChatBehavior === 'ask') {
      return { save: false, reason: 'group_chat_ask_user' }  // triggers a prompt
    }
  }
  
  // 4. Is it a marketing/bot notification?
  const marketingSignals = [
    /\b(offer|deal|discount|sale|promo|code|expires|limited time)\b/i,
    /\b(verify|otp|one.time|password|code is)\b/i,
    /\b(update|install|download|version)\b/i,
    /^\d{4,8}$/,  // OTP codes
  ]
  
  if (settings.marketingFilter) {
    const isMarketing = marketingSignals.some(pattern => 
      pattern.test(notification.title) || pattern.test(notification.body || '')
    )
    if (isMarketing) {
      return { save: false, reason: 'marketing_filtered' }
    }
  }
  
  // 5. Is this person already pending in Echo?
  const existingPending = await db.pendingReplies
    .where('status').equals('pending')
    .toArray()
  
  for (const reply of existingPending) {
    const contact = await db.contacts.get(reply.contactId)
    if (contact && namesMatch(contact.name, senderName)) {
      return { save: false, reason: 'already_pending' }
    }
  }
  
  // 6. Is this person in the "important" list? Always save.
  const importantContact = await db.contacts
    .where('isImportant').equals(1)
    .filter(c => namesMatch(c.name, senderName))
    .first()
  
  if (importantContact) {
    return { save: true, reason: 'important_contact' }
  }
  
  // 7. Default — save it
  return { save: true, reason: 'new_message' }
}

// Fuzzy name matching — "Priya" matches "Priya Sharma"
function namesMatch(storedName: string, incomingName: string): boolean {
  const normalize = (s: string) => s.toLowerCase().trim()
  const a = normalize(storedName)
  const b = normalize(incomingName)
  
  return a === b || a.startsWith(b) || b.startsWith(a)
}
```

### Deduplication for manual adds

```typescript
async function checkForDuplicate(contactName: string): Promise<PendingReply | null> {
  const pendingReplies = await db.pendingReplies
    .where('status').equals('pending')
    .toArray()
  
  for (const reply of pendingReplies) {
    const contact = await db.contacts.get(reply.contactId)
    if (contact && namesMatch(contact.name, contactName)) {
      return reply  // return the existing one
    }
  }
  
  return null
}

// In the Add sheet — before saving:
const duplicate = await checkForDuplicate(nameInput)
if (duplicate) {
  // Show: "You already have Priya pending — reply to her first, or update the reminder time?"
  // Options: [ View existing ] [ Add anyway ] [ Update time ]
}
```

---

## 11. Notification System — Full Implementation

### The two-phase notification approach

**Phase 1 (PWA — local only):** Service worker uses `setTimeout` to schedule notifications locally. No server required. Works offline. Limitation: browser may 
<truncated 16339 bytes>

NOTE: The output was truncated because it was too long. Use a more targeted query or a smaller range to get the information you need.