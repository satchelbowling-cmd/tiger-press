import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, KeyRound, Shield, CheckCircle } from "lucide-react";
import type { Staff } from "@shared/schema";

const roles = ["writer", "editor", "editor-in-chief", "photographer", "designer"];
const sections = ["news", "opinion", "sports", "arts", "campus-life"];

type StaffWithCreds = Staff & { hasPassword?: boolean };

export default function StaffPage() {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<StaffWithCreds | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const { data: staffList, isLoading } = useQuery<StaffWithCreds[]>({
    queryKey: ["/api/staff", isAdmin ? "admin" : "normal"],
    queryFn: async () => {
      if (isAdmin) {
        const res = await apiRequest("GET", "/api/staff/admin/credentials");
        return res.json();
      }
      const res = await apiRequest("GET", "/api/staff");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/staff", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setDialogOpen(false);
      toast({ title: "Staff member added" });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const res = await apiRequest("PATCH", `/api/staff/${id}`, { active });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, role }: { id: number; role: string }) => {
      const res = await apiRequest("PATCH", `/api/staff/${id}`, { role });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({ title: "Role updated" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: number; newPassword: string }) => {
      const res = await apiRequest("POST", `/api/staff/${id}/reset-password`, { newPassword });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      setResetDialogOpen(false);
      setResetTarget(null);
      setNewPassword("");
      toast({ title: "Password reset successfully" });
    },
    onError: () => {
      toast({ title: "Failed to reset password", variant: "destructive" });
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = fd.get("name") as string;
    const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    createMutation.mutate({
      name,
      email: fd.get("email") as string,
      password: fd.get("password") as string || undefined,
      role: fd.get("role") as string,
      section: fd.get("section") as string || null,
      avatarInitials: initials,
      active: true,
    });
  };

  const roleColor = (role: string) => {
    switch (role) {
      case "editor-in-chief": return "default" as const;
      case "editor": return "default" as const;
      case "writer": return "secondary" as const;
      case "photographer": return "outline" as const;
      case "designer": return "outline" as const;
      default: return "secondary" as const;
    }
  };

  const openResetDialog = (member: StaffWithCreds) => {
    setResetTarget(member);
    setNewPassword("");
    setResetDialogOpen(true);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-xl font-semibold tracking-tight" data-testid="text-page-title">Staff</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAdmin ? "Manage team, roles, and credentials" : "Your newspaper team"}
          </p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-staff"><Plus className="w-4 h-4 mr-2" /> Add Member</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Staff Member</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" required placeholder="John Smith" data-testid="input-staff-name" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required placeholder="jsmith@hsc.edu" data-testid="input-staff-email" />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" placeholder="Set initial password (min 6 chars)" data-testid="input-staff-password" />
                  <p className="text-xs text-muted-foreground mt-1">Leave blank to generate a temporary password. The staff member can register with their email to set their own.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select name="role" defaultValue="writer">
                      <SelectTrigger data-testid="select-staff-role"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {roles.map(r => <SelectItem key={r} value={r}>{r.replace("-", " ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="section">Section</Label>
                    <Select name="section">
                      <SelectTrigger data-testid="select-staff-section"><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>
                        {sections.map(s => <SelectItem key={s} value={s}>{s.replace("-", " ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-staff">
                  {createMutation.isPending ? "Adding..." : "Add Staff Member"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Password reset dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password for {resetTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Set a new password for {resetTarget?.email}. They will need to use this password to log in.
            </p>
            <div>
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                data-testid="input-reset-password"
              />
            </div>
            <Button
              className="w-full"
              disabled={newPassword.length < 6 || resetPasswordMutation.isPending}
              onClick={() => resetTarget && resetPasswordMutation.mutate({ id: resetTarget.id, newPassword })}
              data-testid="button-confirm-reset"
            >
              {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4 h-20" /></Card>
          ))}
        </div>
      ) : !staffList?.length ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No staff members yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {staffList.map((member) => (
            <Card key={member.id} className={!member.active ? "opacity-50" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {member.avatarInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium" data-testid={`text-staff-name-${member.id}`}>{member.name}</p>
                      <Badge variant={roleColor(member.role)} className="text-xs capitalize">
                        {member.role.replace("-", " ")}
                      </Badge>
                      {member.role === "editor-in-chief" && <Shield className="w-3 h-3 text-primary" />}
                      {isAdmin && member.hasPassword && (
                        <CheckCircle className="w-3 h-3 text-green-500" title="Password set" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      <span>{member.email}</span>
                      {member.section && <span className="capitalize">{member.section.replace("-", " ")} section</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {isAdmin && (
                      <>
                        <Select
                          value={member.role}
                          onValueChange={(val) => updateRole.mutate({ id: member.id, role: val })}
                        >
                          <SelectTrigger className="w-[120px] h-8 text-xs" data-testid={`select-role-${member.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map(r => <SelectItem key={r} value={r}>{r.replace("-", " ")}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => openResetDialog(member)}
                          className="text-xs h-8"
                          data-testid={`button-reset-pw-${member.id}`}
                        >
                          <KeyRound className="w-3 h-3 mr-1" /> Reset PW
                        </Button>
                      </>
                    )}
                    {isAdmin && (
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => toggleActive.mutate({ id: member.id, active: !member.active })}
                        className="text-xs h-8"
                        data-testid={`button-toggle-staff-${member.id}`}
                      >
                        {member.active ? "Deactivate" : "Activate"}
                      </Button>
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
