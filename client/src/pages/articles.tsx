import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, FileText } from "lucide-react";
import { Link } from "wouter";
import type { Article, Staff } from "@shared/schema";

const categories = ["news", "opinion", "sports", "arts", "campus-life"];
const statuses = ["submitted", "in-review", "proofread", "approved", "published"];

export default function Articles() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: articles, isLoading } = useQuery<Article[]>({ queryKey: ["/api/articles"] });
  const { data: staffList } = useQuery<Staff[]>({ queryKey: ["/api/staff"] });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/articles", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setDialogOpen(false);
      toast({ title: "Article created" });
    },
  });

  const writers = staffList?.filter(s => s.role === "writer" || s.role === "editor-in-chief" || s.role === "editor") ?? [];

  const filtered = articles?.filter(a => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    const matchCategory = filterCategory === "all" || a.category === filterCategory;
    return matchSearch && matchStatus && matchCategory;
  }) ?? [];

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

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const content = fd.get("content") as string;
    createMutation.mutate({
      title: fd.get("title") as string,
      authorId: fd.get("authorId") ? Number(fd.get("authorId")) : null,
      category: fd.get("category") as string,
      content,
      wordCount: content.split(/\s+/).filter(Boolean).length,
      submittedAt: new Date().toISOString(),
      status: "submitted",
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-xl font-semibold tracking-tight" data-testid="text-page-title">Articles</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage article submissions and editorial workflow</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-article">
              <Plus className="w-4 h-4 mr-2" /> New Article
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Submit New Article</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required placeholder="Article headline" data-testid="input-article-title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" defaultValue="news">
                    <SelectTrigger data-testid="select-article-category"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c} value={c}>{c.replace("-", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="authorId">Author</Label>
                  <Select name="authorId">
                    <SelectTrigger data-testid="select-article-author"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {writers.map(w => <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea id="content" name="content" rows={6} placeholder="Paste article text here..." data-testid="textarea-article-content" />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-article">
                {createMutation.isPending ? "Submitting..." : "Submit Article"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-articles"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]" data-testid="select-filter-status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statuses.map(s => <SelectItem key={s} value={s}>{s.replace("-", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[140px]" data-testid="select-filter-category"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c.replace("-", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Articles list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No articles found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((article) => (
            <Link key={article.id} href={`/articles/${article.id}`} data-testid={`link-article-${article.id}`}>
              <Card className="cursor-pointer hover-elevate transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-medium truncate">{article.title}</h3>
                        <Badge variant={statusColor(article.status)} className="text-xs shrink-0">
                          {article.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span>{getStaffName(article.authorId)}</span>
                        <span className="capitalize">{article.category.replace("-", " ")}</span>
                        <span>{article.wordCount} words</span>
                        <span>{new Date(article.submittedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
