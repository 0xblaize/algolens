import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

export async function GET() {
  const root = process.cwd();
  const files = [
    join(root, "src/app/page.tsx"),
    join(root, "src/components/landing-sections.tsx"),
  ];

  const results: Record<string, string> = {};

  for (const f of files) {
    let content = readFileSync(f, "utf8");
    const original = content;
    content = content.replace(/\/dashboard#marketcourt/g, "/dashboard/marketcourt");
    content = content.replace(/\/dashboard#ledger/g, "/dashboard/ledger");
    content = content.replace(/\/dashboard#radar/g, "/dashboard/radar");
    content = content.replace(/\/dashboard#execution/g, "/dashboard/execution");
    writeFileSync(f, content);
    results[f.split("src/")[1]] = content === original ? "no changes" : "✅ updated";
  }

  return Response.json({ results });
}
