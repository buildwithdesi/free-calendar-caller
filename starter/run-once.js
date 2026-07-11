/**
 * Cron entrypoint stub — replace fetchUpcomingEvents with real Google Calendar calls.
 * Keep this file thin: load tokens → list events → processCalendars.
 */

import { processCalendars } from "./poll-calendar.js";

async function fetchUpcomingEvents(_account) {
  // TODO: googleapis calendar.events.list with refresh token for this account
  // Return normalized: { id, title, start, location, hangoutLink, description, allDay, htmlLink }
  return [];
}

async function main() {
  const calendars = [
    { name: "personal", events: await fetchUpcomingEvents("personal") },
    { name: "work", events: await fetchUpcomingEvents("work") },
  ];

  // Load dashboard overrides from your DB (enabled + windows per event id)
  const overrides = {};

  const results = await processCalendars(calendars, overrides);
  console.log(JSON.stringify({ at: new Date().toISOString(), results }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
