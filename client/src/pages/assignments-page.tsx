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
import { Plus, ClipboardList, Trash2 } from "lucide-react";
import type { Assignment, Staff, Issue } from "@shared/schema";

const categories = ["news", "opinion", "sports", "arts", "campus-life"];
const assignmentStatuses = ["assigned", "in-progress", "submitted", "complete"];

export default function AssignmentsPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: assignments, isLoading } = useQuery<Assignment[]>({ queryKey: ["/api/assignments"] });
  const { data: staffList } = useQuery<Staff[]>({ queryKey: ["/api/staff"] });
  const { data: issues } = useQuery<Issue[]>({ queryKey: ["/api/issues"] });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/assignments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setDialogOpen(false);
      toast({ title: "Assignment created" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      const res = await apiRequest("PATCH", `/api/assignments/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/assignments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Assignment removed" });
    },
  });

  const getStaffName = (id: number | null) => {
    if (!id || !staffList) return "Unassigned";
    return staffList.find(s => s.id === id)?.name ?? "Unknown";
  };

  const getIssueName = (id: number | null) => {
    if (!id || !issues) return "";
    return issues.find(i => i.id === id)?.title ?? "";
  };

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      title: fd.get("title") as string,
      description: fd.get("description") as string || null,
      assigneeId: fd.get("assigneeId") ? Number(fd.get("assigneeId")) : null,
      issueId: fd.get("issueId") ? Number(fd.get("issueId")) : null,
      category: fd.get("category") as string,
      deadline: fd.get("deadline") as string || null,
      status: "assigned",
      createdAt: new Date().toISOString(),
    });
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "assigned": return "secondary";
      case "in-progress": return "default";
      case "submitted": return "outline";
      case "complete": return "default";
      default: return "secondary";
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-xl font-semibold tracking-tight" data-testid="text-page-title">Assignments</h1>
          <p className="text-sm text-muted-foreground mt-1">Assign stories and track deadlines</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-assignment"><Plus className="w-4 h-4 mr-2" /> New Assignment</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Assignment</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="title">Story Title</Label>
                <Input id="title" name="title" required placeholder="What's the story?" data-testid="input-assignment-title" />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={2} placeholder="Brief details..." data-testid="textarea-assignment-desc" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select name="category" defaultValue="news">
                    <SelectTrigger data-testid="select-assignment-category"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c} value={c}>{c.replace("-", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Assignee</Label>
                  <Select name="assigneeId">
                    <SelectTrigger data-testid="select-assignment-assignee"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {staffList?.filter(s => s.active).map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>For Issue</Label>
                  <Select name="issueId">
                    <SelectTrigger data-testid="select-assignment-issue"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {issues?.filter(i => i.status !== "published").map(i => <SelectItem key={i.id} value={String(i.id)}>{i.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Deadline</Label>
                  <Input name="deadline" type="date" data-testid="input-assignment-deadline" />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-assignment">
                {createMutation.isPending ? "Creating..." : "Create Assignment"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="p-4 h-20" /></Card>)}
        </div>
      ) : !assignments?.length ? (
        <Card>
          <CardContent className="p-8 text-center">
            <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No assignments yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {assignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-medium truncate" data-testid={`text-assignment-title-${assignment.id}`}>{assignment.title}</h3>
                      <Badge variant={statusColor(assignment.status)} className="text-xs">{assignment.status}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span>{getStaffName(assignment.assigneeId)}</span>
                      <span className="capitalize">{assignment.category.replace("-", " ")}</span>
                      {assignment.deadline && <span>Due {new Date(assignment.deadline).toLocaleDateString()}</span>}
                      {assignment.issueId && <span>· {getIssueName(assignment.issueId)}</span>}
                    </div>
                    {assignment.description && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">{assignment.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Select
                      value={assignment.status}
                      onValueChange={(val) => updateMutation.mutate({ id: assignment.id, data: { status: val } })}
                    >
                      <SelectTrigger className="w-[120px]" data-testid={`select-assignment-status-${assignment.id}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {assignmentStatuses.map(s => <SelectItem key={s} value={s}>{s.replace("-", " ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(assignment.id)}
                      data-testid={`button-delete-assignment-${assignment.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
