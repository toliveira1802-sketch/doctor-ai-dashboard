import { Router, Request, Response } from "express";
import { promises as fs } from "fs";
import path from "path";

const router = Router();

const VAULT_PATH = process.env.SECONDBRAIN_PATH || path.resolve(process.cwd(), "../SecondBrain");

// --- Helpers ---

function safePath(userPath: string): string {
  // Prevent path traversal
  const resolved = path.resolve(VAULT_PATH, userPath);
  if (!resolved.startsWith(path.resolve(VAULT_PATH))) {
    throw new Error("Invalid path: outside vault");
  }
  return resolved;
}

function todayStr(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
}

function parseFrontmatter(content: string): { frontmatter: Record<string, string>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };
  const fm: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const [key, ...rest] = line.split(":");
    if (key && rest.length) fm[key.trim()] = rest.join(":").trim();
  }
  return { frontmatter: fm, body: match[2] };
}

function buildFrontmatter(fm: Record<string, string>): string {
  if (!Object.keys(fm).length) return "";
  const lines = Object.entries(fm).map(([k, v]) => `${k}: ${v}`);
  return `---\n${lines.join("\n")}\n---\n`;
}

// --- Routes ---

// GET /api/obsidian/files?folder= — List files/folders in vault
router.get("/files", async (req: Request, res: Response) => {
  try {
    const folder = (req.query.folder as string) || "";
    const target = safePath(folder);

    const entries = await fs.readdir(target, { withFileTypes: true });
    const items = [];

    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue; // skip hidden
      const fullPath = path.join(target, entry.name);
      const relPath = path.relative(VAULT_PATH, fullPath).replace(/\\/g, "/");

      if (entry.isDirectory()) {
        // Count .md files in folder
        let mdCount = 0;
        try {
          const sub = await fs.readdir(fullPath);
          mdCount = sub.filter((f) => f.endsWith(".md")).length;
        } catch {}
        items.push({ name: entry.name, type: "folder", path: relPath, files: mdCount });
      } else if (entry.name.endsWith(".md")) {
        const stat = await fs.stat(fullPath);
        items.push({
          name: entry.name,
          type: "file",
          path: relPath,
          size: stat.size,
          modified: stat.mtime.toISOString(),
        });
      }
    }

    items.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    res.json({ folder: folder || "/", items, vault_path: VAULT_PATH });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/obsidian/note?path= — Read a note
router.get("/note", async (req: Request, res: Response) => {
  try {
    const notePath = req.query.path as string;
    if (!notePath) {
      res.status(400).json({ error: "path is required" });
      return;
    }
    const fullPath = safePath(notePath);
    const content = await fs.readFile(fullPath, "utf-8");
    const { frontmatter, body } = parseFrontmatter(content);
    const stat = await fs.stat(fullPath);

    res.json({
      path: notePath,
      frontmatter,
      content: body,
      raw: content,
      size: stat.size,
      modified: stat.mtime.toISOString(),
    });
  } catch (error: any) {
    if (error.code === "ENOENT") {
      res.status(404).json({ error: "Note not found" });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

// POST /api/obsidian/note — Create or update a note
router.post("/note", async (req: Request, res: Response) => {
  try {
    const { path: notePath, content, frontmatter } = req.body;
    if (!notePath || content === undefined) {
      res.status(400).json({ error: "path and content are required" });
      return;
    }

    const fullPath = safePath(notePath);

    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    const fm = buildFrontmatter(frontmatter || {});
    await fs.writeFile(fullPath, fm + content, "utf-8");

    res.json({ status: "ok", path: notePath, size: (fm + content).length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/obsidian/daily — Get or create today's daily note
router.post("/daily", async (req: Request, res: Response) => {
  try {
    const date = todayStr(req.body.date);
    const dailyPath = `00 Daily Notes/${date}.md`;
    const fullPath = safePath(dailyPath);

    let content: string;
    let created = false;

    try {
      content = await fs.readFile(fullPath, "utf-8");
    } catch {
      // Create daily note from template
      const now = new Date();
      const dayName = now.toLocaleDateString("pt-BR", { weekday: "long" });
      content = `---
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
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, "utf-8");
      created = true;
    }

    const { frontmatter, body } = parseFrontmatter(content);
    res.json({ path: dailyPath, date, created, frontmatter, content: body });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/obsidian/daily/append — Append an entry to today's daily note
router.post("/daily/append", async (req: Request, res: Response) => {
  try {
    const { entry, date: dateStr, section } = req.body;
    if (!entry) {
      res.status(400).json({ error: "entry is required" });
      return;
    }

    const date = todayStr(dateStr);
    const dailyPath = `00 Daily Notes/${date}.md`;
    const fullPath = safePath(dailyPath);

    let content: string;
    try {
      content = await fs.readFile(fullPath, "utf-8");
    } catch {
      // Create daily note first
      const now = new Date();
      const dayName = now.toLocaleDateString("pt-BR", { weekday: "long" });
      content = `---
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
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
    }

    // Find the target section to append under, or append to "Atividades dos Agentes"
    const targetSection = section || "Atividades dos Agentes";
    const sectionRegex = new RegExp(`(## ${targetSection}\n)`, "i");
    const timeStr = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const formattedEntry = `- **${timeStr}** — ${entry}\n`;

    if (sectionRegex.test(content)) {
      content = content.replace(sectionRegex, `$1${formattedEntry}`);
    } else {
      // Append at the end
      content = content.trimEnd() + `\n${formattedEntry}`;
    }

    await fs.writeFile(fullPath, content, "utf-8");
    res.json({ status: "ok", path: dailyPath, date, entry: formattedEntry.trim() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
