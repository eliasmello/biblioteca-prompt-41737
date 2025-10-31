import { z } from 'zod';

// Invitation Schema
export const invitationSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),
  email: z.string()
    .trim()
    .email('Email inválido')
    .max(255, 'Email muito longo')
    .toLowerCase(),
  role: z.string().refine(
    (val) => ['user', 'admin', 'master'].includes(val),
    { message: 'Role inválida' }
  )
});

// Registration Schema
export const registrationSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  email: z.string()
    .trim()
    .email('Email inválido')
    .max(255, 'Email muito longo'),
  message: z.string()
    .trim()
    .max(1000, 'Mensagem muito longa')
    .optional()
});

// Password Schema
export const passwordSchema = z.string()
  .min(8, 'Senha deve ter pelo menos 8 caracteres')
  .max(100, 'Senha muito longa')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'Senha deve conter pelo menos um número');

// Prompt Import Schema
export const importedPromptSchema = z.object({
  title: z.string().trim().min(3, 'Título muito curto').max(200, 'Título muito longo'),
  content: z.string().trim().min(10, 'Conteúdo muito curto').max(50000, 'Conteúdo muito longo'),
  category: z.string().trim().min(1, 'Categoria obrigatória').max(100, 'Categoria muito longa'),
  subcategory: z.string().trim().max(100, 'Subcategoria muito longa').optional(),
  description: z.string().trim().max(1000, 'Descrição muito longa').optional(),
  tags: z.array(z.string().max(50, 'Tag muito longa')).max(20, 'Máximo 20 tags').optional(),
  keywords: z.array(z.string().max(50, 'Keyword muito longa')).max(20, 'Máximo 20 keywords').optional(),
  style_tags: z.array(z.string().max(50)).max(20).optional(),
  subject_tags: z.array(z.string().max(50)).max(20).optional()
});

export const importArraySchema = z.array(importedPromptSchema).max(100, 'Máximo 100 prompts por importação');
