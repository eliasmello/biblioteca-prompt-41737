import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePromptVersions } from '@/hooks/usePromptVersions';
import { PromptVersion } from '@/types/version';
import { Clock, RotateCcw, Eye, GitCompare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VersionHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  promptId: string | null;
  currentVersion: {
    title: string;
    content: string;
    category: string;
    subcategory?: string;
  };
  onVersionRestored?: () => void;
}

export function VersionHistoryDialog({
  isOpen,
  onClose,
  promptId,
  currentVersion,
  onVersionRestored,
}: VersionHistoryDialogProps) {
  const { versions, loading, restoreVersion } = usePromptVersions(promptId);
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null);
  const [compareVersion, setCompareVersion] = useState<PromptVersion | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'compare'>('history');

  const handleRestore = async (versionId: string) => {
    if (window.confirm('Tem certeza que deseja restaurar esta versão? A versão atual será salva no histórico.')) {
      const success = await restoreVersion(versionId);
      if (success) {
        onVersionRestored?.();
        onClose();
      }
    }
  };

  const handleCompare = (version: PromptVersion) => {
    setCompareVersion(version);
    setActiveTab('compare');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Histórico de Versões
          </DialogTitle>
          <DialogDescription>
            Visualize, compare e restaure versões anteriores deste prompt
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'history' | 'compare')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="compare" disabled={!compareVersion}>
              Comparar Versões
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="mt-4">
            <ScrollArea className="h-[500px] pr-4">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-full"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : versions.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma versão anterior encontrada.</p>
                    <p className="text-sm mt-2">
                      As versões serão salvas automaticamente quando você editar o prompt.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Current Version */}
                  <Card className="border-primary">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="default">Versão Atual</Badge>
                          <Badge variant="outline">{currentVersion.category}</Badge>
                          {currentVersion.subcategory && (
                            <Badge variant="secondary">{currentVersion.subcategory}</Badge>
                          )}
                        </div>
                      </div>
                      <h4 className="font-semibold mb-2">{currentVersion.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {currentVersion.content}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Previous Versions */}
                  {versions.map((version) => (
                    <Card
                      key={version.id}
                      className={selectedVersion?.id === version.id ? 'border-primary' : ''}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Versão {version.versionNumber}</Badge>
                            <Badge variant="outline">{version.category}</Badge>
                            {version.subcategory && (
                              <Badge variant="secondary">{version.subcategory}</Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(version.createdAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                        
                        <h4 className="font-semibold mb-2">{version.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {version.content}
                        </p>

                        {version.changeSummary && (
                          <p className="text-xs text-muted-foreground italic mb-3">
                            {version.changeSummary}
                          </p>
                        )}

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedVersion(version)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            {selectedVersion?.id === version.id ? 'Ocultar' : 'Ver Detalhes'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCompare(version)}
                          >
                            <GitCompare className="w-3 h-3 mr-1" />
                            Comparar
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleRestore(version.id)}
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Restaurar
                          </Button>
                        </div>

                        {selectedVersion?.id === version.id && (
                          <div className="mt-4 pt-4 border-t">
                            <h5 className="font-medium mb-2">Conteúdo Completo:</h5>
                            <pre className="text-sm bg-muted p-3 rounded whitespace-pre-wrap">
                              {version.content}
                            </pre>
                            
                            {version.description && (
                              <>
                                <h5 className="font-medium mb-2 mt-4">Descrição:</h5>
                                <p className="text-sm">{version.description}</p>
                              </>
                            )}

                            {version.styleTags.length > 0 && (
                              <div className="mt-3">
                                <h5 className="font-medium mb-2">Style Tags:</h5>
                                <div className="flex flex-wrap gap-1">
                                  {version.styleTags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {version.subjectTags.length > 0 && (
                              <div className="mt-3">
                                <h5 className="font-medium mb-2">Subject Tags:</h5>
                                <div className="flex flex-wrap gap-1">
                                  {version.subjectTags.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="compare" className="mt-4">
            {compareVersion && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Badge variant="default">Versão Atual</Badge>
                  </h3>
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Título</h4>
                        <p className="font-medium">{currentVersion.title}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Categoria</h4>
                        <div className="flex gap-2">
                          <Badge variant="outline">{currentVersion.category}</Badge>
                          {currentVersion.subcategory && (
                            <Badge variant="secondary">{currentVersion.subcategory}</Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Conteúdo</h4>
                        <ScrollArea className="h-[300px]">
                          <pre className="text-sm whitespace-pre-wrap">{currentVersion.content}</pre>
                        </ScrollArea>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Badge variant="outline">Versão {compareVersion.versionNumber}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(compareVersion.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </h3>
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Título</h4>
                        <p className={`font-medium ${compareVersion.title !== currentVersion.title ? 'text-orange-500' : ''}`}>
                          {compareVersion.title}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Categoria</h4>
                        <div className="flex gap-2">
                          <Badge 
                            variant="outline"
                            className={compareVersion.category !== currentVersion.category ? 'border-orange-500' : ''}
                          >
                            {compareVersion.category}
                          </Badge>
                          {compareVersion.subcategory && (
                            <Badge 
                              variant="secondary"
                              className={compareVersion.subcategory !== currentVersion.subcategory ? 'border-orange-500' : ''}
                            >
                              {compareVersion.subcategory}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Conteúdo</h4>
                        <ScrollArea className="h-[300px]">
                          <pre 
                            className={`text-sm whitespace-pre-wrap ${compareVersion.content !== currentVersion.content ? 'text-orange-500' : ''}`}
                          >
                            {compareVersion.content}
                          </pre>
                        </ScrollArea>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => handleRestore(compareVersion.id)}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Restaurar Esta Versão
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
