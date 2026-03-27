import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, desc } from "drizzle-orm";
import {
  staff, articles, issues, assignments, channels, messages, announcements,
  type Staff, type InsertStaff,
  type Article, type InsertArticle,
  type Issue, type InsertIssue,
  type Assignment, type InsertAssignment,
  type Channel, type InsertChannel,
  type Message, type InsertMessage,
  type Announcement, type InsertAnnouncement,
} from "@shared/schema";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");
export const db = drizzle(sqlite);

export interface IStorage {
  getStaff(): Staff[];
  getStaffById(id: number): Staff | undefined;
  getStaffByEmail(email: string): Staff | undefined;
  createStaff(data: InsertStaff): Staff;
  updateStaff(id: number, data: Partial<InsertStaff>): Staff | undefined;
  getArticles(): Article[];
  getArticleById(id: number): Article | undefined;
  createArticle(data: InsertArticle): Article;
  updateArticle(id: number, data: Partial<InsertArticle>): Article | undefined;
  deleteArticle(id: number): void;
  getIssues(): Issue[];
  getIssueById(id: number): Issue | undefined;
  createIssue(data: InsertIssue): Issue;
  updateIssue(id: number, data: Partial<InsertIssue>): Issue | undefined;
  deleteIssue(id: number): void;
  getAssignments(): Assignment[];
  createAssignment(data: InsertAssignment): Assignment;
  updateAssignment(id: number, data: Partial<InsertAssignment>): Assignment | undefined;
  deleteAssignment(id: number): void;
  getChannels(): Channel[];
  getChannelById(id: number): Channel | undefined;
  createChannel(data: InsertChannel): Channel;
  getMessagesByChannel(channelId: number): Message[];
  createMessage(data: InsertMessage): Message;
  updateMessage(id: number, data: Partial<InsertMessage>): Message | undefined;
  getAnnouncements(): Announcement[];
  createAnnouncement(data: InsertAnnouncement): Announcement;
  deleteAnnouncement(id: number): void;
  getDashboardStats(): Record<string, number>;
}

export class DatabaseStorage implements IStorage {
  getStaff(): Staff[] { return db.select().from(staff).all(); }
  getStaffById(id: number): Staff | undefined { return db.select().from(staff).where(eq(staff.id, id)).get(); }
  getStaffByEmail(email: string): Staff | undefined { return db.select().from(staff).where(eq(staff.email, email)).get(); }
  createStaff(data: InsertStaff): Staff { return db.insert(staff).values(data).returning().get(); }
  updateStaff(id: number, data: Partial<InsertStaff>): Staff | undefined { return db.update(staff).set(data).where(eq(staff.id, id)).returning().get(); }

  getArticles(): Article[] { return db.select().from(articles).orderBy(desc(articles.submittedAt)).all(); }
  getArticleById(id: number): Article | undefined { return db.select().from(articles).where(eq(articles.id, id)).get(); }
  createArticle(data: InsertArticle): Article { return db.insert(articles).values(data).returning().get(); }
  updateArticle(id: number, data: Partial<InsertArticle>): Article | undefined { return db.update(articles).set(data).where(eq(articles.id, id)).returning().get(); }
  deleteArticle(id: number): void { db.delete(articles).where(eq(articles.id, id)).run(); }

  getIssues(): Issue[] { return db.select().from(issues).orderBy(desc(issues.publishDate)).all(); }
  getIssueById(id: number): Issue | undefined { return db.select().from(issues).where(eq(issues.id, id)).get(); }
  createIssue(data: InsertIssue): Issue { return db.insert(issues).values(data).returning().get(); }
  updateIssue(id: number, data: Partial<InsertIssue>): Issue | undefined { return db.update(issues).set(data).where(eq(issues.id, id)).returning().get(); }
  deleteIssue(id: number): void { db.delete(issues).where(eq(issues.id, id)).run(); }

  getAssignments(): Assignment[] { return db.select().from(assignments).orderBy(desc(assignments.createdAt)).all(); }
  createAssignment(data: InsertAssignment): Assignment { return db.insert(assignments).values(data).returning().get(); }
  updateAssignment(id: number, data: Partial<InsertAssignment>): Assignment | undefined { return db.update(assignments).set(data).where(eq(assignments.id, id)).returning().get(); }
  deleteAssignment(id: number): void { db.delete(assignments).where(eq(assignments.id, id)).run(); }

  getChannels(): Channel[] { return db.select().from(channels).all(); }
  getChannelById(id: number): Channel | undefined { return db.select().from(channels).where(eq(channels.id, id)).get(); }
  createChannel(data: InsertChannel): Channel { return db.insert(channels).values(data).returning().get(); }

  getMessagesByChannel(channelId: number): Message[] { return db.select().from(messages).where(eq(messages.channelId, channelId)).orderBy(messages.createdAt).all(); }
  createMessage(data: InsertMessage): Message { return db.insert(messages).values(data).returning().get(); }
  updateMessage(id: number, data: Partial<InsertMessage>): Message | undefined { return db.update(messages).set(data).where(eq(messages.id, id)).returning().get(); }

  getAnnouncements(): Announcement[] { return db.select().from(announcements).orderBy(desc(announcements.createdAt)).all(); }
  createAnnouncement(data: InsertAnnouncement): Announcement { return db.insert(announcements).values(data).returning().get(); }
  deleteAnnouncement(id: number): void { db.delete(announcements).where(eq(announcements.id, id)).run(); }

  getDashboardStats() {
    const allArticles = db.select().from(articles).all();
    const allStaff = db.select().from(staff).where(eq(staff.active, true)).all();
    const allAssignments = db.select().from(assignments).all();
    const allIssues = db.select().from(issues).all();
    return {
      totalArticles: allArticles.length,
      submittedArticles: allArticles.filter(a => a.status === "submitted").length,
      inReviewArticles: allArticles.filter(a => a.status === "in-review").length,
      approvedArticles: allArticles.filter(a => a.status === "approved").length,
      publishedArticles: allArticles.filter(a => a.status === "published").length,
      totalStaff: allStaff.length,
      activeAssignments: allAssignments.filter(a => a.status !== "complete").length,
      upcomingIssues: allIssues.filter(i => i.status !== "published").length,
    };
  }
}

export const storage = new DatabaseStorage();
