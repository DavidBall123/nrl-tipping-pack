export type TeamChatter = {
  team: string;
  mentions: number;
  positive: number;
  negative: number;
  samplePosts: string[];
};

export type MatchOdds = {
  homeTeam: string;
  awayTeam: string;
  kickoffUtc?: string;
  homeOddsDecimal: number;
  awayOddsDecimal: number;
  source: string;
};

export type TippingAdvice = {
  homeTeam: string;
  awayTeam: string;
  recommendedPick: string;
  confidence: number;
  reasoning: string[];
  sourceOdds: string;
};

