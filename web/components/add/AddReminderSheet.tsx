"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { v4 as uuidv4 } from "uuid";
import { useStore } from "@/store/useStore";
import {
  addReply,
  db,
  type PendingReply,
  type Platform,
  type Contact,
  searchContacts,
  getRecentContacts,
  getSmartTimeSuggestion,
} from "@/lib/db";
import { scheduleNotification } from "@/hooks/useNotifications";
import { PlatformIcon, PLATFORM_META } from "@/components/ui/PlatformIcon";

// ─── Time quick options ───────────────────────────────────────────────────

interface TimeOption {
  label: string;
  getDate: () => Date;
}

const STATIC_TIME_OPTIONS: TimeOption[] = [
  {
    label: "In 2 hours",
    getDate: () => {
      const d = new Date();
      d.setHours(d.getHours() + 2);
      return d;
    },
  },
  {
    label: "Tonight",
    getDate: () => {
      const d = new Date();
      d.setHours(21, 0, 0, 0);
      if (d <= new Date()) d.setDate(d.getDate() + 1);
      return d;
    },
  },
  {
    label: "Tomorrow",
    getDate: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      return d;
    },
  },
];

const CUSTOM_TIME_OPTION: TimeOption = {
  label: "Custom",
  getDate: () => new Date(),
};

// ─── Avatar helper ────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function Avatar({
  name,
  avatar,
  size = 40,
}: {
  name: string;
  avatar?: string;
  size?: number;
}) {
  const isEmoji = avatar && /\p{Emoji}/u.test(avatar) && avatar.length <= 2;

  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--color-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: isEmoji ? size * 0.55 + "px" : size * 0.38 + "px",
        fontFamily: isEmoji ? "system-ui" : "var(--font-sans)",
        fontWeight: isEmoji ? 400 : 600,
        color: isEmoji ? "inherit" : "var(--color-text-muted)",
        letterSpacing: "-0.5px",
        userSelect: "none",
      }}
    >
      {isEmoji ? avatar : getInitials(name)}
    </div>
  );
}

// ─── Add Reminder Sheet ───────────────────────────────────────────────────

