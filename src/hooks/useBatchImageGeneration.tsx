import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type BatchStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error';

interface ProgressData {
  current: number;
  total: number;
  currentPromptId?: string;
  currentPromptTitle?: string;
  errors: Array<{ promptId: string; promptTitle: string; error: string }>;
}

interface UseBatchImageGenerationReturn {
  startBatch: () => Promise<void>;
  pauseBatch: () => void;
  cancelBatch: () => void;
  status: BatchStatus;
  progress: ProgressData;
  isLoading: boolean;
}

export const useBatchImageGeneration = (
  onComplete?: () => void
): UseBatchImageGenerationReturn => {
  const [status, setStatus] = useState<BatchStatus>('idle');
  const [progress, setProgress] = useState<ProgressData>({
    current: 0,
    total: 0,
    errors: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const startBatch = useCallback(async () => {
    try {
      setIsLoading(true);
      setStatus('running');
      setProgress({ current: 0, total: 0, errors: [] });

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Create EventSource for SSE
      const url = new URL(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/batch-generate-images`
      );

      const eventSource = new EventSource(url.toString(), {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      } as any);

      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'success':
              setProgress((prev) => ({
                ...prev,
                current: data.current,
                total: data.total,
                currentPromptId: data.promptId,
                currentPromptTitle: data.promptTitle,
              }));
              break;

            case 'error':
              setProgress((prev) => ({
                ...prev,
                current: data.current,
                total: data.total,
                errors: [
                  ...prev.errors,
                  {
                    promptId: data.promptId,
                    promptTitle: data.promptTitle,
                    error: data.error,
                  },
                ],
              }));
              break;

            case 'critical_error':
              setStatus('error');
              setProgress((prev) => ({
                ...prev,
                current: data.generated + data.failed,
                total: data.total,
              }));
              
              if (data.error === 'NO_CREDITS') {
                toast.error('Créditos esgotados!', {
                  description: 'Adicione créditos em Settings → Usage',
                  duration: 10000,
                });
              } else if (data.error === 'RATE_LIMIT') {
                toast.error('Limite de requisições atingido', {
                  description: 'Tente novamente em alguns minutos',
                  duration: 10000,
                });
              }
              
              eventSource.close();
              setIsLoading(false);
              break;

            case 'complete':
              setStatus('completed');
              setProgress((prev) => ({
                ...prev,
                current: data.generated + data.failed,
                total: data.total,
              }));
              
              toast.success('Geração completa!', {
                description: `${data.generated} imagens geradas com sucesso${
                  data.failed > 0 ? `, ${data.failed} falharam` : ''
                }`,
              });
              
              eventSource.close();
              setIsLoading(false);
              
              if (onComplete) {
                onComplete();
              }
              break;
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        setStatus('error');
        setIsLoading(false);
        toast.error('Erro na geração em lote', {
          description: 'Verifique os logs para mais detalhes',
        });
        eventSource.close();
      };

    } catch (error) {
      console.error('Error starting batch:', error);
      setStatus('error');
      setIsLoading(false);
      toast.error('Erro ao iniciar geração em lote', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }, [onComplete]);

  const pauseBatch = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      setStatus('paused');
      setIsLoading(false);
    }
  }, []);

  const cancelBatch = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setStatus('idle');
    setProgress({ current: 0, total: 0, errors: [] });
    setIsLoading(false);
  }, []);

  return {
    startBatch,
    pauseBatch,
    cancelBatch,
    status,
    progress,
    isLoading,
  };
};
