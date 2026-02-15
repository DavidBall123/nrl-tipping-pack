import axios from "axios";
import { env } from "../config/env.js";
import { db } from "../db/sqlite.js";
import type { MatchOdds } from "../types/domain.js";

type OddsApiEvent = {
  home_team: string;
  away_team: string;
  commence_time: string;
  bookmakers: Array<{
    key: string;
    title: string;
    markets: Array<{
      key: string;
      outcomes: Array<{ name: string; price: number }>;
    }>;
  }>;
};

export async function collectOdds(): Promise<MatchOdds[]> {
  if (env.ODDS_PROVIDER === "mock") {
    return saveOdds([
      {
        homeTeam: "Penrith Panthers",
        awayTeam: "Sydney Roosters",
        kickoffUtc: new Date().toISOString(),
        homeOddsDecimal: 1.62,
        awayOddsDecimal: 2.3,
        source: "mock"
      },
      {
        homeTeam: "Brisbane Broncos",
        awayTeam: "Melbourne Storm",
        kickoffUtc: new Date().toISOString(),
        homeOddsDecimal: 2.45,
        awayOddsDecimal: 1.55,
        source: "mock"
      }
    ]);
  }

  if (!env.ODDS_API_KEY) {
    throw new Error("ODDS_API_KEY is required when ODDS_PROVIDER=theoddsapi");
  }

  const url = `https://api.the-odds-api.com/v4/sports/${env.ODDS_SPORT_KEY}/odds`;
  const response = await axios.get<OddsApiEvent[]>(url, {
    params: {
      apiKey: env.ODDS_API_KEY,
      regions: env.ODDS_REGION,
      markets: env.ODDS_MARKETS,
      oddsFormat: "decimal",
      dateFormat: "iso"
    },
    timeout: 10_000
  });

  const events = response.data;
  const odds: MatchOdds[] = [];

  for (const event of events) {
    const bookmaker = event.bookmakers[0];
    if (!bookmaker) {
      continue;
    }

    const market = bookmaker.markets.find((entry) => entry.key === "h2h");
    if (!market || market.outcomes.length < 2) {
      continue;
    }

    const homeOutcome = market.outcomes.find((outcome) => outcome.name === event.home_team);
    const awayOutcome = market.outcomes.find((outcome) => outcome.name === event.away_team);
    if (!homeOutcome || !awayOutcome) {
      continue;
    }

    odds.push({
      homeTeam: event.home_team,
      awayTeam: event.away_team,
      kickoffUtc: event.commence_time,
      homeOddsDecimal: homeOutcome.price,
      awayOddsDecimal: awayOutcome.price,
      source: `theoddsapi:${bookmaker.title}`
    });
  }

  return saveOdds(odds);
}

function saveOdds(odds: MatchOdds[]): MatchOdds[] {
  const nowUtc = Math.floor(Date.now() / 1000);
  const insertOdds = db.prepare(`
    INSERT INTO odds_snapshot (
      home_team,
      away_team,
      kickoff_utc,
      home_odds_decimal,
      away_odds_decimal,
      source,
      sampled_at_utc
    )
    VALUES (
      @home_team,
      @away_team,
      @kickoff_utc,
      @home_odds_decimal,
      @away_odds_decimal,
      @source,
      @sampled_at_utc
    )
  `);

  for (const odd of odds) {
    insertOdds.run({
      home_team: odd.homeTeam,
      away_team: odd.awayTeam,
      kickoff_utc: odd.kickoffUtc ?? null,
      home_odds_decimal: odd.homeOddsDecimal,
      away_odds_decimal: odd.awayOddsDecimal,
      source: odd.source,
      sampled_at_utc: nowUtc
    });
  }

  return odds;
}

