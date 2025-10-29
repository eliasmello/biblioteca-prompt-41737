import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Download, FileJson, FileSpreadsheet, FileText, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportPrompts, ExportFormat } from '@/lib/export-utils';
import { Prompt } from '@/types/prompt';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ExportDialogProps {
  prompts: Prompt[];
  children?: React.ReactNode;
  defaultFilename?: string;
}

export default function ExportDialog({ prompts, children, defaultFilename }: ExportDialogProps) {
  const { toast } = useToast();
  const [format, setFormat] = useState<ExportFormat>('json');
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const formatOptions = [
    {
      value: 'json',
      label: 'JSON',
      icon: FileJson,
      description: 'Formato ideal para backup completo com todos os dados',
      recommended: true,
    },
    {
      value: 'csv',
      label: 'CSV',
      icon: FileSpreadsheet,
      description: 'Planilha compatível com Excel e Google Sheets',
      recommended: false,
    },
    {
      value: 'txt',
      label: 'TXT',
      icon: FileText,
      description: 'Formato legível e fácil de compartilhar',
      recommended: false,
    },
  ];

  const handleExport = async () => {
    if (prompts.length === 0) {
      toast({
        title: "Nenhum prompt para exportar",
        description: "Não há prompts selecionados para exportação.",
        variant: "destructive",
      });
      return;
    }

    setExporting(true);

    try {
      const result = exportPrompts({
        format,
        prompts,
        filename: defaultFilename,
      });

      toast({
        title: "Exportação concluída!",
        description: `${result.count} prompt(s) exportado(s) em ${result.filename}`,
      });

      setOpen(false);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({
        title: "Erro na exportação",
        description: error instanceof Error ? error.message : 'Erro desconhecido ao exportar prompts',
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar Prompts
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Exportar Prompts</DialogTitle>
          <DialogDescription>
            Escolha o formato de exportação para {prompts.length} prompt(s)
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Formato de exportação */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Formato de arquivo:</Label>
            <RadioGroup value={format} onValueChange={(value) => setFormat(value as ExportFormat)}>
              <div className="space-y-3">
                {formatOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = format === option.value;
                  
                  return (
                    <div
                      key={option.value}
                      className={`relative flex items-start p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50 hover:bg-muted/30'
                      }`}
                      onClick={() => setFormat(option.value as ExportFormat)}
                    >
                      <RadioGroupItem
                        value={option.value}
                        id={option.value}
                        className="mt-1"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <Label
                            htmlFor={option.value}
                            className="font-semibold cursor-pointer"
                          >
                            {option.label}
                          </Label>
                          {option.recommended && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                              Recomendado
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {option.description}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 text-primary absolute top-4 right-4" />
                      )}
                    </div>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          {/* Informações sobre o formato selecionado */}
          {format === 'json' && (
            <Alert>
              <AlertDescription>
                💡 <strong>JSON</strong> preserva todos os dados incluindo IDs, datas e metadados. 
                Ideal para backup completo e reimportação futura.
              </AlertDescription>
            </Alert>
          )}

          {format === 'csv' && (
            <Alert>
              <AlertDescription>
                💡 <strong>CSV</strong> é compatível com planilhas mas pode perder formatação. 
                Arrays são convertidos para texto separado por ponto e vírgula.
              </AlertDescription>
            </Alert>
          )}

          {format === 'txt' && (
            <Alert>
              <AlertDescription>
                💡 <strong>TXT</strong> cria um documento legível e fácil de compartilhar, 
                mas não é ideal para reimportação.
              </AlertDescription>
            </Alert>
          )}

          {/* Resumo da exportação */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">Resumo da exportação:</p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• {prompts.length} prompt(s) serão exportado(s)</p>
              <p>• Formato: {format.toUpperCase()}</p>
              <p>
                • Nome do arquivo: {defaultFilename || 'prompts-backup'}-
                {new Date().toISOString().split('T')[0]}.{format}
              </p>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={exporting}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={exporting || prompts.length === 0}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {exporting ? 'Exportando...' : 'Exportar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
