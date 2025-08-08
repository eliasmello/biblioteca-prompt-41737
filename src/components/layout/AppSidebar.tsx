import { useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Search,
  Home,
  FileText,
  
  Star,
  Settings,
  User,
  Plus,
  Sparkles,
  
  Lightbulb,
  LogOut,
  Upload
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePrompts } from "@/hooks/usePrompts";
import ImportDialog from "@/components/prompts/ImportDialog";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const mainItems = [
  { title: "Prompts", url: "/prompts", icon: FileText },
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Favoritos", url: "/favorites", icon: Star },
];


export function AppSidebar() {
  const { state } = useSidebar();
  const { profile, signOut } = useAuth();
  const { prompts, importPrompts, refetch } = usePrompts();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const [isImporting, setIsImporting] = useState(false);
  
  const favoritesCount = useMemo(() => prompts.filter((p) => p.isFavorite).length, [prompts]);

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  const getNavClassName = (path: string) =>
    cn(
      "transition-all duration-200",
      isActive(path)
        ? "bg-primary text-primary-foreground shadow-md"
        : "hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
    );

  const handleImport = async (content: string) => {
    setIsImporting(true);
    try {
      await importPrompts(content);
      await refetch();
    } catch (error) {
      console.error('Erro ao importar prompts:', error);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Sidebar
      className={cn(
        "border-r border-sidebar-border transition-all duration-300"
      )}
      collapsible="icon"
    >
      <SidebarContent className="bg-sidebar">
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <div className="flex-1">
                <h1 className="font-heading font-bold text-sidebar-foreground">
                  PromptForge
                </h1>
                <p className="text-xs text-sidebar-foreground/60">
                  AI Prompt Management
                </p>
              </div>
            )}
          </div>
        </div>


        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/80 font-medium">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={getNavClassName(item.url)}
                    >
                      <item.icon className="w-4 h-4" />
                      {!collapsed && <span>{item.title}</span>}
                      {!collapsed && item.title === "Favoritos" && (
                        <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">{favoritesCount}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Import */}
        {!collapsed && (
          <div className="p-4 pt-0 space-y-2">
            <ImportDialog onImport={handleImport} isImporting={isImporting}>
              <Button size="sm" className="w-full justify-start gap-2" variant="default">
                <Upload className="w-4 h-4" />
                Importar Prompts
              </Button>
            </ImportDialog>
          </div>
        )}




        {/* Admin - single icon menu at the bottom */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton>
                      <User className="w-4 h-4" />
                      {!collapsed && <span>Admin</span>}
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" side="right" sideOffset={8} className="w-48">
                    <DropdownMenuItem asChild>
                      <NavLink to="/admin/users" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>Users</span>
                      </NavLink>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <NavLink to="/admin/settings" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </NavLink>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); signOut(); }}>
                      <LogOut className="w-4 h-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}