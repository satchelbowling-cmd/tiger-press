import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Staff members (with auth)
export const staff = sqliteTable("staff", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull().default(""), // hashed
  role: text("role").notNull(), // writer, editor, photographer, editor-in-chief, designer
  section: text("section"), // news, opinion, sports, arts, campus-life (for group chat assignment)
  avatarInitials: text("avatar_initials").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

// Articles
export const articles = sqliteTable("articles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  authorId: integer("author_id").references(() => staff.id),
  editorId: integer("editor_id").references(() => staff.id),
  status: text("status").notNull().default("submitted"),
  category: text("category").notNull(),
  content: text("content").notNull().default(""),
  proofreadContent: text("proofread_content"),
  changeLog: text("change_log"),
  wordCount: integer("word_count").notNull().default(0),
  submittedAt: text("submitted_at").notNull(),
  deadline: text("deadline"),
  issueDate: text("issue_date"),
  notes: text("notes"),
  // Upload metadata
  originalFilename: text("original_filename"),
  fileType: text("file_type"), // docx, md, txt, paste
  tags: text("tags"), // JSON array of tags
  priority: text("priority").default("normal"), // low, normal, high, urgent
});

// Photos
export const photos = sqliteTable("photos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  articleId: integer("article_id").references(() => articles.id),
  photographerId: integer("photographer_id").references(() => staff.id),
  caption: text("caption"),
  filename: text("filename").notNull(),
  status: text("status").notNull().default("pending"),
  uploadedAt: text("uploaded_at").notNull(),
});

// Issues (newspaper editions)
export const issues = sqliteTable("issues", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  publishDate: text("publish_date").notNull(),
  status: text("status").notNull().default("planning"),
  articleCount: integer("article_count").notNull().default(0),
  notes: text("notes"),
});

// Assignments
export const assignments = sqliteTable("assignments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  assigneeId: integer("assignee_id").references(() => staff.id),
  issueId: integer("issue_id").references(() => issues.id),
  category: text("category").notNull(),
  deadline: text("deadline"),
  status: text("status").notNull().default("assigned"),
  createdAt: text("created_at").notNull(),
});

// Chat channels (section chats + all-staff)
export const channels = sqliteTable("channels", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull(), // section, all-staff
  section: text("section"), // null for all-staff, otherwise news/opinion/sports/arts/campus-life
  createdAt: text("created_at").notNull(),
});

// Chat messages
export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  channelId: integer("channel_id").references(() => channels.id).notNull(),
  senderId: integer("sender_id").references(() => staff.id).notNull(),
  content: text("content").notNull(),
  pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
});

// Announcements (editor-in-chief only)
export const announcements = sqliteTable("announcements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  authorId: integer("author_id").references(() => staff.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  priority: text("priority").notNull().default("normal"), // normal, important, urgent
  createdAt: text("created_at").notNull(),
});

// Insert schemas
export const insertStaffSchema = createInsertSchema(staff).omit({ id: true });
export const insertArticleSchema = createInsertSchema(articles).omit({ id: true });
export const insertPhotoSchema = createInsertSchema(photos).omit({ id: true });
export const insertIssueSchema = createInsertSchema(issues).omit({ id: true });
export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true });
export const insertChannelSchema = createInsertSchema(channels).omit({ id: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true });
export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true });

// Types
export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type Staff = typeof staff.$inferSelect;
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articles.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Photo = typeof photos.$inferSelect;
export type InsertIssue = z.infer<typeof insertIssueSchema>;
export type Issue = typeof issues.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Assignment = typeof assignments.$inferSelect;
export type InsertChannel = z.infer<typeof insertChannelSchema>;
export type Channel = typeof channels.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Announcement = typeof announcements.$inferSelect;
