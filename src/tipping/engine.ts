import { env } from "../config/env.js";
import { db } from "../db/sqlite.js";
import type { MatchOdds, TeamChatter, TippingAdvice } from "../types/domain.js";

export function buildTippingAdvice(odds: MatchOdds[], chatter: TeamChatter[]): TippingAdvice[] {
  const chatterByTeam = new Map(chatter.map((entry) => [entry.team, entry]));
  const adviceRows: TippingAdvice[] = [];
  const nowUtc = Math.floor(Date.now() / 1000);

  for (const match of odds) {
    const homeImpliedProb = 1 / match.homeOddsDecimal;
    const awayImpliedProb = 1 / match.awayOddsDecimal;
    const normalizedHomeProb = homeImpliedProb / (homeImpliedProb + awayImpliedProb);
    const normalizedAwayProb = awayImpliedProb / (homeImpliedProb + awayImpliedProb);

    const homeChatter = chatterByTeam.get(match.homeTeam);
    const awayChatter = chatterByTeam.get(match.awayTeam);

    const homeSentiment = computeSentimentScore(homeChatter);
    const awaySentiment = computeSentimentScore(awayChatter);
    const sentimentDelta = homeSentiment - awaySentiment;

    const blendedHome = clamp(normalizedHomeProb + sentimentDelta * 0.06, 0.05, 0.95);
    const blendedAway = 1 - blendedHome;

    const recommendedPick = blendedHome >= blendedAway ? match.homeTeam : match.awayTeam;
    const confidence = Math.max(blendedHome, blendedAway);
    if (confidence < env.MIN_CONFIDENCE) {
      continue;
    }

    const reasoning = [
      `Market-implied probability: ${match.homeTeam} ${(normalizedHomeProb * 100).toFixed(1)}% vs ${match.awayTeam} ${(normalizedAwayProb * 100).toFixed(1)}%`,
      `Chatter sentiment adjustment: ${match.homeTeam} ${(homeSentiment * 100).toFixed(1)} vs ${match.awayTeam} ${(awaySentiment * 100).toFixed(1)}`,
      `Blended model confidence: ${(confidence * 100).toFixed(1)}%`
    ];

    adviceRows.push({
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      recommendedPick,
      confidence,
      reasoning,
      sourceOdds: match.source
    });
  }

  const insertAdvice = db.prepare(`
    INSERT INTO tipping_advice (
      home_team,
      away_team,
      recommended_pick,
      confidence,
      reasoning,
      source_odds,
      created_at_utc
    )
    VALUES (
      @home_team,
      @away_team,
      @recommended_pick,
      @confidence,
      @reasoning,
      @source_odds,
      @created_at_utc
    )
  `);

  for (const row of adviceRows) {
    insertAdvice.run({
      home_team: row.homeTeam,
      away_team: row.awayTeam,
      recommended_pick: row.recommendedPick,
      confidence: row.confidence,
      reasoning: JSON.stringify(row.reasoning),
      source_odds: row.sourceOdds,
      created_at_utc: nowUtc
    });
  }

  return adviceRows.sort((a, b) => b.confidence - a.confidence);
}

function computeSentimentScore(chatter?: TeamChatter): number {
  if (!chatter || chatter.mentions === 0) {
    return 0;
  }
  const net = chatter.positive - chatter.negative;
  return net / Math.max(chatter.mentions, 1);
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

