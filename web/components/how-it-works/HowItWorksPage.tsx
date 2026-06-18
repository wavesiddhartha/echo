"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────

type TabId = "journey" | "data" | "notifications" | "ui" | "viral" | "build";

const TABS: { id: TabId; label: string }[] = [
  { id: "journey", label: "User journey" },
  { id: "data", label: "Data & storage" },
  { id: "notifications", label: "Notifications" },
  { id: "ui", label: "UI logic" },
  { id: "viral", label: "Viral loop" },
  { id: "build", label: "Build order" },
];

// ─── Sub-components ───────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 10,
        fontFamily: "var(--font-mono)",
        color: "var(--color-text-muted)",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        marginBottom: "var(--space-4)",
        fontWeight: 500,
      }}
    >
      {children}
    </p>
  );
}

function NumberBadge({ n }: { n: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: "var(--text-xs)",
        fontFamily: "var(--font-mono)",
        color: "var(--color-text-muted)",
        fontWeight: 500,
      }}
    >
      {n}
    </div>
  );
}

function IconBadge({ children }: { children: React.ReactNode }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: 13,
      }}
    >
      {children}
    </div>
  );
}

function StepRow({
  n,
  title,
  body,
  icon,
}: {
  n?: number;
  icon?: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "var(--space-4)",
        paddingBottom: "var(--space-5)",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
        {n !== undefined ? <NumberBadge n={n} /> : <IconBadge>{icon}</IconBadge>}
        <div style={{ flex: 1, width: 1, background: "var(--color-border)", minHeight: 16, margin: "4px 0" }} />
      </div>
      <div style={{ flex: 1, paddingTop: 4, paddingBottom: "var(--space-2)" }}>
        <p
          style={{
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            marginBottom: "var(--space-1)",
            fontFamily: "var(--font-sans)",
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-text-muted)",
            lineHeight: 1.65,
          }}
        >
          {body}
        </p>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  body,
  accent,
}: {
  title: string;
  body: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        background: accent ? "rgba(200,169,110,0.06)" : "var(--color-surface)",
        border: `1px solid ${accent ? "rgba(200,169,110,0.2)" : "var(--color-border)"}`,
        borderRadius: "var(--radius-md)",
        padding: "var(--space-4)",
        marginBottom: "var(--space-4)",
      }}
    >
      <p
        style={{
          fontSize: "var(--text-sm)",
          fontWeight: 600,
          color: "var(--color-text-primary)",
          marginBottom: "var(--space-2)",
        }}
      >
        {title}
      </p>
      <p
        style={{
          fontSize: "var(--text-sm)",
          color: "var(--color-text-muted)",
          lineHeight: 1.65,
        }}
      >
        {body}
      </p>
    </div>
  );
}

function TwoColCards({
  left,
  right,
}: {
  left: { title: string; body: string };
  right: { title: string; body: string };
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
      {[left, right].map((card) => (
        <div
          key={card.title}
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-4)",
          }}
        >
          <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>
            {card.title}
          </p>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
            {card.body}
          </p>
        </div>
      ))}
    </div>
  );
}

