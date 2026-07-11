/**
 * CallMeBot — free Telegram voice call (TTS).
 * Docs: https://www.callmebot.com/
 *
 * One-time setup:
 * 1. Telegram → Settings → Privacy → Calls → allow calls
 * 2. Authorize once via CallMeBot browser test page
 * 3. Set CALLMEBOT_TELEGRAM_USER
 *
 * Soft-fails: never throw. Check response BODY even on HTTP 200.
 */

const CALLMEBOT_API = "https://api.callmebot.com/start.php";

export async function placeTelegramCall(message, opts = {}) {
  const user = opts.user || process.env.CALLMEBOT_TELEGRAM_USER;
  const lang = opts.lang || process.env.CALLMEBOT_LANG || "en-US-Standard-B";
  const rpt = String(opts.repeat || process.env.CALLMEBOT_REPEAT || "2");

  if (!user) {
    console.warn("[callmebot] skipped — CALLMEBOT_TELEGRAM_USER missing");
    return false;
  }

  const params = new URLSearchParams({
    source: opts.source || "FreeCalendarCaller",
    user,
    text: message,
    lang,
    rpt,
  });

  try {
    const res = await fetch(`${CALLMEBOT_API}?${params.toString()}`);
    const body = await res.text().catch(() => "");
    if (!res.ok) {
      console.error(`[callmebot] HTTP ${res.status}: ${body.slice(0, 200)}`);
      return false;
    }
    if (/disabled|error|not\s+authorized|spam/i.test(body)) {
      console.error(`[callmebot] body warning: ${body.slice(0, 200)}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[callmebot] threw:", err.message);
    return false;
  }
}

/** Build the spoken reminder (Central / display TZ). */
export function buildSpokenMessage(event, timeZone = "America/Chicago") {
  const start = new Date(event.start);
  const spokenTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(start);

  const where = event.location || event.meetLink || "check your calendar";
  const title = event.title || "your event";

  return `Lock in. ${title} at ${spokenTime}. Location: ${where}. Get ready.`;
}

/** Plain text follow-up with Meet link + crumbs. */
export function buildTextMessage(event, timeZone = "America/Chicago") {
  const start = new Date(event.start);
  const when = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(start);

  const lines = [
    `📅 ${event.title || "Event"}`,
    `🕒 ${when}`,
  ];
  if (event.location) lines.push(`📍 ${event.location}`);
  if (event.meetLink) lines.push(`🔗 ${event.meetLink}`);
  if (event.htmlLink) lines.push(`Calendar: ${event.htmlLink}`);
  return lines.join("\n");
}
