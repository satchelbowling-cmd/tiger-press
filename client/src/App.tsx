import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthProvider, useAuth } from "@/lib/auth";
import LoginPage from "@/pages/login-page";
import Dashboard from "@/pages/dashboard";
import Articles from "@/pages/articles";
import ArticleDetail from "@/pages/article-detail";
import UploadPage from "@/pages/upload-page";
import StaffPage from "@/pages/staff-page";
import IssuesPage from "@/pages/issues-page";
import AssignmentsPage from "@/pages/assignments-page";
import MessagesPage from "@/pages/messages-page";
import ProfilePage from "@/pages/profile-page";
import DeadlinesPage from "@/pages/deadlines-page";
import AnalyticsPage from "@/pages/analytics-page";
import NotFound from "@/pages/not-found";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/articles" component={Articles} />
      <Route path="/articles/:id" component={ArticleDetail} />
      <Route path="/upload" component={UploadPage} />
      <Route path="/staff" component={StaffPage} />
      <Route path="/issues" component={IssuesPage} />
      <Route path="/assignments" component={AssignmentsPage} />
      <Route path="/messages" component={MessagesPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/deadlines" component={DeadlinesPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const { user, logout, isAdmin } = useAuth();
  const style = { "--sidebar-width": "16rem", "--sidebar-width-icon": "3rem" };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-2 px-4 py-2 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground hidden sm:inline">{user?.name}</span>
              {isAdmin && <Badge variant="default" className="text-xs">Admin</Badge>}
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={logout} data-testid="button-logout">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Router hook={useHashLocation}><AppRouter /></Router>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppContent() {
  const { user } = useAuth();
  if (!user) return <LoginPage />;
  return <AuthenticatedApp />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider><AppContent /></AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