function FlowPill({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "var(--space-1) var(--space-3)",
        borderRadius: "var(--radius-full)",
        background: accent ? "var(--color-accent)" : "var(--color-border)",
        color: accent ? "var(--color-accent-text)" : "var(--color-text-muted)",
        fontSize: "var(--text-xs)",
        fontFamily: "var(--font-sans)",
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function Arrow() {
  return (
    <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", flexShrink: 0 }}>
      →
    </span>
  );
}

// ─── Tab content ──────────────────────────────────────────────────────────

function UserJourneyTab() {
  return (
    <div>
      <SectionLabel>What happens step by step</SectionLabel>

      <StepRow
        n={1}
        title="A message arrives — you read it, life happens"
        body="WhatsApp, Instagram, iMessage — doesn't matter. You see it. You mean to reply. Something else takes your attention. Three days pass. The guilt sits quietly."
      />
      <StepRow
        n={2}
        title="You open Echo and tap +"
        body="Takes 10 seconds. You type the person's name, one line about what it's about, and pick when you want to be reminded. That's the entire add flow — three fields, no account, no setup."
      />
      <StepRow
        n={3}
        title="Echo stores it locally on your device"
        body="The reminder is saved directly in your phone's browser storage (IndexedDB). Nothing goes to any server. No account. Nothing leaves your device in v1."
      />
      <StepRow
        n={4}
        title="A Service Worker runs silently in the background"
        body="A small background script (Service Worker) watches the clock. It knows your reminder is set for 6 PM. At 6 PM it fires a notification — even if Echo isn't open."
      />
      <StepRow
        n={5}
        title="You get one quiet notification"
        body={`"Time to reply to Priya — her job interview results." No badge spam. No follow-up guilt notifications. Just one nudge, at the time you asked for.`}
      />
      <StepRow
        n={6}
        title="You reply on WhatsApp / wherever"
        body="Echo doesn't send the reply for you. It doesn't integrate with WhatsApp. It just reminded you. You go reply yourself — that's the whole point. Real human reply."
      />
      <StepRow
        n={7}
        title="You come back to Echo and swipe done"
        body="Swipe the card right. It glides to the Done list with a soft green wash. The guilt is gone. The card lives in Done as a record of people you stayed present for."
      />

      {/* Emotional arc */}
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          padding: "var(--space-4)",
          marginTop: "var(--space-2)",
        }}
      >
        <p
          style={{
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            marginBottom: "var(--space-3)",
          }}
        >
          The emotional arc
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "var(--space-2)",
            marginBottom: "var(--space-3)",
          }}
        >
          {[
            { label: "Guilt (forgot)", accent: false },
            { label: "→", isArrow: true },
            { label: "Relief (Echo reminded)", accent: false },
            { label: "→", isArrow: true },
            { label: "Connection (you replied)", accent: false },
            { label: "→", isArrow: true },
            { label: "Satisfaction (marked done)", accent: true },
          ].map((item, i) =>
            "isArrow" in item ? (
              <Arrow key={i} />
            ) : (
              <FlowPill key={i} label={item.label} accent={item.accent} />
            )
          )}
        </div>
        <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
          That emotional arc — from guilt to satisfaction — is why people keep using it. It&apos;s not productivity. It&apos;s a feeling.
        </p>
      </div>
    </div>
  );
}

function DataStorageTab() {
  return (
    <div>
      <SectionLabel>Where your data lives and how</SectionLabel>

      <InfoCard
        accent
        title="Local-first by design"
        body="All your data stays on your device. No server. No account. No cloud. This isn't a limitation — it's a feature. People trust apps more when their personal relationships aren't stored somewhere else."
      />

      <SectionLabel>Database structure (IndexedDB via Dexie.js)</SectionLabel>

      <div
        style={{
          background: "#0D0D0D",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          padding: "var(--space-4)",
          marginBottom: "var(--space-6)",
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-xs)",
          lineHeight: 1.8,
          color: "var(--color-text-muted)",
          overflowX: "auto",
        }}
      >
        <span style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>Table: contacts</span>
        {"  "}id → unique ID (auto){"  "}name → &quot;Priya&quot;{"  "}platform → &quot;whatsapp&quot; | &quot;instagram&quot; | &quot;other&quot;{"  "}avatar → emoji or initials{"  "}createdAt → timestamp{"\n\n"}
        <span style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>Table: replies</span>
        {"  "}id → unique ID (auto){"  "}contactId → links to contacts table{"  "}note → &quot;her job interview results&quot;{"  "}remindAt → Date (when to notify){"  "}status → &quot;pending&quot; | &quot;done&quot; | &quot;snoozed&quot;{"  "}createdAt → timestamp{"  "}doneAt → timestamp (when replied){"\n\n"}
        <span style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>Table: reminders</span>
        {"  "}id → unique ID{"  "}replyId → links to replies table{"  "}scheduledAt → Date{"  "}delivered → true | false
      </div>

      <SectionLabel>How data flows</SectionLabel>

      <StepRow
        icon="+"
        title="User adds a reminder"
        body="Zustand (runtime state) receives the form data. Dexie.js writes it to IndexedDB. The home list re-renders from Zustand instantly."
      />
      <StepRow
        icon="🔔"
        title="Service Worker reads reminders"
        body="On app load, SW syncs with IndexedDB and schedules push events for each pending reminder's remindAt time."
      />
      <StepRow
        icon="✓"
        title="User marks done"
        body='Status field updates to "done", doneAt timestamp written. Card moves from pending list to done list. Reminder entry marked delivered.'
      />

      <TwoColCards
        left={{
          title: "What's stored",
          body: "Names, notes, reminder times, done timestamps. That's it. No messages, no contacts sync, no platform access.",
        }}
        right={{
          title: "What's never stored",
          body: "Your actual messages. WhatsApp conversations. Instagram DMs. Echo never reads those. Ever.",
        }}
      />
    </div>
  );
}

