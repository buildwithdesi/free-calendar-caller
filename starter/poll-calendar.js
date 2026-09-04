/**
 * Dual-calendar poller sketch (Node 18+).
 * Wire googleapis OAuth refresh tokens for each Gmail, then run on cron.
 *
 * Reminder windows are rule-driven. Example:
 *   client/interview/strategy/kickoff → 60m + 15m + 5m
 *   default (including site-booking GCal events) → 15m + 5m
 * Dashboard overrides win over rules.
 * Site-booking events stay in this stream — do not skip da-site-booking stamps.
 */

import { placeTelegramCall, buildSpokenMessage, buildTextMessage } from "./callmebot.js";

const TIME_ZONE = process.env.TZ_DISPLAY || "America/Chicago";
const LOOKAHEAD_MINUTES = 65;

/** Default rules — customize or load from your dashboard DB. */
const RULES = [
  {
    id: "client",
    match: (e) => /client|interview|strategy|kickoff/i.test(e.title || ""),
    windows: [60, 15, 5],
  },
  {
    id: "personal-default",
    match: () => true,
    windows: [15, 5],
  },
];

const SKIP = (e) =>
  e.allDay ||
  /birthday|focus time|out of office|ooo/i.test(e.title || "");

/** In-memory demo log. Replace with Postgres / JSON file / Supabase. */
const callLog = new Set();

function logKey(eventId, windowMin, channel) {
  return `${eventId}|${windowMin}|${channel}`;
}

function minutesUntil(startIso) {
  return (new Date(startIso).getTime() - Date.now()) / 60000;
}

function inWindow(minsUntil, windowMin, slack = 7) {
  // Cron every 5m: fire when within (windowMin - slack, windowMin]
  return minsUntil <= windowMin && minsUntil > windowMin - slack;
}

function resolveWindows(event, override) {
  if (override && Array.isArray(override.windows) && override.windows.length) {
    return override.windows;
  }
  for (const rule of RULES) {
    if (rule.match(event)) return rule.windows;
  }
  return [15, 5];
}

function extractMeetLink(event) {
  if (event.hangoutLink) return event.hangoutLink;
  const entry = (event.conferenceData && event.conferenceData.entryPoints) || [];
  const video = entry.find((p) => p.entryPointType === "video");
  if (video && video.uri) return video.uri;
  const blob = `${event.location || ""} ${event.description || ""}`;
  const m = blob.match(/https:\/\/meet\.google\.com\/[a-z0-9-]+/i);
  return m ? m[0] : null;
}

/**
 * @param {Array} calendars — [{ name, events: [{ id, title, start, location, ... }] }]
 * @param {Object} overrides — { [eventId]: { enabled: boolean, windows: number[] } }
 */
export async function processCalendars(calendars, overrides = {}) {
  const results = [];

  for (const cal of calendars) {
    for (const raw of cal.events || []) {
      const event = {
        ...raw,
        meetLink: extractMeetLink(raw),
        account: cal.name,
      };

      if (SKIP(event)) continue;

      const override = overrides[event.id];
      if (override && override.enabled === false) continue;

      // If no override.enabled and you want "opt-in only", skip when no rule matched.
      // Here: rules auto-enable; override.enabled=false opts out.

      const windows = resolveWindows(event, override);
      const until = minutesUntil(event.start);
      if (until < 0 || until > LOOKAHEAD_MINUTES) continue;

      for (const windowMin of windows) {
        if (!inWindow(until, windowMin)) continue;

        const callKey = logKey(event.id, windowMin, "call");
        const textKey = logKey(event.id, windowMin, "text");

        if (!callLog.has(callKey)) {
          const spoken = buildSpokenMessage(event, TIME_ZONE);
          const ok = await placeTelegramCall(spoken);
          callLog.add(callKey); // mark attempt so we don't infinite-retry
          results.push({ event: event.id, windowMin, channel: "call", ok });
        }

        if (!callLog.has(textKey)) {
          // Swap this for CallMeBot text API or your own Telegram bot sendMessage
          const text = buildTextMessage(event, TIME_ZONE);
          console.log("[text-preview]", text);
          callLog.add(textKey);
          results.push({ event: event.id, windowMin, channel: "text", ok: true });
        }
      }
    }
  }

  return results;
}

// Manual smoke test:
// node --input-type=module -e "import { processCalendars } from './poll-calendar.js'; ..."
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  console.log("Import processCalendars from your cron entrypoint.");
}
