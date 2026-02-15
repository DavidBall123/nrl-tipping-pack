import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { env } from "../config/env.js";

const sqlitePath = path.resolve(env.SQLITE_PATH);
fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });

export const db = new Database(sqlitePath);

db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS reddit_posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  permalink TEXT NOT NULL,
  created_utc INTEGER NOT NULL,
  score INTEGER NOT NULL,
  selftext TEXT
);

CREATE TABLE IF NOT EXISTS team_chatter (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team TEXT NOT NULL,
  mentions INTEGER NOT NULL,
  positive INTEGER NOT NULL,
  negative INTEGER NOT NULL,
  sampled_at_utc INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS odds_snapshot (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  kickoff_utc TEXT,
  home_odds_decimal REAL NOT NULL,
  away_odds_decimal REAL NOT NULL,
  source TEXT NOT NULL,
  sampled_at_utc INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tipping_advice (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  recommended_pick TEXT NOT NULL,
  confidence REAL NOT NULL,
  reasoning TEXT NOT NULL,
  source_odds TEXT NOT NULL,
  created_at_utc INTEGER NOT NULL
);
`);