function NotificationsTab() {
  return (
    <div>
      <SectionLabel>How reminders actually reach you</SectionLabel>

      <InfoCard
        accent
        title="Web Push API + Service Worker"
        body="Echo is a PWA (Progressive Web App). The browser gives it a Service Worker — a background script that runs even when the app tab is closed. This script watches the scheduled reminder time and fires a notification exactly when you asked."
      />

      <SectionLabel>Notification flow</SectionLabel>

      <StepRow
        n={1}
        title="User sets reminder for 6 PM"
        body='App stores remindAt: "2024-01-15T18:00:00" in IndexedDB and registers a scheduled event with the Service Worker.'
      />
      <StepRow
        n={2}
        title="App can be closed entirely"
        body="Service Worker keeps running in the background. It's a browser-level process, not an app-level one. Closing Echo doesn't stop it."
      />
      <StepRow
        n={3}
        title="At 6 PM, SW fires the notification"
        body='Browser shows: "Time to reply to Priya — her job interview results." This appears in the system notification tray, just like any app.'
      />
      <StepRow
        n={4}
        title="Tap notification → opens Echo"
        body="Deep links directly to that reminder card. User swipes right to mark done after they've replied. Reminder marked delivered in the database."
      />

      <TwoColCards
        left={{
          title: "Permission prompt",
          body: 'Browser asks once: "Allow Echo to send notifications?" User taps Allow. That\'s the only setup needed.',
        }}
        right={{
          title: "No spam policy",
          body: 'One notification per reminder. No follow-ups. No "you still haven\'t replied" messages. One nudge, you decide what to do.',
        }}
      />

      <InfoCard
        title="Snooze (v2 feature)"
        body="Long-press notification → snooze options: +1 hour, +1 day, tomorrow morning. Reschedules the Service Worker event. Reminder status updates to 'snoozed' in IndexedDB."
      />
    </div>
  );
}

