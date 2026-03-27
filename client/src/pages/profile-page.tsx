import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Save, Shield, Loader2 } from "lucide-react";

const sectionOptions = [
  { value: "news", label: "News" },
  { value: "life", label: "Life" },
  { value: "opinion", label: "Opinion" },
  { value: "sports", label: "Sports" },
  { value: "other", label: "Other" },
];

const frequencyOptions = [
  { value: "2-weeks", label: "Every 2 weeks" },
  { value: "monthly", label: "Monthly" },
  { value: "bimonthly", label: "Bimonthly" },
];

export default function ProfilePage() {
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [classYear, setClassYear] = useState("");
  const [preferredSections, setPreferredSections] = useState<string[]>([]);
  const [assignmentFrequency, setAssignmentFrequency] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      // Fetch full profile from API
      apiRequest("GET", `/api/staff/${user.id}`).then(r => r.json()).then(data => {
        setBio(data.bio || "");
        setClassYear(data.classYear || "");
        setAssignmentFrequency(data.assignmentFrequency || "");
        try {
          setPreferredSections(data.preferredSections ? JSON.parse(data.preferredSections) : []);
        } catch { setPreferredSections([]); }
      });
    }
  }, [user]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/staff/${user!.id}`, {
        name,
        bio: bio || null,
        classYear: classYear || null,
        preferredSections: preferredSections.length > 0 ? JSON.stringify(preferredSections) : null,
        assignmentFrequency: assignmentFrequency || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({ title: "Profile updated" });
    },
  });

  const changePassword = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/staff/${user!.id}/reset-password`, { newPassword });
      return res.json();
    },
    onSuccess: () => {
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Password changed" });
    },
    onError: () => {
      toast({ title: "Failed to change password", variant: "destructive" });
    },
  });

  const toggleSection = (section: string) => {
    setPreferredSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const passwordValid = newPassword.length >= 6 && newPassword === confirmPassword;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-xl font-semibold tracking-tight" data-testid="text-page-title">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {user?.avatarInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold">{user?.name}</h2>
                {isAdmin && <Shield className="w-4 h-4 text-primary" />}
              </div>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <Badge variant="secondary" className="text-xs capitalize mt-1">{user?.role?.replace("-", " ")}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Personal Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div>
            <Label>Full Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" data-testid="input-profile-name" />
          </div>
          <div>
            <Label>Short Bio</Label>
            <Textarea
              value={bio} onChange={(e) => setBio(e.target.value)}
              rows={3} placeholder="Tell the team a bit about yourself..."
              className="mt-1" data-testid="textarea-profile-bio"
            />
          </div>
          <div>
            <Label>Class Year</Label>
            <Select value={classYear} onValueChange={setClassYear}>
              <SelectTrigger className="mt-1" data-testid="select-profile-year"><SelectValue placeholder="Select year" /></SelectTrigger>
              <SelectContent>
                {["2025", "2026", "2027", "2028", "2029"].map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div>
            <Label className="mb-2 block">Preferred Sections</Label>
            <div className="flex flex-wrap gap-3">
              {sectionOptions.map(s => (
                <label key={s.value} className="flex items-center gap-2 cursor-pointer" data-testid={`checkbox-section-${s.value}`}>
                  <Checkbox
                    checked={preferredSections.includes(s.value)}
                    onCheckedChange={() => toggleSection(s.value)}
                  />
                  <span className="text-sm">{s.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label>Preferred Assignment Frequency</Label>
            <Select value={assignmentFrequency} onValueChange={setAssignmentFrequency}>
              <SelectTrigger className="mt-1" data-testid="select-profile-frequency"><SelectValue placeholder="Select frequency" /></SelectTrigger>
              <SelectContent>
                {frequencyOptions.map(f => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => updateProfile.mutate()}
            disabled={updateProfile.isPending}
            className="w-full"
            data-testid="button-save-profile"
          >
            {updateProfile.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save Profile</>}
          </Button>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div>
            <Label>New Password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" className="mt-1" data-testid="input-profile-new-pw" />
          </div>
          <div>
            <Label>Confirm Password</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" className="mt-1" data-testid="input-profile-confirm-pw" />
          </div>
          <Button
            variant="secondary"
            onClick={() => changePassword.mutate()}
            disabled={!passwordValid || changePassword.isPending}
            className="w-full"
            data-testid="button-change-password"
          >
            {changePassword.isPending ? "Changing..." : "Change Password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
