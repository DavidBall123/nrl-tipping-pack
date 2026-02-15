import fs from "node:fs";
import path from "node:path";
import { env } from "../config/env.js";
import type { TeamChatter, TippingAdvice } from "../types/domain.js";

export function writeAdviceMarkdown(advice: TippingAdvice[], chatter: TeamChatter[]): string {
  const now = new Date();
  const chatterLeaders = [...chatter].sort((a, b) => b.mentions - a.mentions).slice(0, 8);
  const lines: string[] = [];

  lines.push("# NRL Tipping Advice");
  lines.push("");
  lines.push(`Generated at: ${now.toISOString()}`);
  lines.push("");
  lines.push("## Picks");
  lines.push("");

  if (advice.length === 0) {
    lines.push("- No picks met the configured confidence threshold.");
  } else {
    for (const pick of advice) {
      lines.push(`### ${pick.homeTeam} vs ${pick.awayTeam}`);
      lines.push(`- Recommended tip: **${pick.recommendedPick}**`);
      lines.push(`- Confidence: ${(pick.confidence * 100).toFixed(1)}%`);
      lines.push(`- Odds source: ${pick.sourceOdds}`);
      for (const reason of pick.reasoning) {
        lines.push(`- ${reason}`);
      }
      lines.push("");
    }
  }

  lines.push("## Team Chatter Snapshot (r/nrl)");
  lines.push("");
  for (const team of chatterLeaders) {
    lines.push(
      `- ${team.team}: mentions ${team.mentions}, positive ${team.positive}, negative ${team.negative}`
    );
    if (team.samplePosts.length > 0) {
      lines.push(`  - sample posts: ${team.samplePosts.join(" | ")}`);
    }
  }

  const markdown = `${lines.join("\n").trim()}\n`;
  const outputPath = path.resolve(env.OUTPUT_MD_PATH);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, markdown, "utf8");
  return outputPath;
}