function UILogicTab() {
  return (
    <div>
      <SectionLabel>How the interface thinks and behaves</SectionLabel>

      <div style={{ marginBottom: "var(--space-6)" }}>
        <p
          style={{
            fontSize: 10,
            fontFamily: "var(--font-mono)",
            color: "var(--color-text-muted)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "var(--space-3)",
          }}
        >
          State machine — a reminder card
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap", marginBottom: "var(--space-3)" }}>
          <span
            style={{
              padding: "var(--space-1) var(--space-3)",
              borderRadius: "var(--radius-full)",
              background: "rgba(200,169,110,0.15)",
              border: "1px solid rgba(200,169,110,0.4)",
              color: "var(--color-pending)",
              fontSize: "var(--text-xs)",
              fontFamily: "var(--font-mono)",
            }}
          >
            pending
          </span>
          <Arrow />
          <span
            style={{
              padding: "var(--space-1) var(--space-3)",
              borderRadius: "var(--radius-full)",
              background: "rgba(100,120,200,0.1)",
              border: "1px solid rgba(100,120,200,0.3)",
              color: "#8899ee",
              fontSize: "var(--text-xs)",
              fontFamily: "var(--font-mono)",
            }}
          >
            snoozed
          </span>
          <Arrow />
          <span
            style={{
              padding: "var(--space-1) var(--space-3)",
              borderRadius: "var(--radius-full)",
              background: "rgba(90,158,122,0.15)",
              border: "1px solid rgba(90,158,122,0.4)",
              color: "var(--color-done)",
              fontSize: "var(--text-xs)",
              fontFamily: "var(--font-mono)",
            }}
          >
            done
          </span>
        </div>
        <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
          Or: pending → done directly (swipe right). Or: pending → deleted (swipe left + undo toast).
        </p>
      </div>

      <SectionLabel>Gesture system</SectionLabel>

      {[
        {
          icon: "→",
          title: "Swipe right → Done",
          body: "Green wash animation. Card collapses with spring physics (Motion). Moves to Done list. Haptic feedback on mobile.",
        },
        {
          icon: "←",
          title: "Swipe left → Delete",
          body: 'Red wash. Card collapses. Toast appears: "Removed. Undo?" 4 second window. Undo restores it. After 4s it\'s deleted from IndexedDB permanently.',
        },
        {
          icon: "👆",
          title: "Tap → Expand detail",
          body: "Card expands in place to show full note, time, platform, and action buttons (Snooze / Done / Delete).",
        },
      ].map((item) => (
        <div
          key={item.title}
          style={{
            display: "flex",
            gap: "var(--space-4)",
            marginBottom: "var(--space-4)",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: 12,
              fontFamily: "var(--font-mono)",
              color: "var(--color-text-muted)",
            }}
          >
            {item.icon}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}>
              {item.title}
            </p>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", lineHeight: 1.65 }}>
              {item.body}
            </p>
          </div>
        </div>
      ))}

      <SectionLabel>Theme system</SectionLabel>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-2)", marginBottom: "var(--space-6)" }}>
        {[
          {
            name: "Light mode",
            desc: "#F9F9F7 bg. Black buttons with white text. Warm white surfaces.",
          },
          {
            name: "Dark mode",
            desc: "#0A0A0A bg. White buttons with black text. Near-black card surfaces.",
          },
          {
            name: "Auto",
            desc: "Follows system prefers-color-scheme. Switches instantly on system change.",
          },
        ].map((t) => (
          <div
            key={t.name}
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-3)",
            }}
          >
            <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "var(--space-1)" }}>
              {t.name}
            </p>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
              {t.desc}
            </p>
          </div>
        ))}
      </div>

      <SectionLabel>Color meaning</SectionLabel>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {[
          {
            dot: "var(--color-pending)",
            dotBg: "rgba(200,169,110,0.15)",
            label: "Amber dot",
            meaning: "Pending — the guilt color. Warm, present, urgent but not alarming.",
          },
          {
            dot: "var(--color-done)",
            dotBg: "rgba(90,158,122,0.15)",
            label: "Green dot",
            meaning: "Done — relief. Soft, not celebratory. Quiet satisfaction.",
          },
          {
            dot: "var(--color-danger)",
            dotBg: "rgba(192,57,43,0.12)",
            label: "Red wash",
            meaning: "Delete gesture. Appears only on swipe, never permanent in the UI.",
          },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <span
              style={{
                padding: "2px 10px",
                borderRadius: "var(--radius-full)",
                background: item.dotBg,
                border: `1px solid ${item.dot}44`,
                color: item.dot,
                fontSize: "var(--text-xs)",
                fontFamily: "var(--font-mono)",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {item.label}
            </span>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
              {item.meaning}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ViralLoopTab() {
  return (
    <div>
      <SectionLabel>Why Echo grows without spending money</SectionLabel>

      {/* Core loop card */}
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          padding: "var(--space-5)",
          marginBottom: "var(--space-6)",
        }}
      >
        <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "var(--space-4)" }}>
          The core loop
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--space-2)" }}>
          {[
            { label: "You forget to reply" },
            { arrow: true },
            { label: "Echo reminds you" },
            { arrow: true },
            { label: "You reply to Priya" },
            { arrow: true },
            { label: 'Priya asks "how did you remember?"' },
            { arrow: true },
            { label: "You say Echo" },
            { arrow: true },
            { label: "Priya downloads it" },
          ].map((item, i) =>
            "arrow" in item ? (
              <Arrow key={i} />
            ) : (
              <FlowPill key={i} label={item.label!} />
            )
          )}
        </div>
      </div>

      <SectionLabel>Why this loop is powerful</SectionLabel>

      {[
        {
          icon: "♡",
          title: "It's emotional, not functional",
          body: 'Nobody shares "I use this great reminder app." People share "this app made me a better friend." That\'s the kind of story that spreads on its own.',
        },
        {
          icon: "👥",
          title: "Both sides of the conversation benefit",
          body: "You feel less guilty. Priya feels remembered. Both have a reason to want the app. Most viral products only benefit one side.",
        },
        {
          icon: "🌍",
          title: "Universal problem, no language barrier",
          body: 'Forgetting to reply happens in Nepal, India, Brazil, Germany — everywhere. The app name "Echo" works across cultures. No localization needed to go global.',
        },
        {
          icon: "📈",
          title: "Network grows with usage",
          body: "The more people reply to others using Echo, the more those others hear about it. Every active user is a passive advertiser to their social circle.",
        },
      ].map((item) => (
        <div
          key={item.title}
          style={{
            display: "flex",
            gap: "var(--space-4)",
            marginBottom: "var(--space-4)",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: 13,
            }}
          >
            {item.icon}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}>
              {item.title}
            </p>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", lineHeight: 1.65 }}>
              {item.body}
            </p>
          </div>
        </div>
      ))}

      <SectionLabel>Target metrics</SectionLabel>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
        {[
          { value: "35%", label: "D7 retention" },
          { value: "4+", label: "reminders/week/user" },
          { value: "60%", label: "mark done rate" },
          { value: "4.5★", label: "app store target" },
        ].map((m) => (
          <div
            key={m.label}
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-4)",
            }}
          >
            <p
              style={{
                fontSize: "var(--text-2xl)",
                fontFamily: "var(--font-mono)",
                fontWeight: 300,
                color: "var(--color-text-primary)",
                lineHeight: 1,
                marginBottom: "var(--space-1)",
              }}
            >
              {m.value}
            </p>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
              {m.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function BuildOrderTab() {
  const weeks = [
    {
      week: "Week 1 — Core that works",
      days: [
        { day: "D1", title: "Project setup", body: "Next.js 16 + Tailwind + PWA config (serwist). Deploy to Vercel. Get it on your phone as an installed app." },
        { day: "D2", title: "Design tokens", body: "CSS variables for dark/light/auto. Black pill buttons. Instrument Serif + Inter. Test both themes." },
        { day: "D3", title: "IndexedDB schema", body: "Set up Dexie.js. Create contacts + replies + reminders tables. Write + read test data." },
        { day: "D4", title: "Home screen", body: "List of pending cards. Amber dot. Name + note + time. Empty state. + button wired up." },
        { day: "D5", title: "Add reminder sheet", body: "Bottom sheet. Name input. Note input (200 char). Quick time pills. Save writes to IndexedDB. Card appears instantly." },
        { day: "D6", title: "Notifications", body: "Request permission. Register Service Worker. Schedule push at remindAt time. Test it fires correctly." },
      ],
    },
    {
      week: "Week 2 — Polish that feels alive",
      days: [
        { day: "D7",  title: "Swipe gestures", body: "Motion drag. Swipe right = done (green wash + spring collapse). Swipe left = delete + undo toast." },
        { day: "D8",  title: "Done list screen", body: "Separate route /done. Shows all replied cards in chronological order. \"X people felt heard this week\" counter." },
        { day: "D9",  title: "Settings screen", body: "Theme toggle (Light / Dark / Auto). Notifications on/off. Export JSON. Delete all with confirmation dialog." },
        { day: "D10", title: "Onboarding", body: "3 screens on first launch (localStorage flag). Skip option. Sets notification permission on screen 3." },
        { day: "D11", title: "Ship v1", body: "PWA manifest finalized. Icons. Install prompt. Post on Product Hunt + Twitter. Start collecting feedback." },
      ],
    },
  ];

  const tools = [
    { icon: "▲", label: "Next.js" },
    { icon: "◈", label: "Tailwind" },
    { icon: "⬡", label: "Dexie.js" },
    { icon: "◎", label: "Framer Motion" },
    { icon: "◑", label: "Zustand" },
    { icon: "▣", label: "Vercel" },
  ];

  return (
    <div>
      <SectionLabel>Exactly what to build and in what order</SectionLabel>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {weeks.map((week) => (
          <div
            key={week.week}
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "var(--space-3) var(--space-4)",
                borderBottom: "1px solid var(--color-border)",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}>
                {week.week}
              </p>
            </div>
            <div>
              {week.days.map((day, i) => (
                <div
                  key={day.day}
                  style={{
                    display: "flex",
                    gap: "var(--space-4)",
                    padding: "var(--space-3) var(--space-4)",
                    borderBottom: i < week.days.length - 1 ? "1px solid var(--color-border)" : "none",
                  }}
                >
                  <span style={{ fontSize: "var(--text-xs)", fontFamily: "var(--font-mono)", color: "var(--color-text-muted)", minWidth: 28, paddingTop: 2, flexShrink: 0 }}>
                    {day.day}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 2 }}>
                      {day.title}
                    </p>
                    <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                      {day.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "var(--space-4)" }}>
          <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "var(--space-3)" }}>
            Tools you need
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
            {tools.map((t) => (
              <span
                key={t.label}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "2px 8px", borderRadius: "var(--radius-full)",
                  background: "var(--color-bg)", border: "1px solid var(--color-border)",
                  fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontFamily: "var(--font-sans)",
                }}
              >
                <span style={{ fontSize: 10 }}>{t.icon}</span>
                {t.label}
              </span>
            ))}
          </div>
        </div>

        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "var(--space-4)" }}>
          <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>
            You already know all of this
          </p>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
            Next.js, Tailwind, deploying to Vercel — you&apos;ve done all of this before. Echo is a 2-week build, not a 2-month one.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Tab content map ──────────────────────────────────────────────────────

