# Sistema de Importação e Exportação de Prompts

## 📋 Visão Geral

Sistema completo para backup, migração e compartilhamento de prompts através de múltiplos formatos de arquivo.

## 🚀 Funcionalidades Implementadas

### 1. **Exportação de Prompts**

#### Formatos Suportados:

##### **JSON (Recomendado para Backup)**
- ✅ Preserva **todos os dados** incluindo IDs, datas e metadados
- ✅ Ideal para backup completo
- ✅ Reimportação sem perda de informações
- ✅ Estrutura organizada e legível

**Campos exportados:**
- Dados básicos: ID, título, categoria, subcategoria
- Conteúdo e descrição
- Tags: tags gerais, palavras-chave, tags de estilo, tags de assunto
- Metadados: público/privado, favorito, contagem de uso
- Timestamps: criado em, atualizado em
- IDs de usuário: criado por, atualizado por

##### **CSV (Para Planilhas)**
- ✅ Compatível com Excel e Google Sheets
- ✅ Fácil análise e edição em massa
- ⚠️ Arrays convertidos para texto separado por `;`
- ⚠️ Pode perder formatação especial

**Uso ideal:**
- Análise de dados
- Edição em massa
- Relatórios e estatísticas

##### **TXT (Para Leitura)**
- ✅ Formato legível e organizado
- ✅ Fácil de compartilhar e imprimir
- ✅ Inclui emojis e formatação visual
- ⚠️ Não ideal para reimportação

**Estrutura do TXT:**
```
========================================
PROMPT 1: Título do Prompt
========================================

📁 Categoria: Categoria / Subcategoria
📝 Descrição: Descrição do prompt
🏷️ Tags: tag1, tag2, tag3

📄 CONTEÚDO:
Conteúdo completo do prompt...

🎨 Tags de Estilo: style1, style2
🎯 Tags de Assunto: subject1, subject2

ℹ️ Informações:
   • Público: Sim/Não
   • Favorito: Sim/Não
   • Uso: X vezes
   • Criado em: DD/MM/YYYY HH:MM
   • Atualizado em: DD/MM/YYYY HH:MM
```

#### Como Exportar:

1. **Na página "Meus Prompts"** (`/my-prompts`):
   - Clique no botão "Exportar"
   - Selecione o formato desejado
   - Os prompts filtrados serão exportados

2. **Na página principal de Prompts** (`/prompts`):
   - Clique no botão "Exportar"
   - Selecione o formato
   - Exporta todos os prompts públicos visíveis

### 2. **Importação de Prompts**

#### Formatos Suportados:

##### **JSON** ⭐ Recomendado
- Importa backup completo com todos os metadados
- Validação automática da estrutura
- Converte automaticamente para o formato do sistema

##### **TXT / DOC / DOCX**
- Extrai texto de documentos
- Processa formatação básica
- Detecta automaticamente categorias no formato `**[Categoria]**`

##### **Excel / CSV**
- Processa planilhas com múltiplos prompts
- Concatena células de cada linha
- Separa por `|` automaticamente

##### **PDF**
- Extração de texto completa
- OCR em páginas escaneadas
- Processa até 50 páginas

#### Como Importar:

1. Clique em "Importar Prompts"
2. **Opção 1**: Faça upload de arquivo
   - Formatos: `.json`, `.txt`, `.doc`, `.docx`, `.pdf`, `.csv`, `.xlsx`
   - Processamento automático com barra de progresso
3. **Opção 2**: Cole o conteúdo manualmente
   - Útil para copiar/colar de outras fontes
4. Clique em "Importar"

#### Formato Esperado para Texto Manual:

```
**[Categoria/Subcategoria]**
**1. Prompt: Título do Prompt**

Conteúdo do prompt aqui...

---

**[Outra Categoria]**
**2. Prompt: Outro Título**

Outro conteúdo aqui...
```

### 3. **Backup Completo**

#### Como Fazer Backup:

1. Vá para "Meus Prompts"
2. Clique em "Exportar"
3. Selecione **JSON**
4. O arquivo será salvo como: `meus-prompts-YYYY-MM-DD.json`

#### Como Restaurar Backup:

