import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { FileText, Users, TrendingUp, Clock } from "lucide-react";
import type { Article, Staff, Issue, Assignment } from "@shared/schema";

const COLORS = ["hsl(352, 58%, 34%)", "hsl(40, 63%, 47%)", "hsl(150, 40%, 38%)", "hsl(220, 40%, 45%)", "hsl(280, 35%, 50%)"];

export default function AnalyticsPage() {
  const { data: articles } = useQuery<Article[]>({ queryKey: ["/api/articles"] });
  const { data: staffList } = useQuery<Staff[]>({ queryKey: ["/api/staff"] });
  const { data: issues } = useQuery<Issue[]>({ queryKey: ["/api/issues"] });
  const { data: assignments } = useQuery<Assignment[]>({ queryKey: ["/api/assignments"] });

  // Articles per status
  const statusCounts = ["submitted", "in-review", "proofread", "approved", "published"].map(status => ({
    name: status.replace("-", " "),
    count: articles?.filter(a => a.status === status).length ?? 0,
  }));

  // Articles per category
  const categoryCounts = ["news", "opinion", "sports", "arts", "campus-life"].map(cat => ({
    name: cat.replace("-", " "),
    count: articles?.filter(a => a.category === cat).length ?? 0,
  })).filter(c => c.count > 0);

  // Articles per writer (top 8)
  const writerCounts: { name: string; count: number }[] = [];
  if (articles && staffList) {
    const countMap = new Map<number, number>();
    articles.forEach(a => {
      if (a.authorId) countMap.set(a.authorId, (countMap.get(a.authorId) || 0) + 1);
    });
    countMap.forEach((count, id) => {
      const s = staffList.find(s => s.id === id);
      if (s) writerCounts.push({ name: s.name.split(" ")[0], count });
    });
    writerCounts.sort((a, b) => b.count - a.count);
  }

  // Average turnaround (submitted → approved) in days
  const turnaroundDays: number[] = [];
  articles?.forEach(a => {
    if (a.status === "approved" || a.status === "published") {
      const submitted = new Date(a.submittedAt).getTime();
      const now = Date.now();
      const days = (now - submitted) / (1000 * 60 * 60 * 24);
      if (days > 0 && days < 365) turnaroundDays.push(days);
    }
  });
  const avgTurnaround = turnaroundDays.length > 0
    ? (turnaroundDays.reduce((s, d) => s + d, 0) / turnaroundDays.length).toFixed(1)
    : "—";

  // Total word count
  const totalWords = articles?.reduce((sum, a) => sum + (a.wordCount || 0), 0) ?? 0;

  // Assignment completion rate
  const totalAssignments = assignments?.length ?? 0;
  const completedAssignments = assignments?.filter(a => a.status === "complete").length ?? 0;
  const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-xl font-semibold tracking-tight" data-testid="text-page-title">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Newspaper performance at a glance</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Articles</span>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-semibold">{articles?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{totalWords.toLocaleString()} total words</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Avg Turnaround</span>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-semibold">{avgTurnaround}</div>
            <p className="text-xs text-muted-foreground mt-1">days to approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Active Writers</span>
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-semibold">{writerCounts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">with submissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Completion Rate</span>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-semibold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">{completedAssignments}/{totalAssignments} assignments</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Articles by status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Articles by Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusCounts} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(352, 58%, 34%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Articles by category */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Articles by Section</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[220px] flex items-center justify-center">
              {categoryCounts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryCounts}
                      cx="50%" cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      nameKey="name"
                      label={({ name, count }) => `${name} (${count})`}
                    >
                      {categoryCounts.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Articles per writer */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Articles per Writer</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {writerCounts.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={writerCounts.slice(0, 8)} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(40, 63%, 47%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No data yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
