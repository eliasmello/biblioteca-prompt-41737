import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PromptCard } from "@/components/prompts/PromptCard";
import { PromptPreviewModal } from "@/components/prompts/PromptPreviewModal";
import {
  Search,
  Plus,
  Filter,
  SortAsc,
  Grid3X3,
  List,
  Star,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Prompts() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  // Mock data - in real app this would come from API
  const prompts = [
    {
      id: "1",
      number: 6,
      title: "Diorama / Nature Scene",
      category: "Diorama",
      subcategory: "Nature Scene",
      content: "Design a hyper-realistic miniature diorama on a rustic wooden table, inspired by Into the Wild. Scene: dense pine forest, frost-covered terrain, and animal tracks. Central figure: a young man beside the iconic Magic Bus 142, weathered, with layered outdoor clothing. Props: journal, tin cup, backpack, fire, pot, and an open book. Add wildlife: fox, birds, rabbit. Bus details: rust, graffiti, cracked windows. Lighting: golden hour. Camera: macro lens, shallow depth of field. Mood: reflective, peaceful, bittersweet.",
      tags: ["diorama", "nature", "miniature", "realistic"],
      styleTags: ["hyper-realistic", "golden hour", "macro lens", "shallow depth"],
      subjectTags: ["forest", "man", "bus", "wildlife"],
      isFavorite: true,
      usageCount: 45,
      createdAt: "2024-01-15T10:30:00Z"
    },
    {
      id: "2",
      number: 7,
      title: "Corporate Portrait",
      category: "Portrait",
      subcategory: "Professional",
      content: "Professional headshot of a confident business executive in a modern office setting. Subject: middle-aged professional in tailored navy suit. Lighting: soft window light with subtle fill. Background: minimalist office with glass windows showing city skyline. Camera: 85mm lens, f/2.8. Mood: confident, approachable, authoritative.",
      tags: ["portrait", "professional", "business", "headshot"],
      styleTags: ["professional", "studio lighting", "clean", "modern"],
      subjectTags: ["executive", "office", "suit", "corporate"],
      isFavorite: false,
      usageCount: 32,
      createdAt: "2024-01-14T14:20:00Z"
    },
    {
      id: "3",
      number: 8,
      title: "Cyberpunk Cityscape",
      category: "Landscape",
      subcategory: "Urban",
      content: "Futuristic cyberpunk cityscape at night with neon-lit skyscrapers and flying vehicles. Scene: towering megastructures with holographic advertisements, rain-slicked streets reflecting neon lights. Atmosphere: dense fog, ambient lighting from various neon sources. Color palette: electric blues, hot pinks, deep purples. Camera: wide-angle view, high contrast. Mood: mysterious, high-tech, dystopian.",
      tags: ["cityscape", "futuristic", "night", "urban"],
      styleTags: ["cyberpunk", "neon", "high contrast", "atmospheric"],
      subjectTags: ["city", "skyscrapers", "neon lights", "rain"],
      isFavorite: true,
      usageCount: 28,
      createdAt: "2024-01-13T16:45:00Z"
    }
  ];

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "diorama", label: "Diorama" },
    { value: "portrait", label: "Portrait" },
    { value: "landscape", label: "Landscape" },
    { value: "product", label: "Product" }
  ];

  const handlePreview = (id: string) => {
    const prompt = prompts.find(p => p.id === id);
    setSelectedPrompt(prompt);
    setIsPreviewOpen(true);
  };

  const handleToggleFavorite = (id: string) => {
    console.log('Toggle favorite:', id);
    // In real app, this would update the backend
  };

  const handleCopy = (content: string) => {
    console.log('Copied:', content.slice(0, 50) + '...');
    // You could show a toast notification here
  };

  const handleEdit = (id: string) => {
    console.log('Edit prompt:', id);
    // Navigate to edit page
  };

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prompt.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prompt.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || 
                           prompt.category.toLowerCase() === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Prompts</h1>
          <p className="text-muted-foreground mt-1">
            Manage and organize your AI prompts
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button className="gap-2 bg-gradient-primary">
            <Plus className="w-4 h-4" />
            New Prompt
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="glass">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search prompts, tags, content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
                <SortAsc className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Used</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
                <SelectItem value="favorites">Favorites</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="flex items-center border border-border rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={cn(
                  "px-3",
                  viewMode === 'grid' && "bg-primary text-primary-foreground"
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className={cn(
                  "px-3",
                  viewMode === 'list' && "bg-primary text-primary-foreground"
                )}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                Search: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="ml-1">×</button>
              </Badge>
            )}
            {selectedCategory !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Category: {categories.find(c => c.value === selectedCategory)?.label}
                <button onClick={() => setSelectedCategory('all')} className="ml-1">×</button>
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredPrompts.length} of {prompts.length} prompts
        </p>
        <Button variant="ghost" size="sm" className="gap-2">
          <Star className="w-4 h-4" />
          Show only favorites
        </Button>
      </div>

      {/* Prompts Grid/List */}
      <div className={cn(
        viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          : "space-y-4"
      )}>
        {filteredPrompts.map((prompt) => (
          <PromptCard
            key={prompt.id}
            prompt={prompt}
            onPreview={handlePreview}
            onToggleFavorite={handleToggleFavorite}
            onCopy={handleCopy}
          />
        ))}
      </div>

      {/* Preview Modal */}
      <PromptPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        prompt={selectedPrompt}
        onToggleFavorite={handleToggleFavorite}
        onEdit={handleEdit}
      />
    </div>
  );
}