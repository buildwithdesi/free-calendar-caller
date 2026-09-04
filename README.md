# Free Calendar Caller Bot

Open-source recipe: Google Calendar → CallMeBot Telegram voice + text. No Twilio.

## Live guide

Open `index.html` (or the Vercel URL) for the full walkthrough with click-to-copy starter files baked in.

## Starter files (also embedded in the HTML)

| File | Purpose |
| --- | --- |
| `starter/env.example` | Env vars for CallMeBot + Google |
| `starter/callmebot.js` | Soft-fail Telegram voice call |
| `starter/poll-calendar.js` | Dual-calendar poll + reminder windows |
| `starter/.github/workflows/remind.yml` | Free GitHub Actions cron every 5 min |

## Customize

This repo is the **only** timed Telegram/CallMeBot reminder path for Desi’s Google Calendar meetings **and** website bookings (bookings already land as GCal events). Website timed admin reminders are being turned off so alerts are not duplicated.

Default windows in `starter/poll-calendar.js`:

- client / interview / strategy / kickoff → `[60, 15, 5]`
- everything else → `[15, 5]`

Cron is `*/5 * * * *` (see `.github/workflows/remind.yml`) so the 5-minute window can actually fire. Slack stays ~7 minutes.

Do not skip site-booking events. All-day / birthday / focus / OOO titles still skip.

## License

MIT — steal it, ship it, teach it.
