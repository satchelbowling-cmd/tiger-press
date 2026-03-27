import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import bcrypt from "bcryptjs";
import { staff, articles, issues, assignments, channels, messages, announcements } from "./shared/schema";

const sqlite = new Database("data.db");
const db = drizzle(sqlite);

const SALT_ROUNDS = 10;

async function seed() {
  const hashedPassword = await bcrypt.hash("tiger2026", SALT_ROUNDS);

  // Seed staff (with hashed passwords)
  const staffData = [
    { name: "Satchel Bowling", email: "newspaper@hsc.edu", password: hashedPassword, role: "editor-in-chief", section: null, avatarInitials: "SB", active: true, bio: "Editor-in-Chief of The Tiger", classYear: "2026", preferredSections: JSON.stringify(["news", "opinion"]), assignmentFrequency: "2-weeks" },
    { name: "James Mitchell", email: "jmitchell@hsc.edu", password: hashedPassword, role: "editor", section: "news", avatarInitials: "JM", active: true, bio: "News section editor", classYear: "2027", preferredSections: JSON.stringify(["news"]), assignmentFrequency: "2-weeks" },
    { name: "William Carter", email: "wcarter@hsc.edu", password: hashedPassword, role: "writer", section: "news", avatarInitials: "WC", active: true, classYear: "2028", preferredSections: JSON.stringify(["news", "life"]), assignmentFrequency: "monthly" },
    { name: "Thomas Reed", email: "treed@hsc.edu", password: hashedPassword, role: "writer", section: "opinion", avatarInitials: "TR", active: true, classYear: "2027", preferredSections: JSON.stringify(["opinion"]), assignmentFrequency: "2-weeks" },
    { name: "Andrew Phillips", email: "aphillips@hsc.edu", password: hashedPassword, role: "photographer", section: "sports", avatarInitials: "AP", active: true, classYear: "2028", preferredSections: JSON.stringify(["other"]), assignmentFrequency: "bimonthly" },
    { name: "Robert Hayes", email: "rhayes@hsc.edu", password: hashedPassword, role: "writer", section: "sports", avatarInitials: "RH", active: true, classYear: "2026", preferredSections: JSON.stringify(["news", "life"]), assignmentFrequency: "monthly" },
    { name: "Daniel Foster", email: "dfoster@hsc.edu", password: hashedPassword, role: "designer", section: "arts", avatarInitials: "DF", active: true, classYear: "2027", preferredSections: JSON.stringify(["other"]), assignmentFrequency: "bimonthly" },
    { name: "Christopher Lane", email: "clane@hsc.edu", password: hashedPassword, role: "editor", section: "campus-life", avatarInitials: "CL", active: true, bio: "Campus Life editor", classYear: "2026", preferredSections: JSON.stringify(["life"]), assignmentFrequency: "2-weeks" },
  ];

  const createdStaff = staffData.map(s => db.insert(staff).values(s).returning().get());

  // Seed channels — match preferred section options
  const channelData = [
    { name: "All Staff", type: "all-staff", section: null, createdAt: "2026-01-15T00:00:00Z" },
    { name: "News", type: "section", section: "news", createdAt: "2026-01-15T00:00:00Z" },
    { name: "Life", type: "section", section: "life", createdAt: "2026-01-15T00:00:00Z" },
    { name: "Opinion", type: "section", section: "opinion", createdAt: "2026-01-15T00:00:00Z" },
    { name: "Sports", type: "section", section: "sports", createdAt: "2026-01-15T00:00:00Z" },
    { name: "Other", type: "section", section: "other", createdAt: "2026-01-15T00:00:00Z" },
  ];
  const createdChannels = channelData.map(c => db.insert(channels).values(c).returning().get());

  // Seed issues
  const issueData = [
    { title: "Vol. 142, Issue 9", publishDate: "2026-04-01", status: "in-progress", articleCount: 6, notes: "Spring edition — Big Event coverage" },
    { title: "Vol. 142, Issue 10", publishDate: "2026-04-15", status: "planning", articleCount: 0, notes: "Greek Week special" },
  ];
  const createdIssues = issueData.map(i => db.insert(issues).values(i).returning().get());

  // Seed articles
  const articleData = [
    { title: "Hampden-Sydney's Big Event Grows in Reach and Impact", authorId: createdStaff[2].id, editorId: createdStaff[1].id, status: "approved", category: "news", content: "Hampden-Sydney College's annual Big Event continued its tradition of community service this past Saturday, with over 200 students volunteering at 30 different sites across Prince Edward County.", wordCount: 30, submittedAt: "2026-03-18T14:30:00Z", issueDate: "2026-04-01", notes: "Good to go for print", priority: "normal", fileType: "paste" },
    { title: "On This Day in History — 19 March", authorId: createdStaff[3].id, editorId: null, status: "proofread", category: "opinion", content: "On this day in history, March 19, we look back at the pivotal events that shaped the world.", proofreadContent: "On this day in history, March 19, we look back at the pivotal events that shaped the world.\n\n[Proofread version — corrections applied]", changeLog: JSON.stringify([{ original: "Hapsburg", corrected: "Habsburg", reason: "Spelling" }]), wordCount: 18, submittedAt: "2026-03-17T10:15:00Z", issueDate: "2026-04-01", priority: "normal", fileType: "paste" },
    { title: "Tiger Baseball Opens Conference Play with Sweep", authorId: createdStaff[5].id, editorId: null, status: "submitted", category: "sports", content: "The Hampden-Sydney Tigers baseball team opened ODAC conference play with a convincing three-game sweep of rival Randolph-Macon this weekend.", wordCount: 22, submittedAt: "2026-03-25T16:00:00Z", priority: "high", fileType: "docx", originalFilename: "baseball_sweep.docx", tags: JSON.stringify(["sports", "ODAC", "baseball"]) },
    { title: "Student Senate Approves Funding for New Club Spaces", authorId: createdStaff[2].id, editorId: createdStaff[7].id, status: "in-review", category: "news", content: "The Student Senate voted unanimously Tuesday night to allocate $15,000 from the student activities fund for renovations to the basement of Crawley Forum.", wordCount: 26, submittedAt: "2026-03-24T20:30:00Z", issueDate: "2026-04-01", priority: "normal", fileType: "paste" },
    { title: "Review: Spring Theatre Production of 'Our Town'", authorId: createdStaff[3].id, editorId: null, status: "submitted", category: "arts", content: "The Hampden-Sydney Players delivered a thoughtful and moving production of Thornton Wilder's 'Our Town' last weekend in Johns Auditorium.", wordCount: 22, submittedAt: "2026-03-26T09:00:00Z", priority: "normal", fileType: "paste" },
  ];
  articleData.forEach(a => db.insert(articles).values(a).returning().get());

  // Seed assignments
  const assignmentData = [
    { title: "Cover Greek Week Events", description: "Write up coverage of Greek Week philanthropy events", assigneeId: createdStaff[2].id, issueId: createdIssues[1].id, category: "news", deadline: "2026-04-10", status: "assigned", createdAt: "2026-03-25T12:00:00Z" },
    { title: "Interview New Dean of Students", description: "Conduct interview with the newly appointed Dean", assigneeId: createdStaff[5].id, issueId: createdIssues[0].id, category: "news", deadline: "2026-03-28", status: "in-progress", createdAt: "2026-03-20T09:00:00Z" },
    { title: "Greek Week Photo Essay", description: "Capture photos from all major Greek Week events", assigneeId: createdStaff[4].id, issueId: createdIssues[1].id, category: "campus-life", deadline: "2026-04-12", status: "assigned", createdAt: "2026-03-25T12:30:00Z" },
    { title: "Opinion: Campus Dining Changes", description: "Editorial on dining hall hours changes", assigneeId: createdStaff[3].id, issueId: createdIssues[0].id, category: "opinion", deadline: "2026-03-29", status: "submitted", createdAt: "2026-03-18T14:00:00Z" },
  ];
  assignmentData.forEach(a => db.insert(assignments).values(a).returning().get());

  // Seed messages
  const msgData = [
    { channelId: createdChannels[0].id, senderId: createdStaff[0].id, content: "Welcome to Tiger Press! This is the all-staff channel. Please check your section channels for specific updates.", pinned: true, createdAt: "2026-03-15T10:00:00Z" },
    { channelId: createdChannels[0].id, senderId: createdStaff[0].id, content: "Reminder: Issue 9 deadline is March 28. All articles must be submitted by then.", pinned: false, createdAt: "2026-03-20T14:00:00Z" },
    { channelId: createdChannels[0].id, senderId: createdStaff[1].id, content: "News section is looking good. We have 3 strong pieces lined up.", pinned: false, createdAt: "2026-03-22T09:30:00Z" },
    { channelId: createdChannels[1].id, senderId: createdStaff[1].id, content: "News team — let's make sure we have quotes from the Dean for the Senate funding story.", pinned: false, createdAt: "2026-03-24T11:00:00Z" },
    { channelId: createdChannels[1].id, senderId: createdStaff[2].id, content: "I'll reach out today. Should have something by tomorrow.", pinned: false, createdAt: "2026-03-24T11:15:00Z" },
    { channelId: createdChannels[3].id, senderId: createdStaff[5].id, content: "Baseball sweep article is submitted! Great game on Saturday.", pinned: false, createdAt: "2026-03-25T16:30:00Z" },
    { channelId: createdChannels[3].id, senderId: createdStaff[4].id, content: "Got some great action shots from the game. Will upload tonight.", pinned: false, createdAt: "2026-03-25T17:00:00Z" },
  ];
  msgData.forEach(m => db.insert(messages).values(m).returning().get());

  // Seed announcements
  const announcementData = [
    { authorId: createdStaff[0].id, title: "Issue 9 Deadline Extended", content: "The deadline for Issue 9 has been extended to April 3rd. Please use the extra time to polish your articles.", priority: "important", createdAt: "2026-03-25T10:00:00Z" },
    { authorId: createdStaff[0].id, title: "All-Staff Meeting Friday 5pm", content: "Mandatory all-staff meeting this Friday at 5pm in the newsroom. We'll discuss Issue 10 planning and Greek Week coverage assignments.", priority: "normal", createdAt: "2026-03-24T08:00:00Z" },
  ];
  announcementData.forEach(a => db.insert(announcements).values(a).returning().get());

  console.log("Seed complete!");
  console.log(`  ${staffData.length} staff members (passwords hashed with bcrypt)`);
  console.log(`  ${channelData.length} channels`);
  console.log(`  ${issueData.length} issues`);
  console.log(`  ${articleData.length} articles`);
  console.log(`  ${assignmentData.length} assignments`);
  console.log(`  ${msgData.length} messages`);
  console.log(`  ${announcementData.length} announcements`);
  console.log("\nAdmin login: newspaper@hsc.edu / tiger2026");
  console.log("All staff: same password tiger2026");
}

seed();
