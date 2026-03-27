import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Users, ClipboardList, Calendar, ArrowRight, Bell, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import type { Article, Assignment, Staff, Announcement } from "@shared/schema";

export default function Dashboard() {
  const { user, isAdmin, isEditor } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<Record<string, number>>({ queryKey: ["/api/dashboard"] });
  const { data: articles } = useQuery<Article[]>({ queryKey: ["/api/articles"] });
  const { data: assignments } = useQuery<Assignment[]>({ queryKey: ["/api/assignments"] });
  const { data: staffList } = useQuery<Staff[]>({ queryKey: ["/api/staff"] });
  const { data: announcements } = useQuery<Announcement[]>({ queryKey: ["/api/announcements"] });

  const isWriter = !isAdmin && !isEditor;

  // Writer view: filter to only their articles/assignments
  const myArticles = isWriter ? articles?.filter(a => a.authorId === user?.id) : articles;
  const myAssignments = isWriter ? assignments?.filter(a => a.assigneeId === user?.id) : assignments;

  const recentArticles = (myArticles ?? []).slice(0, 5);
  const activeAssignments = (myAssignments ?? []).filter(a => a.status !== "complete").slice(0, 5);
  const recentAnnouncements = (announcements ?? []).slice(0, 3);

  const getStaffName = (id: number | null) => {
    if (!id || !staffList) return "Unassigned";
    return staffList.find(s => s.id === id)?.name ?? "Unknown";
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "submitted": return "secondary";
      case "in-review": return "default";
      case "proofread": return "outline";
      case "approved": return "default";
      case "published": return "default";
      default: return "secondary";
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-xl font-semibold tracking-tight" data-testid="text-page-title">
          Welcome back, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isWriter ? "Your articles and assignments" : "Overview of the latest newspaper activity"}
        </p>
      </div>

      {/* Announcements */}
      {recentAnnouncements.length > 0 && (
        <div className="space-y-2">
          {recentAnnouncements.map(a => (
            <Card key={a.id} className={a.priority === "urgent" ? "border-destructive/50 bg-destructive/5" : a.priority === "important" ? "border-amber-400/30 bg-amber-50/30 dark:bg-amber-950/10" : ""}>
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  {a.priority === "urgent" ? <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" /> : <Bell className="w-4 h-4 text-primary mt-0.5 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{a.title}</span>
                      {a.priority === "urgent" && <Badge variant="destructive" className="text-xs">Urgent</Badge>}
                      {a.priority === "important" && <Badge className="text-xs bg-amber-500/90 text-white">Important</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">— {getStaffName(a.authorId)} · {new Date(a.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats — full view for editors, simplified for writers */}
      <div className={`grid gap-4 ${isWriter ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-4"}`}>
        {statsLoading ? (
          Array.from({ length: isWriter ? 2 : 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-4 w-20 mb-2" /><Skeleton className="h-8 w-12" /></CardContent></Card>
          ))
        ) : isWriter ? (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">My Articles</span>
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-semibold">{myArticles?.length ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">My Assignments</span>
                  <ClipboardList className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-semibold">{activeAssignments.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Active tasks</p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card><CardContent className="p-4"><div className="flex items-center justify-between gap-1 mb-2"><span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Articles</span><FileText className="w-4 h-4 text-muted-foreground" /></div><div className="text-2xl font-semibold" data-testid="text-stat-articles">{stats?.totalArticles ?? 0}</div><p className="text-xs text-muted-foreground mt-1">{stats?.submittedArticles ?? 0} pending review</p></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center justify-between gap-1 mb-2"><span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Staff</span><Users className="w-4 h-4 text-muted-foreground" /></div><div className="text-2xl font-semibold" data-testid="text-stat-staff">{stats?.totalStaff ?? 0}</div><p className="text-xs text-muted-foreground mt-1">Active members</p></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center justify-between gap-1 mb-2"><span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Assignments</span><ClipboardList className="w-4 h-4 text-muted-foreground" /></div><div className="text-2xl font-semibold" data-testid="text-stat-assignments">{stats?.activeAssignments ?? 0}</div><p className="text-xs text-muted-foreground mt-1">Active tasks</p></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center justify-between gap-1 mb-2"><span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Issues</span><Calendar className="w-4 h-4 text-muted-foreground" /></div><div className="text-2xl font-semibold" data-testid="text-stat-issues">{stats?.upcomingIssues ?? 0}</div><p className="text-xs text-muted-foreground mt-1">Upcoming editions</p></CardContent></Card>
          </>
        )}
      </div>

      {/* Articles with word count progress */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold">{isWriter ? "My Articles" : "Recent Articles"}</CardTitle>
              <Link href="/articles" className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors" data-testid="link-view-all-articles">View all <ArrowRight className="w-3 h-3" /></Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {recentArticles.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No articles yet</p>
            ) : (
              <div className="space-y-3">
                {recentArticles.map((article) => (
                  <Link key={article.id} href={`/articles/${article.id}`} className="block p-2 rounded-md hover-elevate cursor-pointer" data-testid={`link-article-${article.id}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{article.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{getStaffName(article.authorId)} · {article.category}</p>
                      </div>
                      <Badge variant={statusColor(article.status)} className="shrink-0 text-xs">{article.status}</Badge>
                    </div>
                    {article.targetWordCount && article.targetWordCount > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>{article.wordCount} / {article.targetWordCount} words</span>
                          <span>{Math.min(100, Math.round((article.wordCount / article.targetWordCount) * 100))}%</span>
                        </div>
                        <Progress value={Math.min(100, (article.wordCount / article.targetWordCount) * 100)} className="h-1.5" />
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold">{isWriter ? "My Assignments" : "Active Assignments"}</CardTitle>
              <Link href="/assignments" className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors" data-testid="link-view-all-assignments">View all <ArrowRight className="w-3 h-3" /></Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {activeAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No active assignments</p>
            ) : (
              <div className="space-y-3">
                {activeAssignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-start justify-between gap-3 p-2 rounded-md" data-testid={`card-assignment-${assignment.id}`}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{assignment.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{getStaffName(assignment.assigneeId)} · Due {assignment.deadline ?? "TBD"}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-xs">{assignment.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
