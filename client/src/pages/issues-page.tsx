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
import { useToast } from "@/hooks/use-toast";
import { Plus, Calendar } from "lucide-react";
import type { Issue } from "@shared/schema";

const issueStatuses = ["planning", "in-progress", "review", "published"];

export default function IssuesPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: issues, isLoading } = useQuery<Issue[]>({ queryKey: ["/api/issues"] });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/issues", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setDialogOpen(false);
      toast({ title: "Issue created" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      const res = await apiRequest("PATCH", `/api/issues/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      title: fd.get("title") as string,
      publishDate: fd.get("publishDate") as string,
      notes: fd.get("notes") as string || null,
      status: "planning",
      articleCount: 0,
    });
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "planning": return "secondary";
      case "in-progress": return "default";
      case "review": return "outline";
      case "published": return "default";
      default: return "secondary";
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-xl font-semibold tracking-tight" data-testid="text-page-title">Issues</h1>
          <p className="text-sm text-muted-foreground mt-1">Plan and track newspaper editions</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-issue"><Plus className="w-4 h-4 mr-2" /> New Issue</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New Issue</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="title">Issue Title</Label>
                <Input id="title" name="title" required placeholder="Vol. 15, Issue 8" data-testid="input-issue-title" />
              </div>
              <div>
                <Label htmlFor="publishDate">Publish Date</Label>
                <Input id="publishDate" name="publishDate" type="date" required data-testid="input-issue-date" />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={2} placeholder="Special theme, deadlines, etc." data-testid="textarea-issue-notes" />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-issue">
                {createMutation.isPending ? "Creating..." : "Create Issue"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Card key={i}><CardContent className="p-4 h-20" /></Card>)}
        </div>
      ) : !issues?.length ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No issues created yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => (
            <Card key={issue.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-medium" data-testid={`text-issue-title-${issue.id}`}>{issue.title}</h3>
                      <Badge variant={statusColor(issue.status)} className="text-xs">{issue.status}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span>Publish: {new Date(issue.publishDate).toLocaleDateString()}</span>
                      <span>{issue.articleCount} articles</span>
                      {issue.notes && <span>· {issue.notes}</span>}
                    </div>
                  </div>
                  <Select
                    value={issue.status}
                    onValueChange={(val) => updateMutation.mutate({ id: issue.id, data: { status: val } })}
                  >
                    <SelectTrigger className="w-[130px]" data-testid={`select-issue-status-${issue.id}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {issueStatuses.map(s => <SelectItem key={s} value={s}>{s.replace("-", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
