import type { Express } from "express";
import type { Server } from "http";
import bcrypt from "bcryptjs";
import Anthropic from "@anthropic-ai/sdk";
import { storage } from "./storage";
import {
  insertStaffSchema, insertArticleSchema,
  insertIssueSchema, insertAssignmentSchema, insertMessageSchema,
  insertAnnouncementSchema,
} from "@shared/schema";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

const PROOFDESK_PROMPT = `You are ProofDesk, an expert newspaper copy editor and document formatter. Your job is to take raw article text, meticulously proofread it, and produce a polished version.

Your Workflow (follow in strict order):

Phase 1 — Proofreading
Carefully read the entire article. Identify and correct every error in the following categories:
- Grammar (subject-verb agreement, tense consistency, dangling modifiers, etc.)
- Spelling (typos, misspellings, commonly confused words like "their/there/they're")
- Style (awkward phrasing, redundancy, wordiness, AP style conventions)
- Punctuation (misplaced commas, missing periods, incorrect dash usage, etc.)

For every correction you make, report it in a numbered change log using this JSON format:
{"changes": [{"original": "exact original text", "corrected": "corrected text", "reason": "Brief explanation"}]}

If the article contains zero errors, return: {"changes": []}

Phase 2 — Output
Return a JSON object with exactly two keys:
1. "changes" — the array of corrections
2. "correctedText" — the full corrected article text

IMPORTANT: Return ONLY valid JSON. No markdown, no commentary, no extra text outside the JSON object.
Take your time. Accuracy matters more than speed. Read the article at least twice before finalizing.`;

const SALT_ROUNDS = 10;