export function AddReminderSheet() {
  const closeAddSheet = useStore((s) => s.closeAddSheet);
  const addToast = useStore((s) => s.addToast);

  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [platform, setPlatform] = useState<Platform>("whatsapp");
  const [selectedTime, setSelectedTime] = useState<number>(0); // index in current options list
  const [customDate, setCustomDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; time?: string }>({});

  // Scroll time states
  const [scrollHour, setScrollHour] = useState(12);
  const [scrollMinute, setScrollMinute] = useState(0);
  const [scrollAmpm, setScrollAmpm] = useState<"AM" | "PM">("PM");

  // Dynamic state for suggestions and history
  const [frequentPeople, setFrequentPeople] = useState<Contact[]>([]);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<Contact[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [smartTimeOption, setSmartTimeOption] = useState<{ label: string; getDate: () => Date } | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);

  // Load frequent contacts and smart time suggestion on mount, set defaults for custom time
  useEffect(() => {
    getRecentContacts().then(setFrequentPeople);
    getSmartTimeSuggestion().then(setSmartTimeOption);

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    setCustomDate(`${yyyy}-${mm}-${dd}`);

    let h = now.getHours();
    const am = h < 12 ? "AM" : "PM";
    h = h % 12;
    h = h ? h : 12;
    setScrollHour(h);
    setScrollMinute(now.getMinutes());
    setScrollAmpm(am);
  }, []);

  // Compute dynamic time options
  const timeOptions: TimeOption[] = [
    ...STATIC_TIME_OPTIONS,
    ...(smartTimeOption ? [{ label: smartTimeOption.label, getDate: smartTimeOption.getDate }] : []),
    CUSTOM_TIME_OPTION,
  ];

  // Custom is always the last index
  const isCustom = selectedTime === timeOptions.length - 1;

  // Note chips list
  const NOTE_CHIPS = [
    "their big news",
    "checking in",
    "their birthday",
    "the favor",
    "job thing",
    "need to apologize",
  ];

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = "Who do you owe a reply?";
    if (isCustom && !customDate) errs.time = "Pick a date";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function getRemindAt(): Date {
    if (isCustom && customDate) {
      let h24 = scrollHour;
      if (scrollAmpm === "PM" && scrollHour < 12) h24 += 12;
      if (scrollAmpm === "AM" && scrollHour === 12) h24 = 0;
      
      const [year, month, day] = customDate.split("-").map(Number);
      return new Date(year, month - 1, day, h24, scrollMinute, 0);
    }
    return timeOptions[selectedTime].getDate();
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);

    const remindAt = getRemindAt();
    const contactNameTrimmed = name.trim();

    // Create or update contact record locally for autocomplete / recent row
    let contactId = uuidv4();
    try {
      const existing = await db.contacts.where("name").equalsIgnoreCase(contactNameTrimmed).first();
      if (existing) {
        contactId = existing.id;
        await db.contacts.update(contactId, {
          platform,
          createdAt: new Date(), // update timestamp so it comes first in recents
        });
      } else {
        await db.contacts.add({
          id: contactId,
          name: contactNameTrimmed.slice(0, 60),
          platform,
          createdAt: new Date(),
        });
      }
    } catch (e) {
      console.error("Failed to save contact history", e);
    }

    const reply: PendingReply = {
      id: uuidv4(),
      contactId,
      contactName: contactNameTrimmed.slice(0, 60),
      note: note.trim().slice(0, 200),
      platform,
      remindAt,
      status: "pending" as const,
      createdAt: new Date(),
    };

    await addReply(reply);
    await scheduleNotification(reply);

    if ("vibrate" in navigator) navigator.vibrate([10, 5, 10]);
    addToast({ message: `Reminder set for ${reply.contactName}` });
    closeAddSheet();
    setSaving(false);
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeAddSheet}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          zIndex: 100,
        }}
        aria-hidden="true"
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 350, damping: 38 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.8 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 140) {
            closeAddSheet();
          }
        }}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          width: "100%",
          maxWidth: "none",
          background: "var(--color-surface)",
          borderTop: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
          padding:
            "var(--space-2) var(--space-6) calc(var(--space-12) + var(--safe-bottom))", // increased bottom padding to clear bottom tab bar
          zIndex: 101,
          maxHeight: "92%",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Add reply reminder"
      >
        {/* Header bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "var(--space-2)",
          }}
        >
          <span
            style={{
              fontSize: "var(--text-lg)",
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              color: "var(--color-text-primary)",
            }}
          >
            echo
          </span>
          <button
            onClick={closeAddSheet}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-text-muted)",
              cursor: "pointer",
              fontSize: "20px",
              lineHeight: 1,
              padding: "4px",
            }}
            aria-label="Close sheet"
          >
            ×
          </button>
        </div>

        {/* Serif title */}
        <h2
          style={{
            fontSize: "22px",
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            color: "var(--color-text-primary)",
            marginBottom: "var(--space-5)",
            fontWeight: 300,
            lineHeight: 1.2,
          }}
        >
          who do you owe?
        </h2>

        {/* ── Frequent Contacts (Only shown if 2+ in history) ────────────────── */}
        {frequentPeople.length >= 2 && (
          <div style={{ marginBottom: "var(--space-5)" }}>
            <span
              style={{
                display: "block",
                fontSize: "var(--text-xs)",
                fontFamily: "var(--font-mono)",
                color: "var(--color-text-muted)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "var(--space-3)",
              }}
            >
              recent people
            </span>
            <div
              style={{
                display: "flex",
                gap: "var(--space-3)",
                overflowX: "auto",
                paddingBottom: "var(--space-2)",
                scrollbarWidth: "none",
              }}
            >
              {frequentPeople.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setName(p.name);
                    setPlatform(p.platform);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    flexShrink: 0,
                    outline: "none",
                  }}
                >
                  <Avatar name={p.name} size={36} />
                  <span
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--color-text-primary)",
                      fontFamily: "var(--font-sans)",
                      maxWidth: 60,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p.name.split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Who? ────────────────────────────────────── */}
        <fieldset style={{ border: "none", marginBottom: "var(--space-5)", position: "relative" }}>
          <label
            htmlFor="contact-name"
            style={{
              display: "block",
              fontSize: "var(--text-xs)",
              fontFamily: "var(--font-mono)",
              color: "var(--color-text-muted)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "var(--space-2)",
            }}
          >
            OR TYPE A NAME
          </label>
          <div style={{ position: "relative" }}>
            <input
              ref={nameRef}
              id="contact-name"
              className="input"
              type="text"
              placeholder="someone's name..."
              value={name}
              onChange={async (e) => {
                const val = e.target.value.slice(0, 60);
                setName(val);
                if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
                
                if (val.trim()) {
                  const suggestions = await searchContacts(val);
                  setAutocompleteSuggestions(suggestions);
                  setShowAutocomplete(true);
                } else {
                  setAutocompleteSuggestions([]);
                  setShowAutocomplete(false);
                }
              }}
              onFocus={async () => {
                if (name.trim()) {
                  const suggestions = await searchContacts(name);
                  setAutocompleteSuggestions(suggestions);
                  setShowAutocomplete(true);
                }
              }}
              onBlur={() => {
                // Delay hiding dropdown so clicks register
                setTimeout(() => setShowAutocomplete(false), 200);
              }}
              autoFocus
              autoComplete="off"
              autoCapitalize="words"
              maxLength={60}
            />

            {/* Autocomplete Dropdown */}
            <AnimatePresence>
              {showAutocomplete && autocompleteSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-sm)",
                    marginTop: 4,
                    boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
                    zIndex: 10,
                    maxHeight: 180,
                    overflowY: "auto",
                  }}
                >
                  {autocompleteSuggestions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={() => {
                        setName(c.name);
                        setPlatform(c.platform);
                        setShowAutocomplete(false);
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-3)",
                        padding: "var(--space-2) var(--space-4)",
                        background: "none",
                        border: "none",
                        textAlign: "left",
                        cursor: "pointer",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      <Avatar name={c.name} size={28} />
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)", flex: 1 }}>
                        {c.name}
                      </span>
                      <PlatformIcon platform={c.platform} size={16} />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {errors.name && (
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-danger)", marginTop: "var(--space-1)" }}>
              {errors.name}
            </p>
          )}

          {/* Platform picker — real logos */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: "var(--space-2)",
              marginTop: "var(--space-3)",
            }}
          >
            {PLATFORM_META.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPlatform(p.value)}
                aria-pressed={platform === p.value}
                aria-label={p.label}
                title={p.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  padding: "var(--space-2) var(--space-1)",
                  borderRadius: "var(--radius-md)",
                  border: `2px solid ${
                    platform === p.value ? p.color : "transparent"
                  }`,
                  background:
                    platform === p.value
                      ? `${p.color}15`
                      : "var(--color-surface)",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                  outline: "none",
                }}
              >
                <PlatformIcon platform={p.value} size={30} />
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: "var(--font-sans)",
                    color:
                      platform === p.value
                        ? p.color
                        : "var(--color-text-muted)",
                    fontWeight: platform === p.value ? 600 : 400,
                    letterSpacing: "0.01em",
                    lineHeight: 1.2,
                    textAlign: "center",
                  }}
                >
                  {p.label.split(" /")[0]}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* ── What about? (Optional note field + short chips) ──────────────── */}
        <fieldset style={{ border: "none", marginBottom: "var(--space-5)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "var(--space-2)",
            }}
          >
            <label
              htmlFor="reply-note"
              style={{
                fontSize: "var(--text-xs)",
                fontFamily: "var(--font-mono)",
                color: "var(--color-text-muted)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              WHAT'S IT ABOUT? (OPTIONAL)
            </label>
            <span
              style={{
                fontSize: "var(--text-xs)",
                fontFamily: "var(--font-mono)",
                color: note.length > 180 ? "var(--color-danger)" : "var(--color-text-muted)",
              }}
            >
              {note.length}/200
            </span>
          </div>
          <textarea
            id="reply-note"
            className="input"
            style={{
              minHeight: 72,
              resize: "none",
              fontFamily: "var(--font-sans)",
            }}
            placeholder="leave blank or pick below"
            value={note}
            onChange={(e) => {
              setNote(e.target.value.slice(0, 200));
            }}
            maxLength={200}
          />

          {/* Common note chips */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--space-2)",
              marginTop: "var(--space-2)",
            }}
          >
            {NOTE_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setNote(chip)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "var(--radius-full)",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--color-border)",
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-muted)",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--color-text-primary)";
                  e.currentTarget.style.borderColor = "var(--color-text-muted)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--color-text-muted)";
                  e.currentTarget.style.borderColor = "var(--color-border)";
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        </fieldset>

        {/* ── Remind me ────────────────────────────────── */}
        <fieldset style={{ border: "none", marginBottom: "var(--space-6)" }}>
          <label
            style={{
              display: "block",
              fontSize: "var(--text-xs)",
              fontFamily: "var(--font-mono)",
              color: "var(--color-text-muted)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "var(--space-2)",
            }}
          >
            REMIND ME
          </label>

          <div
            style={{
              display: "flex",
              gap: "var(--space-2)",
              flexWrap: "wrap",
            }}
          >
            {timeOptions.map((opt, idx) => {
              const isUsual = opt.label.includes("usual");
              const isSelected = selectedTime === idx;

              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setSelectedTime(idx)}
                  aria-pressed={isSelected}
                  style={{
                    padding: "var(--space-2) var(--space-3)",
                    borderRadius: "var(--radius-full)",
                    border: isUsual
                      ? `1px solid var(--color-pending)`
                      : `1px solid ${isSelected ? "var(--color-text-primary)" : "var(--color-border)"}`,
                    background: isSelected
                      ? isUsual
                        ? "var(--color-pending)"
                        : "var(--color-text-primary)"
                      : "transparent",
                    color: isSelected
                      ? "var(--color-bg)"
                      : isUsual
                      ? "var(--color-pending)"
                      : "var(--color-text-muted)",
                    fontSize: "var(--text-sm)",
                    fontFamily: "var(--font-sans)",
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  {isUsual ? `+ ${opt.label}` : opt.label}
                </button>
              );
            })}
          </div>

          {/* Custom date/time inputs */}
          {isCustom && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              style={{ marginTop: "var(--space-3)", display: "flex", flexDirection: "column", gap: "var(--space-3)", overflow: "hidden" }}
            >
              <input
                type="date"
                className="input"
                value={customDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setCustomDate(e.target.value)}
                aria-label="Custom reminder date"
              />

              <div
                style={{
                  display: "flex",
                  gap: "var(--space-1)",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255,255,255,0.01)",
                  border: "1px dashed var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-3) 0",
                }}
              >
                {/* Hours Column */}
                <TimeScrollColumn
                  value={scrollHour}
                  onChange={setScrollHour}
                  options={Array.from({ length: 12 }, (_, i) => i + 1)}
                  label="Hour"
                />

                <span
                  style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    color: "var(--color-text-muted)",
                    margin: "18px var(--space-1) 0",
                  }}
                >
                  :
                </span>

                {/* Minutes Column */}
                <TimeScrollColumn
                  value={scrollMinute}
                  onChange={setScrollMinute}
                  options={Array.from({ length: 60 }, (_, i) => i)}
                  format={(v) => String(v).padStart(2, "0")}
                  label="Min"
                />

                <span
                  style={{
                    width: "var(--space-3)",
                  }}
                />

                {/* AM/PM Column */}
                <TimeScrollColumn
                  value={scrollAmpm}
                  onChange={setScrollAmpm}
                  options={["AM", "PM"]}
                  label="AM/PM"
                />
              </div>
            </motion.div>
          )}
          {errors.time && (
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-danger)", marginTop: "var(--space-1)" }}>
              {errors.time}
            </p>
          )}
        </fieldset>

        {/* ── Save button ───────────────────────────────── */}
        <motion.button
          className="btn btn-primary btn-full"
          style={{ fontSize: "var(--text-base)", padding: "var(--space-4)" }}
          onClick={handleSave}
          disabled={saving}
          whileTap={{ scale: 0.97 }}
          id="save-reminder-btn"
          aria-label="Save reminder"
        >
          {saving ? "Saving…" : "Save Reminder"}
        </motion.button>

        <button
          className="btn btn-ghost btn-full"
          style={{ marginTop: "var(--space-2)" }}
          onClick={closeAddSheet}
          id="cancel-add-btn"
        >
          Cancel
        </button>
      </motion.div>
    </>
  );
}

