import {
  LayoutDashboard, FileText, Users, Calendar, ClipboardList,
  Upload, MessageSquare, Shield, User, Clock, BarChart3,
} from "lucide-react";
import { useHashLocation } from "wouter/use-hash-location";
import { useAuth } from "@/lib/auth";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel,
  SidebarGroupContent, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Articles", url: "/articles", icon: FileText },
  { title: "Submit Article", url: "/upload", icon: Upload },
  { title: "Assignments", url: "/assignments", icon: ClipboardList },
  { title: "Deadlines", url: "/deadlines", icon: Clock },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "Analytics", url: "/analytics", icon: BarChart3, editorOnly: true },
  { title: "Staff", url: "/staff", icon: Users, adminOnly: true },
  { title: "Issues", url: "/issues", icon: Calendar },
  { title: "Profile", url: "/profile", icon: User },
];

export function AppSidebar() {
  const [location, navigate] = useHashLocation();
  const { user, isAdmin, isEditor } = useAuth();

  const filteredItems = navItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.editorOnly && !isEditor) return false;
    return true;
  });

  return (
    <Sidebar>
      <SidebarHeader className="p-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: "hsl(40, 63%, 47%)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 4h16v2H4V4zm0 4h10v2H4V8zm0 4h16v2H4v-2zm0 4h10v2H4v-2zm0 4h16v2H4v-2z" fill="currentColor" className="text-sidebar-primary-foreground"/>
            </svg>
          </div>
          <div>
            <h2 className="font-serif text-base font-semibold tracking-tight text-sidebar-foreground" data-testid="text-app-name">Tiger Press</h2>
            <p className="text-xs text-sidebar-foreground/60">HSC Newspaper</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={item.url === "/" ? location === "/" : location.startsWith(item.url)}>
                    <a href={`#${item.url}`} onClick={(e) => { e.preventDefault(); navigate(item.url); }} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user && (
          <SidebarGroup>
            <SidebarGroupLabel>Signed In</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-3 py-2">
                <p className="text-xs font-medium text-sidebar-foreground">{user.name}</p>
                <p className="text-xs text-sidebar-foreground/50 capitalize">{user.role.replace("-", " ")}</p>
                {isAdmin && (
                  <div className="flex items-center gap-1 mt-1">
                    <Shield className="w-3 h-3 text-sidebar-primary" />
                    <span className="text-xs text-sidebar-primary">Admin</span>
                  </div>
                )}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4"><PerplexityAttribution /></SidebarFooter>
    </Sidebar>
  );
}
