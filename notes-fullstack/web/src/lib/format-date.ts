import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'

export function formatNoteDate(date: string, mode: 'short' | 'full' | 'relative' = 'short') {
  const parsed = new Date(date)

  if (mode === 'relative') {
    return formatDistanceToNow(parsed, { addSuffix: true, locale: ptBR })
  }

  if (mode === 'full') {
    return format(parsed, 'PPpp', { locale: ptBR })
  }

  return format(parsed, 'PP', { locale: ptBR })
}
