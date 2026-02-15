import { collectOdds } from "./services/odds.js";
import { collectTeamChatter } from "./services/reddit.js";
import { buildTippingAdvice } from "./tipping/engine.js";
import { writeAdviceMarkdown } from "./output/markdown.js";
import "./db/sqlite.js";

const RUN_INTERVAL_MINUTES = 60;

async function runOnce(): Promise<void> {
  const [chatter, odds] = await Promise.all([collectTeamChatter(), collectOdds()]);
  const advice = buildTippingAdvice(odds, chatter);
  const outputPath = writeAdviceMarkdown(advice, chatter);
  console.log(
    JSON.stringify(
      {
        status: "ok",
        picks: advice.length,
        outputPath
      },
      null,
      2
    )
  );
}

async function main(): Promise<void> {
  const once = process.argv.includes("--once");
  if (once) {
    await runOnce();
    return;
  }

  await runOnce();
  setInterval(async () => {
    try {
      await runOnce();
    } catch (error) {
      console.error("Scheduled run failed:", error);
    }
  }, RUN_INTERVAL_MINUTES * 60_000);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

