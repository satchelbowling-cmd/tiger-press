import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Camera, ImageIcon, Check, X } from "lucide-react";
import type { Photo, Article, Staff } from "@shared/schema";

export default function PhotosPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: photos, isLoading } = useQuery<Photo[]>({ queryKey: ["/api/photos"] });
  const { data: articles } = useQuery<Article[]>({ queryKey: ["/api/articles"] });
  const { data: staffList } = useQuery<Staff[]>({ queryKey: ["/api/staff"] });

  const photographers = staffList?.filter(s => s.role === "photographer") ?? [];

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/photos", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      setDialogOpen(false);
      toast({ title: "Photo logged" });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/photos/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
    },
  });

  const getArticleTitle = (id: number | null) => {
    if (!id || !articles) return "Unlinked";
    return articles.find(a => a.id === id)?.title ?? "Unknown";
  };

  const getStaffName = (id: number | null) => {
    if (!id || !staffList) return "Unknown";
    return staffList.find(s => s.id === id)?.name ?? "Unknown";
  };

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      filename: fd.get("filename") as string,
      caption: fd.get("caption") as string,
      articleId: fd.get("articleId") ? Number(fd.get("articleId")) : null,
      photographerId: fd.get("photographerId") ? Number(fd.get("photographerId")) : null,
      status: "pending",
      uploadedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-xl font-semibold tracking-tight" data-testid="text-page-title">Photos</h1>
          <p className="text-sm text-muted-foreground mt-1">Track photo submissions and approvals</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-photo"><Plus className="w-4 h-4 mr-2" /> Log Photo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Photo Submission</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="filename">Filename</Label>
                <Input id="filename" name="filename" required placeholder="campus_event_01.jpg" data-testid="input-photo-filename" />
              </div>
              <div>
                <Label htmlFor="caption">Caption</Label>
                <Input id="caption" name="caption" placeholder="Describe the photo..." data-testid="input-photo-caption" />
              </div>
              <div>
                <Label htmlFor="articleId">Linked Article</Label>
                <Select name="articleId">
                  <SelectTrigger data-testid="select-photo-article"><SelectValue placeholder="Select article..." /></SelectTrigger>
                  <SelectContent>
                    {articles?.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="photographerId">Photographer</Label>
                <Select name="photographerId">
                  <SelectTrigger data-testid="select-photo-photographer"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {photographers.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-photo">
                {createMutation.isPending ? "Logging..." : "Log Photo"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Card key={i}><CardContent className="p-4 h-16" /></Card>)}
        </div>
      ) : !photos?.length ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Camera className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No photos logged yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {photos.map((photo) => (
            <Card key={photo.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <ImageIcon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" data-testid={`text-photo-name-${photo.id}`}>{photo.filename}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                      <span>{getStaffName(photo.photographerId)}</span>
                      <span>for {getArticleTitle(photo.articleId)}</span>
                      {photo.caption && <span>· {photo.caption}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={photo.status === "approved" ? "default" : photo.status === "rejected" ? "destructive" : "secondary"} className="text-xs">
                      {photo.status}
                    </Badge>
                    {photo.status === "pending" && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => updateStatus.mutate({ id: photo.id, status: "approved" })}
                          data-testid={`button-approve-photo-${photo.id}`}
                        >
                          <Check className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => updateStatus.mutate({ id: photo.id, status: "rejected" })}
                          data-testid={`button-reject-photo-${photo.id}`}
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </>
                    )}
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
