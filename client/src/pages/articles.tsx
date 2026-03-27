import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { Search, FileText, Trash2, ChevronDown, ChevronRight, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import type { Article, Staff } from "@shared/schema";

const categories = ["news", "opinion", "sports", "arts", "campus-life"];
const statuses = ["submitted", "in-review", "proofread", "approved", "published"];

export default function Articles() {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showPublished, setShowPublished] = useState(false);

  const { data: articles, isLoading } = useQuery<Article[]>({ queryKey: ["/api/articles"] });
  const { data: staffList } = useQuery<Staff[]>({ queryKey: ["/api/staff"] });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/articles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Article deleted" });
    },
  });

  const filtered = articles?.filter(a => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    const matchCategory = filterCategory === "all" || a.category === filterCategory;
    return matchSearch && matchStatus && matchCategory;
  }) ?? [];

  const activeArticles = filtered.filter(a => a.status !== "published");
  const publishedArticles = filtered.filter(a => a.status === "published");

  const getStaffName = (id: number | null) => {
    if (!id || !staffList) return "Unassigned";
    return staffList.find(s => s.id === id)?.name ?? "Unknown";
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "submitted": return "secondary" as const;
      case "in-review": return "default" as const;
      case "proofread": return "outline" as const;
      case "approved": return "default" as const;
      case "published": return "default" as const;
      default: return "secondary" as const;
    }
  };

  const renderArticle = (article: Article) => (
    <div key={article.id} className="flex items-center gap-2">
      <Link href={`/articles/${article.id}`} className="flex-1" data-testid={`link-article-${article.id}`}>
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
      {isAdmin && (
        <Button
          variant="ghost" size="icon"
          onClick={(e) => { e.preventDefault(); deleteMutation.mutate(article.id); }}
          className="shrink-0 text-muted-foreground hover:text-destructive"
          data-testid={`button-delete-article-${article.id}`}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-xl font-semibold tracking-tight" data-testid="text-page-title">Articles</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage article submissions and editorial workflow</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9" data-testid="input-search-articles"
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

      {/* Active articles */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : activeArticles.length === 0 && publishedArticles.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No articles found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {activeArticles.map(renderArticle)}
          </div>

          {/* Published articles — collapsed by default */}
          {publishedArticles.length > 0 && (
            <Collapsible open={showPublished} onOpenChange={setShowPublished}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground" data-testid="button-toggle-published">
                  {showPublished ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Published ({publishedArticles.length})</span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                {publishedArticles.map(renderArticle)}
              </CollapsibleContent>
            </Collapsible>
          )}
        </>
      )}
    </div>
  );
}
