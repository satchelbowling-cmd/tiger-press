import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";

const sections = ["news", "opinion", "sports", "arts", "campus-life"];

export default function LoginPage() {
  const { login } = useAuth();
  const [tab, setTab] = useState("login");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regSection, setRegSection] = useState("");
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      await login(loginEmail, loginPassword);
    } catch (err: any) {
      setLoginError(err.message || "Login failed");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    if (regPassword.length < 6) {
      setRegError("Password must be at least 6 characters");
      return;
    }
    if (regPassword !== regConfirm) {
      setRegError("Passwords do not match");
      return;
    }
    setRegLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/register", {
        name: regName,
        email: regEmail,
        password: regPassword,
        role: "writer",
        section: regSection || null,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Registration failed");
      }
      setRegSuccess(true);
      // Auto-login after registration
      await login(regEmail, regPassword);
    } catch (err: any) {
      setRegError(err.message || "Registration failed");
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 rounded-lg mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "hsl(352, 58%, 34%)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M4 4h16v2H4V4zm0 4h10v2H4V8zm0 4h16v2H4v-2zm0 4h10v2H4v-2zm0 4h16v2H4v-2z" fill="white"/>
            </svg>
          </div>
          <h1 className="font-serif text-xl font-semibold tracking-tight" data-testid="text-login-title">Tiger Press</h1>
          <p className="text-sm text-muted-foreground mt-1">Hampden-Sydney College Newspaper</p>
        </div>

        <Card>
          <Tabs value={tab} onValueChange={setTab}>
            <CardHeader className="pb-0 pt-4">
              <TabsList className="w-full">
                <TabsTrigger value="login" className="flex-1" data-testid="tab-login">Sign In</TabsTrigger>
                <TabsTrigger value="register" className="flex-1" data-testid="tab-register">Register</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="pt-4">
              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  {loginError && (
                    <div className="text-sm text-destructive bg-destructive/10 rounded-md p-2 text-center" data-testid="text-login-error">
                      {loginError}
                    </div>
                  )}
                  <div>
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email" type="email" required
                      value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@hsc.edu"
                      data-testid="input-login-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password" type="password" required
                      value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter password"
                      data-testid="input-login-password"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loginLoading} data-testid="button-login">
                    {loginLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="mt-0">
                <form onSubmit={handleRegister} className="space-y-3">
                  {regError && (
                    <div className="text-sm text-destructive bg-destructive/10 rounded-md p-2 text-center" data-testid="text-register-error">
                      {regError}
                    </div>
                  )}
                  <div>
                    <Label htmlFor="reg-name">Full Name</Label>
                    <Input
                      id="reg-name" required
                      value={regName} onChange={(e) => setRegName(e.target.value)}
                      placeholder="John Smith"
                      data-testid="input-register-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reg-email">Email</Label>
                    <Input
                      id="reg-email" type="email" required
                      value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="jsmith@hsc.edu"
                      data-testid="input-register-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reg-password">Password</Label>
                    <Input
                      id="reg-password" type="password" required
                      value={regPassword} onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      data-testid="input-register-password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reg-confirm">Confirm Password</Label>
                    <Input
                      id="reg-confirm" type="password" required
                      value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)}
                      placeholder="Confirm password"
                      data-testid="input-register-confirm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reg-section">Section</Label>
                    <Select value={regSection} onValueChange={setRegSection}>
                      <SelectTrigger data-testid="select-register-section"><SelectValue placeholder="Select your section" /></SelectTrigger>
                      <SelectContent>
                        {sections.map(s => <SelectItem key={s} value={s}>{s.replace("-", " ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={regLoading} data-testid="button-register">
                    {regLoading ? "Creating account..." : "Create Account"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    New accounts are created as writers. Your editor-in-chief can update your role.
                  </p>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
