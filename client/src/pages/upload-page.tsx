import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Eye, Loader2, ArrowUp } from "lucide-react";

const categories = ["news", "opinion", "sports", "arts", "campus-life"];

export default function UploadPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("news");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  const submitMutation = useMutation({
    mutationFn: async () => {
      const data = {
        title,
        content,
        category,
        authorId: user?.id ?? null,
        editorId: null,
        status: "submitted",
        wordCount,
        submittedAt: new Date().toISOString(),
        deadline: deadline || null,
        notes: notes || null,
        fileType: "paste",
      };
      const res = await apiRequest("POST", "/api/articles", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Article submitted successfully" });
      setTitle(""); setContent(""); setCategory("news");
      setDeadline(""); setNotes("");
    },
    onError: () => {
      toast({ title: "Submission failed", variant: "destructive" });
    },
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-xl font-semibold tracking-tight" data-testid="text-page-title">
          Submit Article
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Paste your article text and submit for review
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium">Headline</Label>
            <Input
              id="title" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Article headline..."
              className="mt-1 text-base"
              data-testid="input-upload-title"
            />
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <Label htmlFor="content" className="text-sm font-medium">Article Text</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{wordCount} words</span>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-xs h-7"
                  data-testid="button-toggle-preview"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  {showPreview ? "Edit" : "Preview"}
                </Button>
              </div>
            </div>
            {showPreview ? (
              <Card>
                <CardContent className="p-4 prose prose-sm max-w-none font-serif">
                  {content.split("\n\n").map((p, i) => (
                    <p key={i} className="whitespace-pre-line">{p}</p>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Textarea
                id="content" value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={18} placeholder="Paste your article text here. Line breaks will be preserved."
                className="font-serif text-sm leading-relaxed whitespace-pre-wrap"
                data-testid="textarea-upload-content"
              />
            )}
          </div>
        </div>

        {/* Sidebar — simplified */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Article Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1" data-testid="select-upload-category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c} value={c}>{c.replace("-", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Deadline</Label>
                <Input
                  type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                  className="mt-1" data-testid="input-upload-deadline"
                />
              </div>

              <div>
                <Label className="text-xs">Notes for Editor</Label>
                <Textarea
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                  rows={3} placeholder="Anything the editor should know..."
                  className="mt-1"
                  data-testid="textarea-upload-notes"
                />
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full"
            disabled={!title.trim() || !content.trim() || submitMutation.isPending}
            onClick={() => submitMutation.mutate()}
            data-testid="button-submit-upload"
          >
            {submitMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
            ) : (
              <><ArrowUp className="w-4 h-4 mr-2" /> Submit Article</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
