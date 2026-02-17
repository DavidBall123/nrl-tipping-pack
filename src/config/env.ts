import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  SQLITE_PATH: z.string().default("./data/nrl-tipping.sqlite"),
  OUTPUT_MD_PATH: z.string().default("./output/advice.md"),
  REDDIT_LIMIT: z.coerce.number().int().min(10).max(100).default(50),
  REDDIT_USER_AGENT: z.string().default("nrl-tipping-pack/0.1 by openclaw"),
  REDDIT_CLIENT_ID: z.string().min(1),
  REDDIT_CLIENT_SECRET: z.string().min(1),
  REDDIT_USERNAME: z.string().min(1),
  REDDIT_PASSWORD: z.string().min(1),
  ODDS_PROVIDER: z.enum(["theoddsapi", "mock"]).default("mock"),
  ODDS_API_KEY: z.string().optional(),
  ODDS_REGION: z.string().default("au"),
  ODDS_MARKETS: z.string().default("h2h"),
  ODDS_SPORT_KEY: z.string().default("rugby_league_nrl"),
  CHATTER_LOOKBACK_HOURS: z.coerce.number().int().min(1).max(168).default(72),
  MIN_CONFIDENCE: z.coerce.number().min(0).max(1).default(0.55)
});

export type AppEnv = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
