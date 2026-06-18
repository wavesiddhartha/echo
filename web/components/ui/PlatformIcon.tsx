// Real brand SVG icons for messaging platforms

export type Platform = "whatsapp" | "instagram" | "imessage" | "telegram" | "twitter" | "other";

interface PlatformIconProps {
  platform: Platform;
  size?: number;
}

// ─── WhatsApp ─────────────────────────────────────────────────────────────
function WhatsAppIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#25D366" />
      <path
        d="M16.002 7C11.033 7 7 11.033 7 16.002c0 1.583.413 3.07 1.135 4.358L7 25l4.75-1.115A9.002 9.002 0 0016.002 25C20.97 25 25 20.97 25 16.002 25 11.033 20.97 7 16.002 7z"
        fill="white"
        fillOpacity={0.15}
      />
      <path
        d="M16 7.5C11.306 7.5 7.5 11.306 7.5 16c0 1.553.42 3.01 1.152 4.263L7.5 24.5l4.347-1.135A8.459 8.459 0 0016 24.5c4.694 0 8.5-3.806 8.5-8.5 0-4.694-3.806-8.5-8.5-8.5z"
        fill="white"
      />
      <path
        d="M13.26 11.5c-.26-.005-.547.003-.82.62-.273.617-.925 2.267-.925 2.267s-.16.412.076.783c.237.37.608.855.608.855s.37.472.03.91c-.34.44-1.32 1.554-1.32 1.554s-.41.534.16 1.027c.57.493 1.96 1.553 3.37 2.014 1.41.46 2.28.36 2.69.293.41-.066 1.65-.653 1.89-1.306.24-.654.243-1.21.17-1.33-.073-.12-.267-.2-.56-.34-.293-.14-1.73-.853-2-.953-.27-.1-.47-.15-.666.147-.198.297-.767.95-.94 1.147-.173.197-.347.22-.64.073-.293-.147-1.237-.456-2.357-1.453-.873-.777-1.463-1.737-1.633-2.03-.17-.293-.018-.452.127-.597.13-.13.293-.34.44-.51.147-.17.196-.293.293-.49.098-.197.05-.37-.024-.517-.073-.147-.666-1.607-.913-2.2-.244-.58-.49-.5-.667-.508z"
        fill="#25D366"
      />
    </svg>
  );
}

// ─── Instagram ────────────────────────────────────────────────────────────
function InstagramIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ig-grad-1" cx="30%" cy="107%" r="130%">
          <stop offset="0%" stopColor="#ffd879" />
          <stop offset="10%" stopColor="#fccb6f" />
          <stop offset="28%" stopColor="#f67935" />
          <stop offset="42%" stopColor="#de2f7f" />
          <stop offset="82%" stopColor="#9b37c2" />
          <stop offset="100%" stopColor="#4f5bd5" />
        </radialGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#ig-grad-1)" />
      <rect x="9" y="9" width="14" height="14" rx="4.5" stroke="white" strokeWidth="1.5" fill="none" />
      <circle cx="16" cy="16" r="3.5" stroke="white" strokeWidth="1.5" fill="none" />
      <circle cx="21.5" cy="10.5" r="1" fill="white" />
    </svg>
  );
}

// ─── iMessage ─────────────────────────────────────────────────────────────
function IMessageIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="imsg-grad" x1="16" y1="0" x2="16" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5CF65A" />
          <stop offset="100%" stopColor="#1CC219" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#imsg-grad)" />
      <path
        d="M16 7C11.03 7 7 10.804 7 15.486c0 2.618 1.314 4.953 3.388 6.514L9.5 25l3.2-1.572A9.91 9.91 0 0016 23.97c4.97 0 9-3.803 9-8.486C25 10.804 20.97 7 16 7z"
        fill="white"
      />
    </svg>
  );
}

// ─── Telegram ─────────────────────────────────────────────────────────────
function TelegramIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tg-grad" x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#37BBFE" />
          <stop offset="100%" stopColor="#007DBB" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#tg-grad)" />
      <path
        d="M7.5 15.8l4.4 1.7 1.7 5.4 2.5-2.4 4.4 3.2 4-13.2-17 5.3z"
        fill="white"
        fillOpacity="0.3"
      />
      <path
        d="M7.5 15.8l17-5.3-4 13.2-4.4-3.2-3.3 3.4 1.3-5.4-6.6-2.7z"
        fill="white"
      />
      <path
        d="M13.6 19.2l.6 4.7 1.9-1.9-2.5-2.8z"
        fill="white"
        fillOpacity="0.6"
      />
    </svg>
  );
}

// ─── Twitter / X ──────────────────────────────────────────────────────────
function TwitterIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#000000" />
      <path
        d="M17.54 14.77L23.3 8h-1.37l-5.02 5.64L12.7 8H8l6.04 8.54L8 24h1.37l5.29-5.95L19.3 24H24l-6.46-9.23zm-1.87 2.11l-.61-.85-4.88-6.81h2.1l3.93 5.47.61.85 5.12 7.14h-2.1l-4.17-5.8z"
        fill="white"
      />
    </svg>
  );
}

// ─── Other / Generic ──────────────────────────────────────────────────────
function OtherIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#2A2A2A" />
      <rect x="7" y="10" width="18" height="13" rx="2.5" stroke="#888" strokeWidth="1.4" fill="none" />
      <path d="M7 13l9 6 9-6" stroke="#888" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// ─── Public icon component ────────────────────────────────────────────────

export function PlatformIcon({ platform, size = 28 }: PlatformIconProps) {
  switch (platform) {
    case "whatsapp":   return <WhatsAppIcon size={size} />;
    case "instagram":  return <InstagramIcon size={size} />;
    case "imessage":   return <IMessageIcon size={size} />;
    case "telegram":   return <TelegramIcon size={size} />;
    case "twitter":    return <TwitterIcon size={size} />;
    default:           return <OtherIcon size={size} />;
  }
}

// ─── Platform metadata ────────────────────────────────────────────────────

export const PLATFORM_META: {
  value: Platform;
  label: string;
  color: string;
}[] = [
  { value: "whatsapp",  label: "WhatsApp",  color: "#25D366" },
  { value: "instagram", label: "Instagram", color: "#E1306C" },
  { value: "imessage",  label: "iMessage",  color: "#1CC219" },
  { value: "telegram",  label: "Telegram",  color: "#0088CC" },
  { value: "twitter",   label: "X / Twitter", color: "#000000" },
  { value: "other",     label: "Other",     color: "#888888" },
];
