# NRL Tipping Pack (OpenClaw)

Node/TypeScript service that:
- Reads r/nrl chatter/news.
- Pulls NRL odds from an odds provider.
- Blends market probabilities + chatter sentiment.
- Writes Markdown advice for OpenClaw (`output/advice.md`).
- Persists snapshots in SQLite.

## Quick start

1. Install dependencies:
   `npm install`
2. Copy env file:
   `Copy-Item .env.example .env`
3. Run one batch:
   `npm run run:once`
4. Check output:
   `output/advice.md`

## Docker (Linode)

1. Configure `.env`.
2. Build and run:
   `docker compose up --build -d`
3. Advice file will be at:
   `./output/advice.md`

## Configuration

Key env vars:
- `ODDS_PROVIDER`: `mock` or `theoddsapi`
- `ODDS_API_KEY`: required when using `theoddsapi`
- `CHATTER_LOOKBACK_HOURS`: Reddit post lookback window
- `MIN_CONFIDENCE`: minimum confidence for emitted picks
- `SQLITE_PATH`: SQLite file path
- `OUTPUT_MD_PATH`: markdown output path

## Notes

- Reddit endpoint uses public JSON feed (`/r/nrl/new.json`) with a user-agent.
- Odds integration is implemented with The Odds API by default provider interface. You can add extra providers in `src/services/odds.ts`.
- If you scrape bookmaker websites directly, validate each site's terms and local regulations before use.
- Companion note: maintained with help from **Rook** (your OpenClaw assistant).

## Project layout

- `src/services/reddit.ts`: reddit ingestion + team chatter extraction
- `src/services/odds.ts`: odds ingestion provider
- `src/tipping/engine.ts`: tip selection engine
- `src/output/markdown.ts`: markdown writer for OpenClaw
- `src/db/sqlite.ts`: SQLite schema and persistence

