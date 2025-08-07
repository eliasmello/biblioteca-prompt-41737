import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Upload, FileText, FileSpreadsheet, File } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { getDocument } from 'pdfjs-dist';

interface ImportDialogProps {
  onImport: (content: string) => void;
  isImporting?: boolean;
}

export default function ImportDialog({ onImport, isImporting }: ImportDialogProps) {
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [open, setOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const supportedFormats = [
    { ext: '.txt', icon: FileText, desc: 'Arquivo de texto' },
    { ext: '.doc', icon: FileText, desc: 'Documento Word' },
    { ext: '.docx', icon: FileText, desc: 'Documento Word' },
    { ext: '.xls', icon: FileSpreadsheet, desc: 'Planilha Excel' },
    { ext: '.xlsx', icon: FileSpreadsheet, desc: 'Planilha Excel' },
    { ext: '.csv', icon: FileSpreadsheet, desc: 'Arquivo CSV' },
    { ext: '.pdf', icon: File, desc: 'Documento PDF' }
  ];

  const handleImport = () => {
    if (content.trim()) {
      onImport(content);
      setContent('');
      setOpen(false);
    }
  };

  const processTextFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const processWordFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const result = await mammoth.extractRawText({ arrayBuffer });
          resolve(result.value);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const processExcelFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          let allText = '';
          
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            jsonData.forEach((row: any[]) => {
              const rowText = row.filter(cell => cell).join(' | ');
              if (rowText.trim()) allText += rowText + '\n';
            });
          });
          
          resolve(allText);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const processPdfFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const pdf = await getDocument({ data: arrayBuffer }).promise;
          let allText = '';
          
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ');
            allText += pageText + '\n';
          }
          
          resolve(allText);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    setProgress(0);

    try {
      let extractedText = '';
      const fileExtension = file.name.toLowerCase().split('.').pop();
      
      setProgress(25);

      switch (fileExtension) {
        case 'txt':
          extractedText = await processTextFile(file);
          break;
        case 'doc':
        case 'docx':
          extractedText = await processWordFile(file);
          break;
        case 'xls':
        case 'xlsx':
          extractedText = await processExcelFile(file);
          break;
        case 'csv':
          extractedText = await processTextFile(file);
          break;
        case 'pdf':
          extractedText = await processPdfFile(file);
          break;
        default:
          throw new Error(`Formato de arquivo não suportado: .${fileExtension}`);
      }

      setProgress(75);
      setContent(extractedText);
      setProgress(100);
      
      toast({
        title: "Sucesso!",
        description: `Arquivo ${file.name} processado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast({
        title: "Erro",
        description: `Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Importar Prompts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Prompts</DialogTitle>
          <DialogDescription>
            Cole o conteúdo dos prompts ou faça upload de um arquivo .txt
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Supported formats */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Formatos suportados:</Label>
            <div className="grid grid-cols-2 gap-2">
              {supportedFormats.map((format) => (
                <div key={format.ext} className="flex items-center gap-2 p-2 rounded border bg-muted/30">
                  <format.icon className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{format.ext}</p>
                    <p className="text-xs text-muted-foreground">{format.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* File upload */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Upload de arquivo</Label>
            <input
              id="file-upload"
              type="file"
              accept=".txt,.doc,.docx,.xls,.xlsx,.csv,.pdf"
              onChange={handleFileUpload}
              disabled={processing}
              className="block w-full text-sm text-muted-foreground
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-medium
                file:bg-primary file:text-primary-foreground
                hover:file:bg-primary/90
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {processing && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm text-muted-foreground">Processando arquivo...</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}
          </div>

          {/* Manual input */}
          <div className="space-y-2">
            <Label htmlFor="content">Ou cole o conteúdo aqui:</Label>
            <Textarea
              id="content"
              placeholder="Cole aqui múltiplos prompts separados por quebras de linha..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={15}
              disabled={processing}
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={processing || isImporting}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!content.trim() || processing || isImporting}
              variant="gradient"
            >
              {isImporting ? 'Importando...' : 'Importar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}