import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Search, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between h-full px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
                
                {/* Search */}
                <div className="relative w-96 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search prompts, categories..."
                    className="pl-10 bg-background/60 border-border/60 focus:bg-background"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm">
                  <Bell className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <User className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto custom-scrollbar">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}