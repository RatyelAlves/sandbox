import z from 'zod'

export const createNoteSchema = z.object({
  title: z.string().max(120).optional().default(''),
  content: z.string().min(1, 'Conteúdo é obrigatório.'),
})

export const updateNoteSchema = z.object({
  title: z.string().max(120).optional(),
  content: z.string().min(1, 'Conteúdo é obrigatório.').optional(),
}).refine((data) => data.title !== undefined || data.content !== undefined, {
  message: 'Informe título ou conteúdo para atualizar.',
})

export const noteIdParamsSchema = z.object({
  id: z.string().uuid(),
})

export const listNotesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(9),
  search: z.string().optional().default(''),
})
