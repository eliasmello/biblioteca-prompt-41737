import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  FolderOpen,
  Star,
  TrendingUp,
  Plus,
  Search,
  Sparkles,
  Activity,
  Users,
  Target
} from "lucide-react";

export default function Dashboard() {
  const stats = [
    {
      title: "Total Prompts",
      value: "127",
      change: "+12%",
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Categories",
      value: "8",
      change: "+2",
      icon: FolderOpen,
      color: "text-accent",
      bgColor: "bg-accent/10"
    },
    {
      title: "Favorites",
      value: "23",
      change: "+5",
      icon: Star,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100"
    },
    {
      title: "Usage This Month",
      value: "1,247",
      change: "+18%",
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10"
    }
  ];

  const recentPrompts = [
    {
      id: "1",
      title: "Diorama / Nature Scene",
      category: "Diorama",
      usageCount: 45,
      createdAt: "2024-01-15",
      tags: ["hyper-realistic", "nature", "golden hour"]
    },
    {
      id: "2", 
      title: "Corporate Portrait",
      category: "Portrait",
      usageCount: 32,
      createdAt: "2024-01-14",
      tags: ["professional", "studio lighting", "business"]
    },
    {
      id: "3",
      title: "Cyberpunk Cityscape",
      category: "Landscape",
      usageCount: 28,
      createdAt: "2024-01-13",
      tags: ["futuristic", "neon", "cyberpunk"]
    }
  ];

  const topCategories = [
    { name: "Diorama", count: 24, color: "bg-blue-500" },
    { name: "Portrait", count: 18, color: "bg-green-500" },
    { name: "Landscape", count: 12, color: "bg-purple-500" },
    { name: "Product", count: 8, color: "bg-orange-500" }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's what's happening with your prompts.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Search className="w-4 h-4" />
            Search
          </Button>
          <Button className="gap-2 bg-gradient-primary">
            <Plus className="w-4 h-4" />
            New Prompt
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="glass hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {stat.value}
                  </p>
                  <p className="text-sm text-success mt-1">
                    {stat.change} from last month
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Prompts */}
        <Card className="lg:col-span-2 glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Recent Prompts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground">
                        {prompt.title}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {prompt.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {prompt.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {prompt.usageCount} uses • {new Date(prompt.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Sparkles className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-accent" />
              Top Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCategories.map((category) => (
                <div key={category.name} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${category.color}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">
                        {category.name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {category.count}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 mt-1">
                      <div
                        className={`h-2 rounded-full ${category.color}`}
                        style={{ width: `${(category.count / 24) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Plus className="w-6 h-6" />
              Create New Prompt
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <FolderOpen className="w-6 h-6" />
              Manage Categories
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <FileText className="w-6 h-6" />
              Import Prompts
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}