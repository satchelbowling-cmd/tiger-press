import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, X, Eye, Loader2, AlertTriangle, ArrowUp } from "lucide-react";
import type { Staff, Issue } from "@shared/schema";

const categories = ["news", "opinion", "sports", "arts", "campus-life"];
const priorities = [
  { value: "low", label: "Low", color: "secondary" },
  { value: "normal", label: "Normal", color: "default" },
  { value: "high", label: "High", color: "default" },
  { value: "urgent", label: "Urgent", color: "destructive" },
] as const;

export default function UploadPage() {
  const { toast } = useToast();
  const { user, isEditor } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("news");
  const [priority, setPriority] = useState("normal");
  const [tags, setTags] = useState("");
  const [deadline, setDeadline] = useState("");
  const [issueId, setIssueId] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [notes, setNotes] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("paste");
  const [showPreview, setShowPreview] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const { data: staffList } = useQuery<Staff[]>({ queryKey: ["/api/staff"] });
  const { data: issues } = useQuery<Issue[]>({ queryKey: ["/api/issues"] });

  const writers = staffList?.filter(s =>
    s.active && (s.role === "writer" || s.role === "editor" || s.role === "editor-in-chief")
  ) ?? [];
  const upcomingIssues = issues?.filter(i => i.status !== "published") ?? [];

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  const submitMutation = useMutation({
    mutationFn: async () => {
      const tagsArray = tags.split(",").map(t => t.trim()).filter(Boolean);
      const data = {
        title,
        content,
        category,
        priority,
        targetWordCount: (document.getElementById("targetWordCount") as HTMLInputElement)?.value ? Number((document.getElementById("targetWordCount") as HTMLInputElement).value) : null,
        tags: tagsArray.length > 0 ? JSON.stringify(tagsArray) : null,
        authorId: authorId ? Number(authorId) : (user?.id ?? null),
        editorId: null,
        status: "submitted",
        wordCount,
        submittedAt: new Date().toISOString(),
        deadline: deadline || null,
        issueDate: null,
        notes: notes || null,
        originalFilename: fileName || null,
        fileType,
      };
      const res = await apiRequest("POST", "/api/articles", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Article submitted successfully" });
      // Reset form
      setTitle(""); setContent(""); setCategory("news"); setPriority("normal");
      setTags(""); setDeadline(""); setIssueId(""); setAuthorId("");
      setNotes(""); setFileName(""); setFileType("paste");
    },
    onError: () => {
      toast({ title: "Submission failed", variant: "destructive" });
    },
  });

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, []);

  const processFile = (file: File) => {
    setFileName(file.name);
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "txt" || ext === "md") {
      setFileType(ext);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setContent(text);
        if (!title) {
          const firstLine = text.split("\n")[0].replace(/^#\s*/, "").trim();
          if (firstLine.length > 0 && firstLine.length < 120) setTitle(firstLine);
        }
      };
      reader.readAsText(file);
    } else if (ext === "docx") {
      setFileType("docx");
      setContent("[DOCX file uploaded — content will be extracted on server]\n\nFile: " + file.name);
      toast({ title: "DOCX uploaded", description: "Content preview is limited for .docx files" });
    } else {
      toast({ title: "Unsupported file type", description: "Please upload .txt, .md, or .docx files", variant: "destructive" });
    }
  };

  const clearFile = () => {
    setFileName("");
    setFileType("paste");
    setContent("");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-xl font-semibold tracking-tight" data-testid="text-page-title">
          Submit Article
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload or paste your article with full metadata
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content area */}
        <div className="lg:col-span-2 space-y-4">
          {/* File drop zone */}
          <Card>
            <CardContent className="p-4">
              {!fileName ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                  onClick={() => document.getElementById("file-input")?.click()}
                  data-testid="dropzone-upload"
                >
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium">Drop your article file here</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports .txt, .md, and .docx files — or paste text below
                  </p>
                  <input
                    id="file-input" type="file" className="hidden"
                    accept=".txt,.md,.docx"
                    onChange={handleFileSelect}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <FileText className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{fileName}</p>
                    <p className="text-xs text-muted-foreground">{fileType.toUpperCase()} file</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={clearFile} data-testid="button-clear-file">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

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
                    <p key={i}>{p}</p>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Textarea
                id="content" value={content}
                onChange={(e) => { setContent(e.target.value); setFileType("paste"); }}
                rows={14} placeholder="Paste or type your article text here..."
                className="font-serif text-sm leading-relaxed"
                data-testid="textarea-upload-content"
              />
            )}
          </div>
        </div>

        {/* Metadata sidebar */}
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
                <Label className="text-xs">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="mt-1" data-testid="select-upload-priority"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {priorities.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Tags (comma-separated)</Label>
                <Input
                  value={tags} onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. breaking, feature, interview"
                  className="mt-1"
                  data-testid="input-upload-tags"
                />
                {tags && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tags.split(",").map(t => t.trim()).filter(Boolean).map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>

              {isEditor && (
                <div>
                  <Label className="text-xs">Author</Label>
                  <Select value={authorId} onValueChange={setAuthorId}>
                    <SelectTrigger className="mt-1" data-testid="select-upload-author"><SelectValue placeholder="Self" /></SelectTrigger>
                    <SelectContent>
                      {writers.map(w => <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label className="text-xs">Target Issue</Label>
                <Select value={issueId} onValueChange={setIssueId}>
                  <SelectTrigger className="mt-1" data-testid="select-upload-issue"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    {upcomingIssues.map(i => <SelectItem key={i.id} value={String(i.id)}>{i.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Word Count Target</Label>
                <Input
                  type="number" min="0" step="50"
                  placeholder="e.g. 500"
                  className="mt-1" data-testid="input-upload-wordtarget"
                  id="targetWordCount"
                />
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
                  rows={2} placeholder="Anything the editor should know..."
                  className="mt-1"
                  data-testid="textarea-upload-notes"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
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

          {priority === "urgent" && (
            <div className="flex items-start gap-2 p-2 rounded-md bg-destructive/10 text-destructive text-xs">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>Urgent articles will be flagged for immediate editor attention.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
