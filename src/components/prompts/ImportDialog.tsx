import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Upload } from 'lucide-react';

interface ImportDialogProps {
  onImport: (content: string) => void;
  isImporting?: boolean;
}

export default function ImportDialog({ onImport, isImporting }: ImportDialogProps) {
  const [content, setContent] = useState('');
  const [open, setOpen] = useState(false);

  const handleImport = () => {
    if (content.trim()) {
      onImport(content);
      setContent('');
      setOpen(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setContent(text);
      };
      reader.readAsText(file);
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
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-upload">Upload de arquivo (.txt)</Label>
            <input
              id="file-upload"
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="block w-full text-sm text-muted-foreground
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-medium
                file:bg-primary file:text-primary-foreground
                hover:file:bg-primary-hover"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Ou cole o conteúdo aqui:</Label>
            <Textarea
              id="content"
              placeholder="Cole aqui múltiplos prompts separados por quebras de linha..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={15}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!content.trim() || isImporting}
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