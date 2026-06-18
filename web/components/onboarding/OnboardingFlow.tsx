"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";

const SLIDES = [
  {
    id: 1,
    eyebrow: "1 of 3",
    heading: "Some replies just need\na little push.",
    body: "You've seen the message. You meant to reply. Life got in the way. Echo remembers so you don't have to feel bad.",
    cta: "Continue",
  },
  {
    id: 2,
    eyebrow: "2 of 3",
    heading: "Add who you owe.",
    body: "Note what it's about. Set when to remember. Echo will keep track so you don't have to carry the mental weight.",
    cta: "Continue",
  },
  {
    id: 3,
    eyebrow: "3 of 3",
    heading: "That's it.",
    body: "No accounts. No noise. Just you and the people who matter. Set a gentle nudge and show up for them.",
    cta: "Let's go",
  },
];

export function OnboardingFlow() {
  const [current, setCurrent] = useState(0);
  const router = useRouter();

  function handleNext() {
    if (current < SLIDES.length - 1) {
      setCurrent(current + 1);
    } else {
      handleFinish();
    }
  }

  function handleFinish() {
    localStorage.setItem("echo-onboarded", "true");
    // Seed demo data if database is empty
    import("@/lib/db").then(({ seedDemoData }) => {
      seedDemoData().catch(console.error);
    });
    router.replace("/");
  }

  const slide = SLIDES[current];

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "var(--color-bg)",
        padding: "var(--space-8) var(--space-6) var(--space-12)",
        maxWidth: 480,
        margin: "0 auto",
        justifyContent: "space-between",
      }}
    >
      {/* Top section: Eyebrow label center aligned */}
      <div style={{ textAlign: "center", paddingTop: "var(--space-4)" }}>
        <span
          style={{
            fontSize: "var(--text-xs)",
            fontFamily: "var(--font-mono)",
            color: "var(--color-text-muted)",
            letterSpacing: "0.08em",
            opacity: 0.8,
          }}
        >
          {slide.eyebrow}
        </span>
      </div>

      {/* Slide content: Center-aligned */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              width: "100%",
            }}
          >
            {/* Curvy wave decoration matching Screenshot 5 */}
            <div style={{ marginBottom: "var(--space-8)", display: "flex", justifyContent: "center" }}>
              <svg
                width="48"
                height="12"
                viewBox="0 0 48 12"
                fill="none"
                stroke="var(--color-text-muted)"
                strokeWidth="1.5"
                strokeLinecap="round"
                style={{ opacity: 0.8 }}
              >
                <path d="M2 6C6 2 10 2 14 6C18 10 22 10 26 6C30 2 34 2 38 6C42 10 46 10 48 8" />
              </svg>
            </div>

            <h1
              style={{
                fontSize: "26px",
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                color: "var(--color-text-primary)",
                lineHeight: 1.25,
                marginBottom: "var(--space-4)",
                whiteSpace: "pre-line",
                fontWeight: "normal",
              }}
            >
              {slide.heading}
            </h1>

            {slide.body && (
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-muted)",
                  lineHeight: 1.6,
                  maxWidth: "280px",
                  whiteSpace: "pre-line",
                }}
              >
                {slide.body}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom section: Dots, CTA and Centered Skip link */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Progress dots */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            marginBottom: "var(--space-8)",
            justifyContent: "center",
          }}
          aria-label={`Step ${current + 1} of ${SLIDES.length}`}
        >
          {SLIDES.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                background: i === current ? "var(--color-text-primary)" : "var(--color-border)",
              }}
              transition={{ duration: 0.2 }}
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
              }}
              aria-hidden="true"
            />
          ))}
        </div>

        <motion.button
          className="btn btn-primary"
          style={{
            padding: "var(--space-3) var(--space-8)",
            fontSize: "var(--text-sm)",
            width: "fit-content",
            minWidth: "120px",
            borderRadius: "var(--radius-full)",
            cursor: "pointer",
            outline: "none",
            border: "none",
            background: "var(--color-text-primary)",
            color: "var(--color-bg)",
          }}
          onClick={handleNext}
          whileTap={{ scale: 0.96 }}
          id={`onboarding-cta-${current}`}
          aria-label={slide.cta}
        >
          {slide.cta}
        </motion.button>

        {/* Skip link below the button */}
        <button
          className="btn btn-ghost"
          onClick={handleFinish}
          style={{
            fontSize: "var(--text-sm)",
            marginTop: "var(--space-4)",
            color: "var(--color-text-muted)",
            background: "none",
            border: "none",
            cursor: "pointer",
            textTransform: "lowercase",
            fontFamily: "var(--font-sans)",
            opacity: 0.8,
          }}
          id="onboarding-skip-btn"
          aria-label="Skip onboarding"
        >
          skip
        </button>
      </div>
    </div>
  );
}
