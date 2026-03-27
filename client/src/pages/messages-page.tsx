import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Send, Pin, Megaphone, Trash2, AlertTriangle, Bell } from "lucide-react";
import type { Channel, Message, Staff, Announcement } from "@shared/schema";

export default function MessagesPage() {
  const { toast } = useToast();
  const { user, isAdmin, isEditor } = useAuth();
  const [activeChannel, setActiveChannel] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: channels } = useQuery<Channel[]>({ queryKey: ["/api/channels"] });
  const { data: staffList } = useQuery<Staff[]>({ queryKey: ["/api/staff"] });
  const { data: announcements } = useQuery<Announcement[]>({ queryKey: ["/api/announcements"] });

  const { data: channelMessages, refetch: refetchMessages } = useQuery<Message[]>({
    queryKey: ["/api/channels", activeChannel, "messages"],
    queryFn: async () => {
      if (!activeChannel) return [];
      const res = await apiRequest("GET", `/api/channels/${activeChannel}/messages`);
      return res.json();
    },
    enabled: !!activeChannel,
    refetchInterval: 5000,
  });

  // Get current user's preferred sections from staff data
  const currentStaff = staffList?.find(s => s.id === user?.id);
  const userSections: string[] = (() => {
    try {
      return currentStaff?.preferredSections ? JSON.parse(currentStaff.preferredSections) : [];
    } catch { return []; }
  })();

  // Filter channels: user sees chats matching their preferred sections + all-staff, admin sees all
  const visibleChannels = channels?.filter(ch => {
    if (isAdmin) return true;
    if (ch.type === "all-staff") return true;
    if (ch.section && userSections.includes(ch.section)) return true;
    return false;
  }) ?? [];

  // Auto-select first channel
  useEffect(() => {
    if (!activeChannel && visibleChannels.length > 0) {
      setActiveChannel(visibleChannels[0].id);
    }
  }, [visibleChannels, activeChannel]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [channelMessages]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/messages", {
        channelId: activeChannel,
        senderId: user!.id,
        content: newMessage.trim(),
        pinned: false,
        createdAt: new Date().toISOString(),
      });
      return res.json();
    },
    onSuccess: () => {
      setNewMessage("");
      refetchMessages();
    },
  });

  const pinMutation = useMutation({
    mutationFn: async ({ id, pinned }: { id: number; pinned: boolean }) => {
      const res = await apiRequest("PATCH", `/api/messages/${id}`, { pinned });
      return res.json();
    },
    onSuccess: () => refetchMessages(),
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; priority: string }) => {
      const res = await apiRequest("POST", "/api/announcements", {
        ...data,
        authorId: user!.id,
        createdAt: new Date().toISOString(),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      setAnnouncementOpen(false);
      toast({ title: "Announcement posted" });
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/announcements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
    },
  });

  const getStaffName = (id: number) => staffList?.find(s => s.id === id)?.name ?? "Unknown";
  const getStaffInitials = (id: number) => staffList?.find(s => s.id === id)?.avatarInitials ?? "??";
  const activeChannelName = channels?.find(c => c.id === activeChannel)?.name ?? "";

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && activeChannel) sendMutation.mutate();
  };

  const handleAnnouncementSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createAnnouncementMutation.mutate({
      title: fd.get("title") as string,
      content: fd.get("content") as string,
      priority: fd.get("priority") as string,
    });
  };

  const priorityBadge = (p: string) => {
    if (p === "urgent") return <Badge variant="destructive" className="text-xs">Urgent</Badge>;
    if (p === "important") return <Badge className="text-xs bg-amber-500/90 text-white">Important</Badge>;
    return null;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-xl font-semibold tracking-tight" data-testid="text-page-title">Messages</h1>
          <p className="text-sm text-muted-foreground mt-1">Section chats and staff announcements</p>
        </div>
        {isAdmin && (
          <Dialog open={announcementOpen} onOpenChange={setAnnouncementOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-announcement">
                <Megaphone className="w-4 h-4 mr-2" /> New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Post Announcement</DialogTitle></DialogHeader>
              <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input name="title" required placeholder="Announcement title..." data-testid="input-announcement-title" />
                </div>
                <div>
                  <Label>Message</Label>
                  <Textarea name="content" required rows={3} placeholder="What does the staff need to know?" data-testid="textarea-announcement-content" />
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select name="priority" defaultValue="normal">
                    <SelectTrigger data-testid="select-announcement-priority"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="important">Important</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={createAnnouncementMutation.isPending} data-testid="button-submit-announcement">
                  {createAnnouncementMutation.isPending ? "Posting..." : "Post to All Staff"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Announcements */}
      {announcements && announcements.length > 0 && (
        <div className="space-y-2">
          {announcements.slice(0, 3).map(a => (
            <Card key={a.id} className={a.priority === "urgent" ? "border-destructive/50" : a.priority === "important" ? "border-amber-400/50" : ""}>
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <Bell className={`w-4 h-4 mt-0.5 shrink-0 ${a.priority === "urgent" ? "text-destructive" : "text-primary"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{a.title}</span>
                      {priorityBadge(a.priority)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      — {getStaffName(a.authorId)} · {new Date(a.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {isAdmin && (
                    <Button variant="ghost" size="icon" onClick={() => deleteAnnouncementMutation.mutate(a.id)} data-testid={`button-delete-announcement-${a.id}`}>
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Chat area */}
      <div className="grid lg:grid-cols-4 gap-4" style={{ height: "calc(100vh - 380px)", minHeight: "400px" }}>
        {/* Channel list */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Channels</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-1">
            {visibleChannels.map(ch => (
              <button
                key={ch.id}
                onClick={() => setActiveChannel(ch.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  activeChannel === ch.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
                data-testid={`button-channel-${ch.id}`}
              >
                <span className="font-medium"># {ch.name}</span>
                <span className="block text-xs opacity-70 capitalize">{ch.type === "all-staff" ? "All staff" : ch.section}</span>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="lg:col-span-3 flex flex-col">
          <CardHeader className="pb-2 border-b shrink-0">
            <CardTitle className="text-sm font-semibold">
              {activeChannelName ? `# ${activeChannelName}` : "Select a channel"}
            </CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {channelMessages?.map(msg => (
                <div key={msg.id} className={`flex gap-3 ${msg.pinned ? "bg-accent/50 -mx-2 px-2 py-1 rounded-md" : ""}`} data-testid={`message-${msg.id}`}>
                  <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                      {getStaffInitials(msg.senderId)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{getStaffName(msg.senderId)}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {msg.pinned && <Pin className="w-3 h-3 text-primary" />}
                    </div>
                    <p className="text-sm text-foreground/90 mt-0.5">{msg.content}</p>
                  </div>
                  {(isEditor || isAdmin) && (
                    <Button
                      variant="ghost" size="icon"
                      className="shrink-0 opacity-0 group-hover:opacity-100 h-7 w-7"
                      onClick={() => pinMutation.mutate({ id: msg.id, pinned: !msg.pinned })}
                    >
                      <Pin className={`w-3 h-3 ${msg.pinned ? "text-primary" : "text-muted-foreground"}`} />
                    </Button>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          {activeChannel && (
            <form onSubmit={handleSend} className="p-3 border-t flex gap-2 shrink-0">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message #${activeChannelName}...`}
                className="flex-1"
                data-testid="input-send-message"
              />
              <Button type="submit" disabled={!newMessage.trim() || sendMutation.isPending} data-testid="button-send-message">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