// ─── Scrolling Column selector ─────────────────────────────────────────────

function TimeScrollColumn<T extends string | number>({
  value,
  onChange,
  options,
  format = (v) => String(v),
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: T[];
  format?: (v: T) => string;
  label: string;
}) {
  const activeIndex = options.indexOf(value);

  const handlePrev = () => {
    const prevIndex = (activeIndex - 1 + options.length) % options.length;
    onChange(options[prevIndex]);
  };

  const handleNext = () => {
    const nextIndex = (activeIndex + 1) % options.length;
    onChange(options[nextIndex]);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: 65,
        userSelect: "none",
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontFamily: "var(--font-mono)",
          color: "var(--color-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 4,
        }}
      >
        {label}
      </span>

      {/* Up button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handlePrev();
        }}
        style={{
          background: "none",
          border: "none",
          color: "var(--color-text-muted)",
          cursor: "pointer",
          fontSize: 16,
          padding: "4px 0",
          outline: "none",
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        ▲
      </button>

      {/* Value Container */}
      <div
        onWheel={(e) => {
          e.preventDefault();
          if (e.deltaY < 0) {
            handlePrev();
          } else {
            handleNext();
          }
        }}
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-sm)",
          width: "100%",
          height: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "var(--text-lg)",
          fontFamily: "var(--font-mono)",
          color: "var(--color-text-primary)",
          fontWeight: 600,
          cursor: "ns-resize",
        }}
        title="Scroll or click arrows to change"
      >
        {format(value)}
      </div>

      {/* Down button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleNext();
        }}
        style={{
          background: "none",
          border: "none",
          color: "var(--color-text-muted)",
          cursor: "pointer",
          fontSize: 16,
          padding: "4px 0",
          outline: "none",
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        ▼
      </button>
    </div>
  );
}
