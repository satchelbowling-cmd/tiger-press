import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, CheckCircle, CalendarDays } from "lucide-react";
import { Link } from "wouter";
import type { Article, Assignment, Issue, Staff } from "@shared/schema";

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyColor(days: number): string {
  if (days < 0) return "text-destructive";
  if (days <= 2) return "text-red-500";
  if (days <= 5) return "text-amber-500";
  return "text-muted-foreground";
}

function urgencyBadge(days: number) {
  if (days < 0) return <Badge variant="destructive" className="text-xs">Overdue</Badge>;
  if (days === 0) return <Badge variant="destructive" className="text-xs">Due today</Badge>;
  if (days <= 2) return <Badge className="text-xs bg-red-500 text-white">Due in {days}d</Badge>;
  if (days <= 5) return <Badge className="text-xs bg-amber-500 text-white">Due in {days}d</Badge>;
  return <Badge variant="secondary" className="text-xs">{days} days</Badge>;
}

export default function DeadlinesPage() {
  const { user } = useAuth();
  const { data: articles } = useQuery<Article[]>({ queryKey: ["/api/articles"] });
  const { data: assignments } = useQuery<Assignment[]>({ queryKey: ["/api/assignments"] });
  const { data: issues } = useQuery<Issue[]>({ queryKey: ["/api/issues"] });
  const { data: staffList } = useQuery<Staff[]>({ queryKey: ["/api/staff"] });

  const getStaffName = (id: number | null) => {
    if (!id || !staffList) return "Unassigned";
    return staffList.find(s => s.id === id)?.name ?? "Unknown";
  };

  // Collect all deadlines
  type DeadlineItem = {
    id: string;
    title: string;
    type: "article" | "assignment" | "issue";
    deadline: string;
    assignee: string;
    status: string;
    days: number;
    linkUrl?: string;
  };

  const deadlines: DeadlineItem[] = [];

  articles?.forEach(a => {
    if (a.deadline && a.status !== "published") {
      deadlines.push({
        id: `article-${a.id}`,
        title: a.title,
        type: "article",
        deadline: a.deadline,
        assignee: getStaffName(a.authorId),
        status: a.status,
        days: daysUntil(a.deadline),
        linkUrl: `/articles/${a.id}`,
      });
    }
  });

  assignments?.forEach(a => {
    if (a.deadline && a.status !== "complete") {
      deadlines.push({
        id: `assign-${a.id}`,
        title: a.title,
        type: "assignment",
        deadline: a.deadline,
        assignee: getStaffName(a.assigneeId),
        status: a.status,
        days: daysUntil(a.deadline),
      });
    }
  });

  issues?.forEach(i => {
    if (i.status !== "published") {
      deadlines.push({
        id: `issue-${i.id}`,
        title: i.title,
        type: "issue",
        deadline: i.publishDate,
        assignee: "",
        status: i.status,
        days: daysUntil(i.publishDate),
      });
    }
  });

  // Sort by deadline (most urgent first)
  deadlines.sort((a, b) => a.days - b.days);

  const overdue = deadlines.filter(d => d.days < 0);
  const thisWeek = deadlines.filter(d => d.days >= 0 && d.days <= 7);
  const later = deadlines.filter(d => d.days > 7);

  const renderItem = (item: DeadlineItem) => (
    <div key={item.id} className="flex items-center justify-between gap-3 p-3 rounded-md hover-elevate" data-testid={`deadline-${item.id}`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`shrink-0 ${urgencyColor(item.days)}`}>
          {item.days < 0 ? <AlertTriangle className="w-4 h-4" /> :
           item.days <= 2 ? <Clock className="w-4 h-4" /> :
           <CalendarDays className="w-4 h-4" />}
        </div>
        <div className="min-w-0">
          {item.linkUrl ? (
            <Link href={item.linkUrl} className="text-sm font-medium truncate hover:underline block">{item.title}</Link>
          ) : (
            <p className="text-sm font-medium truncate">{item.title}</p>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
            <Badge variant="outline" className="text-xs capitalize">{item.type}</Badge>
            {item.assignee && <span>{item.assignee}</span>}
            <span>{new Date(item.deadline).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="secondary" className="text-xs capitalize">{item.status}</Badge>
        {urgencyBadge(item.days)}
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-xl font-semibold tracking-tight" data-testid="text-page-title">Deadlines</h1>
        <p className="text-sm text-muted-foreground mt-1">All upcoming deadlines across articles, assignments, and issues</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className={overdue.length > 0 ? "border-destructive/50" : ""}>
          <CardContent className="p-4 text-center">
            <AlertTriangle className={`w-5 h-5 mx-auto mb-1 ${overdue.length > 0 ? "text-destructive" : "text-muted-foreground"}`} />
            <div className="text-2xl font-semibold">{overdue.length}</div>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-5 h-5 mx-auto mb-1 text-amber-500" />
            <div className="text-2xl font-semibold">{thisWeek.length}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CalendarDays className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-semibold">{later.length}</div>
            <p className="text-xs text-muted-foreground">Upcoming</p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue */}
      {overdue.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-destructive">Overdue</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-1">{overdue.map(renderItem)}</CardContent>
        </Card>
      )}

      {/* This week */}
      {thisWeek.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">This Week</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-1">{thisWeek.map(renderItem)}</CardContent>
        </Card>
      )}

      {/* Later */}
      {later.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Upcoming</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-1">{later.map(renderItem)}</CardContent>
        </Card>
      )}

      {deadlines.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
