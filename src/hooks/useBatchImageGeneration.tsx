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

      console.log('🚀 Starting batch generation...');

      // Call edge function with fetch to support auth headers
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/batch-generate-images`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      console.log('✅ SSE connection established');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // Read stream
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('📡 Stream closed');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;

          try {
            const jsonStr = line.slice(6); // Remove "data: "
            console.log('📨 Received SSE:', jsonStr);
            const data = JSON.parse(jsonStr);

            switch (data.type) {
              case 'success':
                console.log(`✨ Generated: ${data.promptTitle}`);
                setProgress((prev) => ({
                  ...prev,
                  current: data.current,
                  total: data.total,
                  currentPromptId: data.promptId,
                  currentPromptTitle: data.promptTitle,
                }));
                break;

              case 'error':
                console.error(`❌ Error: ${data.promptTitle} - ${data.error}`);
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
                console.error(`🚨 Critical error: ${data.error}`);
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

                setIsLoading(false);
                return;

              case 'complete':
                console.log(`🎉 Complete! ${data.generated} generated, ${data.failed} failed`);
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

                setIsLoading(false);

                if (onComplete) {
                  onComplete();
                }
                break;
            }
          } catch (parseError) {
            console.error('❌ Error parsing SSE data:', parseError, 'Line:', line);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error starting batch:', error);
      setStatus('error');
      setIsLoading(false);
      toast.error('Erro ao iniciar geração em lote', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }, [onComplete]);

  const pauseBatch = useCallback(() => {
    console.log('⏸️ Pausing batch...');
    setStatus('paused');
    setIsLoading(false);
    // Note: ReadableStream doesn't support pause, only cancel
  }, []);

  const cancelBatch = useCallback(() => {
    console.log('❌ Cancelling batch...');
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
