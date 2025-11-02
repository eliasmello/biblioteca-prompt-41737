import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Pause, X, CheckCircle2, AlertCircle, ImageOff } from 'lucide-react';
import { useBatchImageGeneration, type BatchStatus } from '@/hooks/useBatchImageGeneration';
import { LazyImage } from '@/components/ui/lazy-image';

interface BatchImageGeneratorProps {
  missingImagesCount: number;
  onComplete?: () => void;
}

export const BatchImageGenerator = ({ missingImagesCount, onComplete }: BatchImageGeneratorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { startBatch, pauseBatch, cancelBatch, status, progress, isLoading } = useBatchImageGeneration(() => {
    if (onComplete) onComplete();
  });

  const handleStart = () => {
    setIsOpen(true);
    startBatch();
  };

  const handleClose = () => {
    if (status === 'running') {
      pauseBatch();
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    cancelBatch();
    setIsOpen(false);
  };

  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  const getStatusIcon = (status: BatchStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-success" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-destructive" />;
      case 'running':
        return <Sparkles className="w-6 h-6 text-primary animate-pulse" />;
      default:
        return <ImageOff className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: BatchStatus) => {
    switch (status) {
      case 'running':
        return 'Gerando imagens...';
      case 'paused':
        return 'Pausado';
      case 'completed':
        return 'Concluído!';
      case 'error':
        return 'Erro na geração';
      default:
        return 'Pronto para iniciar';
    }
  };

  if (missingImagesCount === 0) {
    return null;
  }

  return (
    <>
      <Button
        variant="default"
        onClick={handleStart}
        disabled={isLoading}
        className="gap-2 bg-gradient-primary hover:opacity-90 transition-opacity"
      >
        <Sparkles className="w-4 h-4" />
        Gerar Imagens Faltantes
        <Badge variant="secondary" className="ml-1">
          {missingImagesCount}
        </Badge>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getStatusIcon(status)}
              Geração em Lote de Imagens
            </DialogTitle>
            <DialogDescription>
              {getStatusText(status)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-medium">
                  {progress.current} de {progress.total}
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground text-right">
                {progressPercentage.toFixed(0)}% concluído
              </p>
            </div>

            {/* Current Prompt */}
            {status === 'running' && progress.currentPromptTitle && (
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  Gerando agora:
                </p>
                <p className="text-sm text-muted-foreground">
                  {progress.currentPromptTitle}
                </p>
              </div>
            )}

            {/* Errors List */}
            {progress.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  Erros ({progress.errors.length})
                </p>
                <ScrollArea className="h-[120px] rounded-lg border">
                  <div className="p-4 space-y-2">
                    {progress.errors.map((error, index) => (
                      <div
                        key={`${error.promptId}-${index}`}
                        className="text-sm space-y-1 pb-2 border-b last:border-b-0"
                      >
                        <p className="font-medium">{error.promptTitle}</p>
                        <p className="text-xs text-muted-foreground">{error.error}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Completion Stats */}
            {status === 'completed' && (
              <div className="rounded-lg border border-success/20 bg-success/10 p-4 space-y-2">
                <p className="text-sm font-medium flex items-center gap-2 text-success">
                  <CheckCircle2 className="w-4 h-4" />
                  Geração concluída com sucesso!
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Geradas</p>
                    <p className="text-2xl font-bold text-success">
                      {progress.current - progress.errors.length}
                    </p>
                  </div>
                  {progress.errors.length > 0 && (
                    <div>
                      <p className="text-muted-foreground">Falharam</p>
                      <p className="text-2xl font-bold text-destructive">
                        {progress.errors.length}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              {status === 'running' && (
                <>
                  <Button
                    variant="outline"
                    onClick={pauseBatch}
                    className="gap-2"
                  >
                    <Pause className="w-4 h-4" />
                    Pausar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCancel}
                    className="gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancelar
                  </Button>
                </>
              )}
              
              {(status === 'completed' || status === 'error' || status === 'paused') && (
                <Button onClick={handleClose}>
                  Fechar
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
