import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles, Check, Loader2 } from "lucide-react";
import { Link, useRoute } from "wouter";
import type { Article, Staff } from "@shared/schema";

const statuses = ["submitted", "in-review", "proofread", "approved", "published"];

export default function ArticleDetail() {
  const { toast } = useToast();
  const [, params] = useRoute("/articles/:id");
  const id = params?.id;

  const { data: article, isLoading } = useQuery<Article>({
    queryKey: ["/api/articles", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/articles/${id}`);
      return res.json();
    },
    enabled: !!id,
  });

  const { data: staffList } = useQuery<Staff[]>({ queryKey: ["/api/staff"] });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("PATCH", `/api/articles/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Article updated" });
    },
  });

  const proofreadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/articles/${id}/proofread`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({ title: "Proofreading complete", description: "Review the change log below" });
    },
  });

  const getStaffName = (staffId: number | null) => {
    if (!staffId || !staffList) return "Unassigned";
    return staffList.find(s => s.id === staffId)?.name ?? "Unknown";
  };

  const editors = staffList?.filter(s => s.role === "editor" || s.role === "editor-in-chief") ?? [];

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <p className="text-muted-foreground">Article not found</p>
        <Link href="/articles">
          <Button variant="ghost" className="mt-4">Back to Articles</Button>
        </Link>
      </div>
    );
  }

  const changeLog = article.changeLog ? JSON.parse(article.changeLog) as Array<{
    original: string;
    corrected: string;
    reason: string;
  }> : [];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/articles">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-xl font-semibold tracking-tight truncate" data-testid="text-article-title">
            {article.title}
          </h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
            <span>By {getStaffName(article.authorId)}</span>
            <span className="capitalize">{article.category.replace("-", " ")}</span>
            <span>{article.wordCount} words</span>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs shrink-0" data-testid="badge-article-status">
          {article.status}
        </Badge>
      </div>

      {/* Status + Editor controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[150px]">
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Status</label>
              <Select
                value={article.status}
                onValueChange={(val) => updateMutation.mutate({ status: val })}
              >
                <SelectTrigger data-testid="select-article-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statuses.map(s => <SelectItem key={s} value={s}>{s.replace("-", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Assigned Editor</label>
              <Select
                value={article.editorId ? String(article.editorId) : "none"}
                onValueChange={(val) => updateMutation.mutate({ editorId: val === "none" ? null : Number(val) })}
              >
                <SelectTrigger data-testid="select-article-editor"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {editors.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2 pt-4">
              <Button
                onClick={() => proofreadMutation.mutate()}
                disabled={proofreadMutation.isPending || article.status === "published"}
                data-testid="button-proofread"
              >
                {proofreadMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Proofreading...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Proofread</>
                )}
              </Button>
              {article.status === "proofread" && (
                <Button
                  variant="secondary"
                  onClick={() => updateMutation.mutate({ status: "approved" })}
                  data-testid="button-approve"
                >
                  <Check className="w-4 h-4 mr-2" /> Approve
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change log */}
      {changeLog.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Proofread Change Log</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {changeLog.map((change, i) => (
                <div key={i} className="text-sm p-3 rounded-md bg-muted/50" data-testid={`text-change-${i}`}>
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-muted-foreground shrink-0 mt-0.5">#{i + 1}</span>
                    <div>
                      <p><span className="line-through text-muted-foreground">{change.original}</span> → <span className="font-medium">{change.corrected}</span></p>
                      <p className="text-xs text-muted-foreground mt-0.5">{change.reason}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Article content */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Article Content</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Textarea
            value={article.proofreadContent || article.content || ""}
            rows={12}
            readOnly
            className="font-serif text-sm leading-relaxed"
            data-testid="textarea-article-content"
          />
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Editor Notes</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Textarea
            defaultValue={article.notes ?? ""}
            placeholder="Add notes for the author or layout team..."
            rows={3}
            onBlur={(e) => {
              if (e.target.value !== (article.notes ?? "")) {
                updateMutation.mutate({ notes: e.target.value });
              }
            }}
            data-testid="textarea-editor-notes"
          />
        </CardContent>
      </Card>
    </div>
  );
}