const TAB_CONTENT: Record<TabId, React.ReactNode> = {
  journey: <UserJourneyTab />,
  data: <DataStorageTab />,
  notifications: <NotificationsTab />,
  ui: <UILogicTab />,
  viral: <ViralLoopTab />,
  build: <BuildOrderTab />,
};

// ─── Main page ────────────────────────────────────────────────────────────

export function HowItWorksPage() {
  const [activeTab, setActiveTab] = useState<TabId>("journey");

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--color-bg)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div
        style={{
          maxWidth: 680,
          margin: "0 auto",
          padding: "0 var(--space-4)",
        }}
      >
        {/* Top bar */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "var(--space-6) 0 var(--space-4)",
            position: "sticky",
            top: 0,
            background: "var(--color-bg)",
            zIndex: 10,
          }}
        >
          <Link
            href="/"
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-text-muted)",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
            }}
            id="how-it-works-back-btn"
          >
            ← Echo
          </Link>

          <div
            style={{
              background: "var(--color-accent)",
              color: "var(--color-accent-text)",
              borderRadius: "var(--radius-full)",
              padding: "var(--space-2) var(--space-4)",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
            }}
          >
            how it works
          </div>
        </header>

        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ padding: "var(--space-6) 0 var(--space-4)" }}
        >
          <p
            style={{
              fontSize: "var(--text-lg)",
              fontFamily: "var(--font-serif)",
              color: "var(--color-text-primary)",
              lineHeight: 1.5,
            }}
          >
            Let me build you a deep, visual walkthrough of exactly how Echo works under the hood — every layer.
          </p>
        </motion.div>

        {/* Tab bar */}
        <div
          style={{
            display: "flex",
            gap: "var(--space-2)",
            overflowX: "auto",
            paddingBottom: "var(--space-1)",
            marginBottom: "var(--space-6)",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          role="tablist"
          aria-label="How it works sections"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "var(--space-2) var(--space-4)",
                borderRadius: "var(--radius-full)",
                border: "1px solid var(--color-border)",
                background: activeTab === tab.id ? "var(--color-accent)" : "transparent",
                color: activeTab === tab.id ? "var(--color-accent-text)" : "var(--color-text-muted)",
                fontSize: "var(--text-sm)",
                fontFamily: "var(--font-sans)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all var(--transition-fast)",
                flexShrink: 0,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            style={{ paddingBottom: "var(--space-16)" }}
          >
            {TAB_CONTENT[activeTab]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
