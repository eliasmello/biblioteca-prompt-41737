import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Prompts from "./pages/Prompts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/prompts" element={<Prompts />} />
            <Route path="/categories" element={<div className="p-8"><h1 className="text-2xl font-bold">Categories</h1><p className="text-muted-foreground">Categories management coming soon...</p></div>} />
            <Route path="/favorites" element={<div className="p-8"><h1 className="text-2xl font-bold">Favorites</h1><p className="text-muted-foreground">Favorite prompts coming soon...</p></div>} />
            <Route path="/analytics" element={<div className="p-8"><h1 className="text-2xl font-bold">Analytics</h1><p className="text-muted-foreground">Analytics dashboard coming soon...</p></div>} />
            <Route path="/admin/users" element={<div className="p-8"><h1 className="text-2xl font-bold">User Management</h1><p className="text-muted-foreground">User management coming soon...</p></div>} />
            <Route path="/admin/settings" element={<div className="p-8"><h1 className="text-2xl font-bold">Settings</h1><p className="text-muted-foreground">System settings coming soon...</p></div>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