1. Clique em "Importar Prompts"
2. Selecione o arquivo `.json` do backup
3. O sistema validará e processará automaticamente
4. Os prompts serão importados preservando todos os dados

## 🛠️ Arquitetura Técnica

### Arquivos Principais:

```
src/
├── lib/
│   └── export-utils.ts       # Utilitários de exportação/importação
├── components/prompts/
│   ├── ExportDialog.tsx       # Dialog de exportação
│   └── ImportDialog.tsx       # Dialog de importação (melhorado)
└── pages/
    ├── MyPrompts.tsx          # Página com botões de import/export
    └── Prompts.tsx            # Página pública com export
```

### Funções Principais:

#### `export-utils.ts`:
- `exportToJSON(prompts)` - Exporta para JSON
- `exportToCSV(prompts)` - Exporta para CSV
- `exportToTXT(prompts)` - Exporta para TXT formatado
- `exportPrompts({ format, prompts, filename })` - Função principal
- `validatePromptsJSON(json)` - Valida estrutura JSON
- `normalizeImportedPrompts(prompts)` - Normaliza dados importados

## 📊 Casos de Uso

### 1. **Migração Entre Sistemas**
```javascript
// Exportar tudo em JSON
exportPrompts({
  format: 'json',
  prompts: allPrompts,
  filename: 'migration-backup'
});

// Importar em outro sistema
// Basta fazer upload do arquivo JSON
```

### 2. **Análise em Planilha**
```javascript
// Exportar para CSV
exportPrompts({
  format: 'csv',
  prompts: allPrompts,
  filename: 'prompts-analysis'
});

// Abrir no Excel/Google Sheets para análise
```

### 3. **Compartilhamento Legível**
```javascript
// Exportar para TXT
exportPrompts({
  format: 'txt',
  prompts: selectedPrompts,
  filename: 'prompts-para-compartilhar'
});

// Enviar o arquivo TXT por email ou mensagem
```

### 4. **Backup Automático Diário**
```javascript
// Agendar exportação diária
const dailyBackup = () => {
  exportPrompts({
    format: 'json',
    prompts: allPrompts,
    filename: `backup-${new Date().toISOString().split('T')[0]}`
  });
};
```

## 🔒 Segurança

### Validações Implementadas:

1. **Validação de Formato**
   - Verifica se o JSON é um array válido
   - Valida campos obrigatórios (title, content)
   - Sanitiza dados antes de importar

2. **Escape de Caracteres**
   - CSV: Escape de vírgulas, aspas e quebras de linha
   - Previne injection attacks

3. **Normalização de Dados**
   - Converte diferentes formatos de campo (camelCase, snake_case)
   - Garante tipos corretos (arrays, booleanos, números)

## 📈 Melhorias Futuras

- [ ] Exportação seletiva (checkbox para escolher prompts)
- [ ] Agendamento automático de backups
- [ ] Compressão ZIP para múltiplos arquivos
- [ ] Preview antes de importar
- [ ] Merge inteligente (evitar duplicatas)
- [ ] Histórico de importações/exportações
- [ ] Exportação para Markdown
- [ ] Integração com Google Drive / Dropbox

## 🐛 Solução de Problemas

### Erro: "O arquivo deve conter um array de prompts"
**Solução**: Certifique-se que o JSON está no formato correto:
```json
[
  {
    "title": "Prompt 1",
    "content": "Conteúdo..."
  }
]
```

### Erro: "Os prompts devem ter pelo menos title e content"
**Solução**: Cada prompt precisa ter no mínimo:
```json
{
  "title": "Título obrigatório",
  "content": "Conteúdo obrigatório"
}
```

### Arquivo CSV com caracteres estranhos
**Solução**: O arquivo é gerado em UTF-8. Ao abrir no Excel:
1. Vá em "Dados" > "Importar de Texto"
2. Selecione o arquivo CSV
3. Escolha codificação UTF-8

## 📞 Suporte

Para problemas ou sugestões relacionadas ao sistema de import/export:
- Verifique os console logs do navegador (F12)
- Confira se o formato do arquivo está correto
- Teste com um arquivo pequeno primeiro
