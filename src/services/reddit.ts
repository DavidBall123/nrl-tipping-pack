import axios from "axios";
import { env } from "../config/env.js";
import { NEGATIVE_KEYWORDS, NRL_TEAMS, POSITIVE_KEYWORDS, TEAM_ALIASES } from "../config/nrl.js";
import { db } from "../db/sqlite.js";
import type { TeamChatter } from "../types/domain.js";

type RedditListingResponse = {
  data: {
    children: Array<{
      data: {
        id: string;
        title: string;
        permalink: string;
        created_utc: number;
        score: number;
        selftext?: string;
      };
    }>;
  };
};

type RedditTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
};

let redditAccessToken: string | null = null;
let redditAccessTokenExpiresAtMs = 0;

async function getRedditAccessToken(): Promise<string> {
  const now = Date.now();
  if (redditAccessToken && now < redditAccessTokenExpiresAtMs) {
    return redditAccessToken;
  }

  const response = await axios.post<RedditTokenResponse>(
    "https://www.reddit.com/api/v1/access_token",
    new URLSearchParams({
      grant_type: "password",
      username: env.REDDIT_USERNAME,
      password: env.REDDIT_PASSWORD
    }),
    {
      auth: {
        username: env.REDDIT_CLIENT_ID,
        password: env.REDDIT_CLIENT_SECRET
      },
      headers: {
        "User-Agent": env.REDDIT_USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      timeout: 10_000
    }
  );

  redditAccessToken = response.data.access_token;
  redditAccessTokenExpiresAtMs = Date.now() + Math.max((response.data.expires_in - 60) * 1000, 60_000);
  return redditAccessToken;
}

export async function collectTeamChatter(): Promise<TeamChatter[]> {
  const token = await getRedditAccessToken();
  const url = `https://oauth.reddit.com/r/nrl/new?limit=${env.REDDIT_LIMIT}`;
  const response = await axios.get<RedditListingResponse>(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": env.REDDIT_USER_AGENT
    },
    timeout: 10_000
  });

  const nowUtc = Math.floor(Date.now() / 1000);
  const lookbackSeconds = env.CHATTER_LOOKBACK_HOURS * 3600;
  const relevantPosts = response.data.data.children
    .map((node) => node.data)
    .filter((post) => nowUtc - post.created_utc <= lookbackSeconds);

  const insertPost = db.prepare(`
    INSERT OR IGNORE INTO reddit_posts (id, title, permalink, created_utc, score, selftext)
    VALUES (@id, @title, @permalink, @created_utc, @score, @selftext)
  `);

  for (const post of relevantPosts) {
    insertPost.run({
      ...post,
      permalink: `https://www.reddit.com${post.permalink}`,
      selftext: post.selftext ?? ""
    });
  }

  const chatterMap = new Map<string, TeamChatter>(
    NRL_TEAMS.map((team) => [
      team,
      { team, mentions: 0, positive: 0, negative: 0, samplePosts: [] }
    ])
  );

  for (const post of relevantPosts) {
    const body = `${post.title} ${post.selftext ?? ""}`.toLowerCase();
    for (const [team, aliases] of Object.entries(TEAM_ALIASES)) {
      if (!aliases.some((alias) => body.includes(alias))) {
        continue;
      }

      const chatter = chatterMap.get(team);
      if (!chatter) {
        continue;
      }

      chatter.mentions += 1;
      chatter.positive += POSITIVE_KEYWORDS.reduce((count, keyword) => (body.includes(keyword) ? count + 1 : count), 0);
      chatter.negative += NEGATIVE_KEYWORDS.reduce((count, keyword) => (body.includes(keyword) ? count + 1 : count), 0);
      if (chatter.samplePosts.length < 3) {
        chatter.samplePosts.push(post.title);
      }
    }
  }

  const insertChatter = db.prepare(`
    INSERT INTO team_chatter (team, mentions, positive, negative, sampled_at_utc)
    VALUES (@team, @mentions, @positive, @negative, @sampled_at_utc)
  `);

  for (const chatter of chatterMap.values()) {
    insertChatter.run({
      team: chatter.team,
      mentions: chatter.mentions,
      positive: chatter.positive,
      negative: chatter.negative,
      sampled_at_utc: nowUtc
    });
  }

  return [...chatterMap.values()];
}