export async function registerRoutes(server: Server, app: Express) {
  // ─── Auth ───
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const user = storage.getStaffByEmail(email.toLowerCase().trim());
    if (!user) return res.status(401).json({ error: "Invalid email or password" });
    if (!user.active) return res.status(403).json({ error: "Account deactivated" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid email or password" });

    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password, role, section } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    const existing = storage.getStaffByEmail(email.toLowerCase().trim());
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
    const user = storage.createStaff({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      role: role || "writer",
      section: section || null,
      avatarInitials: initials,
      active: true,
    });
    const { password: _, ...safeUser } = user;
    res.status(201).json(safeUser);
  });

  // ─── Dashboard ───
  app.get("/api/dashboard", (_req, res) => {
    res.json(storage.getDashboardStats());
  });

  // ─── Staff ───
  app.get("/api/staff", (_req, res) => {
    const all = storage.getStaff().map(({ password, ...s }) => s);
    res.json(all);
  });

  // Admin-only: view staff with credential info
  app.get("/api/staff/admin/credentials", (_req, res) => {
    // In production, verify the requesting user is admin via session/token.
    // For now the frontend only calls this if the user is editor-in-chief.
    const all = storage.getStaff().map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      role: s.role,
      section: s.section,
      active: s.active,
      avatarInitials: s.avatarInitials,
      hasPassword: !!s.password && s.password.length > 0,
      // We cannot reverse bcrypt hashes — show whether password is set
    }));
    res.json(all);
  });

  // Admin: reset a user's password
  app.post("/api/staff/:id/reset-password", async (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const s = storage.updateStaff(Number(req.params.id), { password: hashed });
    if (!s) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  });

  app.get("/api/staff/:id", (req, res) => {
    const s = storage.getStaffById(Number(req.params.id));
    if (!s) return res.status(404).json({ error: "Not found" });
    const { password, ...safe } = s;
    res.json(safe);
  });
  app.post("/api/staff", async (req, res) => {
    // When admin creates staff, hash password if provided
    const data = { ...req.body };
    if (data.password) {
      data.password = await bcrypt.hash(data.password, SALT_ROUNDS);
    } else {
      // Generate a temporary password
      const temp = Math.random().toString(36).slice(-8);
      data.password = await bcrypt.hash(temp, SALT_ROUNDS);
    }
    const parsed = insertStaffSchema.safeParse(data);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const s = storage.createStaff(parsed.data);
    res.status(201).json(s);
  });
  app.patch("/api/staff/:id", (req, res) => {
    const s = storage.updateStaff(Number(req.params.id), req.body);
    if (!s) return res.status(404).json({ error: "Not found" });
    const { password, ...safe } = s;
    res.json(safe);
  });

  // ─── Articles ───
  app.get("/api/articles", (_req, res) => {
    res.json(storage.getArticles());
  });
  app.get("/api/articles/:id", (req, res) => {
    const a = storage.getArticleById(Number(req.params.id));
    if (!a) return res.status(404).json({ error: "Not found" });
    res.json(a);
  });
  app.post("/api/articles", (req, res) => {
    const parsed = insertArticleSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const a = storage.createArticle(parsed.data);
    res.status(201).json(a);
  });
  app.patch("/api/articles/:id", (req, res) => {
    const a = storage.updateArticle(Number(req.params.id), req.body);
    if (!a) return res.status(404).json({ error: "Not found" });
    res.json(a);
  });
  app.delete("/api/articles/:id", (req, res) => {
    storage.deleteArticle(Number(req.params.id));
    res.status(204).send();
  });

  // Proofread via Claude API
  app.post("/api/articles/:id/proofread", async (req, res) => {
    const article = storage.getArticleById(Number(req.params.id));
    if (!article) return res.status(404).json({ error: "Not found" });
    if (!article.content || article.content.trim().length === 0) {
      return res.status(400).json({ error: "Article has no content to proofread" });
    }

    try {
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: `${PROOFDESK_PROMPT}\n\nHere is the article to proofread:\n\n${article.content}`,
          },
        ],
      });

      const responseText = message.content[0].type === "text" ? message.content[0].text : "";

      // Parse Claude's JSON response
      let changes: Array<{ original: string; corrected: string; reason: string }> = [];
      let correctedText = article.content;

      try {
        // Try to extract JSON from the response (handle markdown code blocks)
        let jsonStr = responseText;
        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) jsonStr = jsonMatch[1];
        // Also try to find raw JSON object
        const braceMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (braceMatch) jsonStr = braceMatch[0];

        const parsed = JSON.parse(jsonStr);
        changes = parsed.changes || [];
        correctedText = parsed.correctedText || article.content;
      } catch {
        // If JSON parsing fails, use the raw response as corrected text
        correctedText = responseText;
        changes = [{ original: "(full article)", corrected: "(see corrected text)", reason: "AI proofreading applied" }];
      }

      const updated = storage.updateArticle(Number(req.params.id), {
        status: "proofread",
        proofreadContent: correctedText,
        changeLog: JSON.stringify(changes),
      });

      res.json(updated);
    } catch (err: any) {
      console.error("Proofread error:", err.message);
      res.status(500).json({ error: "Proofreading failed: " + (err.message || "Unknown error") });
    }
  });

  // ─── Issues ───
  app.get("/api/issues", (_req, res) => res.json(storage.getIssues()));
  app.get("/api/issues/:id", (req, res) => {
    const i = storage.getIssueById(Number(req.params.id));
    if (!i) return res.status(404).json({ error: "Not found" });
    res.json(i);
  });
  app.post("/api/issues", (req, res) => {
    const parsed = insertIssueSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    res.status(201).json(storage.createIssue(parsed.data));
  });
  app.patch("/api/issues/:id", (req, res) => {
    const i = storage.updateIssue(Number(req.params.id), req.body);
    if (!i) return res.status(404).json({ error: "Not found" });
    res.json(i);
  });

  // ─── Assignments ───
  app.get("/api/assignments", (_req, res) => res.json(storage.getAssignments()));
  app.post("/api/assignments", (req, res) => {
    const parsed = insertAssignmentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    res.status(201).json(storage.createAssignment(parsed.data));
  });
  app.patch("/api/assignments/:id", (req, res) => {
    const a = storage.updateAssignment(Number(req.params.id), req.body);
    if (!a) return res.status(404).json({ error: "Not found" });
    res.json(a);
  });
  app.delete("/api/assignments/:id", (req, res) => {
    storage.deleteAssignment(Number(req.params.id));
    res.status(204).send();
  });

  // ─── Channels & Messages ───
  app.get("/api/channels", (_req, res) => res.json(storage.getChannels()));
  app.get("/api/channels/:id/messages", (req, res) => {
    res.json(storage.getMessagesByChannel(Number(req.params.id)));
  });
  app.post("/api/messages", (req, res) => {
    const parsed = insertMessageSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    res.status(201).json(storage.createMessage(parsed.data));
  });
  app.patch("/api/messages/:id", (req, res) => {
    const m = storage.updateMessage(Number(req.params.id), req.body);
    if (!m) return res.status(404).json({ error: "Not found" });
    res.json(m);
  });

  // ─── Announcements ───
  app.get("/api/announcements", (_req, res) => res.json(storage.getAnnouncements()));
  app.post("/api/announcements", (req, res) => {
    const parsed = insertAnnouncementSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    res.status(201).json(storage.createAnnouncement(parsed.data));
  });
  app.delete("/api/announcements/:id", (req, res) => {
    storage.deleteAnnouncement(Number(req.params.id));
    res.status(204).send();
  });
}
