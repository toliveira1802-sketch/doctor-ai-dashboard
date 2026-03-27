/**
 * Shared helper: append entries to Obsidian daily notes.
 * Used by webhook routes and the activity endpoint to auto-log agent actions.
 */
import { promises as fs } from "fs";
import path from "path";

const VAULT_PATH = process.env.SECONDBRAIN_PATH || path.resolve(process.cwd(), "../SecondBrain");

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function timeStr(): string {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

async function ensureDailyNote(date: string): Promise<string> {
  const dailyDir = path.join(VAULT_PATH, "00 Daily Notes");
  const filePath = path.join(dailyDir, `${date}.md`);

  try {
    await fs.access(filePath);
  } catch {
    const now = new Date(date + "T12:00:00");
    const dayName = now.toLocaleDateString("pt-BR", { weekday: "long" });
    const content = `---
date: ${date}
type: daily
tags: daily-note
---
# ${date} — ${dayName}

## Resumo do Dia


## Atividades dos Agentes


## Leads & Conversas


## Insights & Decisoes


## Notas Pessoais

`;
    await fs.mkdir(dailyDir, { recursive: true });
    await fs.writeFile(filePath, content, "utf-8");
  }

  return filePath;
}

/**
 * Append an activity entry to today's daily note under a given section.
 * Non-blocking: errors are silently caught so they don't affect the main flow.
 */
export async function appendToDaily(
  entry: string,
  section: string = "Atividades dos Agentes"
): Promise<void> {
  try {
    const date = todayStr();
    const filePath = await ensureDailyNote(date);
    let content = await fs.readFile(filePath, "utf-8");

    const time = timeStr();
    const line = `- **${time}** — ${entry}\n`;

    const sectionRegex = new RegExp(`(## ${section}\n)`, "i");
    if (sectionRegex.test(content)) {
      content = content.replace(sectionRegex, `$1${line}`);
    } else {
      content = content.trimEnd() + `\n${line}`;
    }

    await fs.writeFile(filePath, content, "utf-8");
  } catch (err) {
    console.error("[daily-note] Failed to append:", (err as Error).message);
  }
}
