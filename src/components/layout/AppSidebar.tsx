import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Search,
  Home,
  FileText,
  FolderOpen,
  Star,
  Settings,
  User,
  Plus,
  Sparkles,
  BarChart3,
  Lightbulb
} from "lucide-react";

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

const mainItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Prompts", url: "/prompts", icon: FileText },
  { title: "Categories", url: "/categories", icon: FolderOpen },
  { title: "Favorites", url: "/favorites", icon: Star },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

const adminItems = [
  { title: "Users", url: "/admin/users", icon: User },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

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

        {/* Quick Actions */}
        {!collapsed && (
          <div className="p-4 space-y-2">
            <Button size="sm" className="w-full justify-start gap-2" variant="default">
              <Plus className="w-4 h-4" />
              New Prompt
            </Button>
            <Button size="sm" className="w-full justify-start gap-2" variant="outline">
              <Search className="w-4 h-4" />
              Quick Search
            </Button>
          </div>
        )}

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
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/80 font-medium">
            Admin
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={getNavClassName(item.url)}
                    >
                      <item.icon className="w-4 h-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Categories */}
        {!collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/80 font-medium">
              Categories
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>Diorama</span>
                    <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">24</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Portrait</span>
                    <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">18</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span>Landscape</span>
                    <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">12</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}